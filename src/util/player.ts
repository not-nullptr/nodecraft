import { Socket } from "net";
import { TextComponent } from "./status";
import { PacketWriter, constructPacket } from "./packet";
import { TextBuilder, TextEffect } from "./text";
import { PacketType, State } from "..";
import { Chunk, World } from "./world";
import {
	EntityAnimation,
	EntityType,
	Gamemode,
	MetadataType,
	Pose,
} from "./enum";
import { Entity } from "./entity";
import getUuidByString from "uuid-by-string";
import { PlayerAction as PA } from "./enum";
import { Prefix, log } from "./log";

const formatMemoryUsage = (data: number) =>
	`${Math.round((data / 1024 / 1024) * 100) / 100} MB`;

type Without<T, K> = Pick<T, Exclude<keyof T, K>>;

export enum PlayerActions {
	AddPlayer = 0x01,
	InitializeChat = 0x02,
	UpdateGameMode = 0x04,
	UpdateListed = 0x08,
	UpdateLatency = 0x10,
	UpdateDisplayName = 0x20,
}

interface AddPlayer {
	type: PlayerActions.AddPlayer;
	name: string;
	properties: {
		name: string;
		value: string;
		isSigned: boolean;
		signature?: string;
	}[];
}

interface InitializeChat {
	type: PlayerActions.InitializeChat;
	hasSignatureData: boolean;
	chatSessionID?: string;
	publicKeyExpiryTime?: number;
	encodedPublicKey?: number[];
	publicKeySignature?: number[];
}

interface UpdateGameMode {
	type: PlayerActions.UpdateGameMode;
	gameMode: number;
}

interface UpdateListed {
	type: PlayerActions.UpdateListed;
	listed: boolean;
}

interface UpdateLatency {
	type: PlayerActions.UpdateLatency;
	latency: number;
}

interface UpdateDisplayName {
	type: PlayerActions.UpdateDisplayName;
	hasDisplayName: boolean;
	displayName?: TextComponent;
}

type PlayerAction =
	| AddPlayer
	| InitializeChat
	| UpdateGameMode
	| UpdateListed
	| UpdateLatency
	| UpdateDisplayName;

type PlayerActionData<T extends PlayerActions> =
	T extends PlayerActions.AddPlayer
		? AddPlayer
		: T extends PlayerActions.InitializeChat
		? InitializeChat
		: T extends PlayerActions.UpdateGameMode
		? UpdateGameMode
		: T extends PlayerActions.UpdateListed
		? UpdateListed
		: T extends PlayerActions.UpdateLatency
		? UpdateLatency
		: T extends PlayerActions.UpdateDisplayName
		? UpdateDisplayName
		: never;

function playerActionToByte(actions: PlayerActions[]): number {
	let actionsByte = 0;
	for (const action of actions) {
		actionsByte |= action;
	}
	return actionsByte;
}

export class Game {
	private static players: Player[] = [];
	private static tick = 0;
	private static chatHistory: TextComponent[] = [];

	public static addChatMessage(message: TextComponent) {
		this.chatHistory.push(message);
		this.players.forEach((player) => {
			player.socket.write(
				constructPacket(
					"ClientBound",
					State.Play,
					"SystemChatMessage",
					{
						message,
						actionBar: false,
					}
				)
			);
		});
	}

	public static advanceTick() {
		Game.tick = (Game.tick + 1) % 20;
		Game.players.forEach((player) => {
			player.tick();
		});
	}

	public static getTick() {
		return this.tick;
	}

	public static getPlayers() {
		return this.players;
	}

	public static addPlayer(player: Player) {
		this.players.push(player);
		// inform each client about the new player
		this.players.forEach(async (p) => {
			if (p === player) return;
			await p.onReady;
			await player.onReady;
			player.flushActions();
			p.socket.write(player.toPacket());
		});
		// inform the new player about each client
		this.players.forEach(async (p) => {
			if (p === player) return;
			await p.onReady;
			await player.onReady;
			p.flushActions();
			player.socket.write(p.toPacket());
		});
	}

	public static removePlayer(player: Player) {
		const index = this.players.indexOf(player);
		if (index !== -1) {
			this.players.splice(index, 1);
		}
	}
}

const defaultPos = { x: 0, y: 7, z: 0 };

export class Player extends Entity {
	public readonly socket: Socket;
	private username: string = "";
	private actions: PlayerAction[] = [];
	private keepAliveId = 0n;
	private ingame = false;
	private keepAliveInterval: NodeJS.Timeout | null = null;
	public onReady: Promise<void> = new Promise((resolve) => {
		this.resolveReady = resolve;
	});
	private resolveReady!: () => void;
	public onGround = true;

	constructor(socket: Socket) {
		super(EntityType.Player, defaultPos, "");
		this.socket = socket;
		// random number 0 - 2048
		Game.addPlayer(this);
	}

	public getUsername() {
		return this.username;
	}

	public animate(animation: EntityAnimation) {
		Game.getPlayers().forEach((p) => {
			if (p === this) return;
			p.socket.write(
				constructPacket("ClientBound", State.Play, "EntityAnimation", {
					entityId: this.getEntityId(),
					animation,
				})
			);
		});
	}

	public failConnection(reason: TextComponent) {
		const packet = new PacketWriter(
			PacketType.ClientBound[State.Login].Disconnect
		);
		packet.writeString(reason);
		this.socket.write(packet.toBuffer());
	}

	public setAction(action: PA) {
		const metadata = this.metadata.getMetadata();
		const stateMaskMeta = metadata.find((md) => md.index === 0);
		const stateMask = stateMaskMeta ? stateMaskMeta.value : 0;
		switch (action) {
			case PA.StartSneaking: {
				this.metadata.addMetadata([
					{
						index: 0,
						type: MetadataType.Byte,
						value: stateMask | 0x02,
					},
					{
						index: 6,
						type: MetadataType.Pose,
						value: Pose.SNEAKING,
					},
				]);
				break;
			}
			case PA.StopSneaking: {
				this.metadata.addMetadata([
					{
						index: 0,
						type: MetadataType.Byte,
						value: stateMask & ~0x02,
					},
					{
						index: 6,
						type: MetadataType.Pose,
						value: Pose.STANDING,
					},
				]);
				break;
			}
			case PA.StartSprinting: {
				this.metadata.addMetadata([
					{
						index: 0,
						type: MetadataType.Byte,
						value: stateMask | 0x08,
					},
				]);
				break;
			}
			case PA.StopSprinting: {
				this.metadata.addMetadata([
					{
						index: 0,
						type: MetadataType.Byte,
						value: stateMask & ~0x08,
					},
				]);
				break;
			}
		}
	}

	public addAction<T extends PlayerActions>(
		action: T,
		d: Omit<PlayerActionData<T>, "type">
	) {
		// @ts-expect-error
		this.actions.push({
			...d,
			type: action,
		});
	}

	public flushActions() {
		const packet = new PacketWriter(
			PacketType.ClientBound[State.Play].PlayerInfoUpdate
		);
		const types = this.actions.map((action) => action.type);
		packet.writeByte(playerActionToByte(types));
		packet.writeVarInt(1); // Number of players (Array)
		packet.writeUUID(this.uuid); // Player UUID
		for (const action of this.actions) {
			switch (action.type) {
				case PlayerActions.AddPlayer: {
					packet.writeString(action.name);
					packet.writeVarInt(action.properties.length);
					for (const property of action.properties) {
						packet.writeString(property.name);
						packet.writeString(property.value);
						packet.writeBoolean(property.isSigned);
						if (property.isSigned) {
							packet.writeString(property.signature!);
						}
					}
					break;
				}

				case PlayerActions.InitializeChat: {
					packet.writeBoolean(action.hasSignatureData);
					if (action.hasSignatureData) {
						packet.writeUUID(action.chatSessionID!);
						packet.writeLong(BigInt(action.publicKeyExpiryTime!));
						packet.writeVarInt(action.encodedPublicKey!.length);
						for (const byte of action.encodedPublicKey!) {
							packet.writeByte(byte);
						}
						packet.writeVarInt(action.publicKeySignature!.length);
						for (const byte of action.publicKeySignature!) {
							packet.writeByte(byte);
						}
					}
					break;
				}

				case PlayerActions.UpdateGameMode: {
					packet.writeVarInt(action.gameMode);
					break;
				}

				case PlayerActions.UpdateListed: {
					packet.writeBoolean(action.listed);
					break;
				}

				case PlayerActions.UpdateLatency: {
					packet.writeVarInt(action.latency);
					break;
				}

				case PlayerActions.UpdateDisplayName: {
					packet.writeBoolean(action.hasDisplayName);
					if (action.hasDisplayName) {
						packet.writeString(JSON.stringify(action.displayName));
					}
					break;
				}
			}
		}
		Game.getPlayers().forEach((p) => {
			if (p === this) return;
			p.socket.write(packet.toBuffer());
		});
	}

	public completeLogin(username: string, uuid: string) {
		log(Prefix.PLAYERS, `Player ${username} has joined`);
		this.username = username;
		this.uuid = getUuidByString(`OfflinePlayer:${username}`, 3);
		const packet = new PacketWriter(
			PacketType.ClientBound[State.Login].LoginSuccess
		);
		packet.writeUUID(uuid);
		packet.writeString(username);
		packet.writeVarInt(0);
		this.socket.write(packet.toBuffer());
	}

	public init() {
		this.ingame = true;
		this.keepAliveInterval = setInterval(() => {
			const packet = new PacketWriter(
				PacketType.ClientBound[State.Play].ClientboundKeepAlive
			);
			packet.writeLong(this.keepAliveId);
			this.keepAliveId++;
			this.socket.write(packet.toBuffer());
		}, 5000);

		this.addAction(PlayerActions.AddPlayer, {
			name: this.username,
			properties: [],
		});

		this.addAction(PlayerActions.InitializeChat, {
			hasSignatureData: false,
		});

		this.addAction(PlayerActions.UpdateGameMode, {
			gameMode: Gamemode.Creative,
		});

		this.addAction(PlayerActions.UpdateListed, {
			listed: true,
		});

		this.addAction(PlayerActions.UpdateLatency, {
			latency: 0,
		});

		this.addAction(PlayerActions.UpdateDisplayName, {
			hasDisplayName: false,
		});

		this.flushActions();

		this.util.debugChunk();

		this.resolveReady();

		Game.addChatMessage(
			new TextComponent("", [
				{
					text: "[",
					color: "gray",
				},
				{
					text: "+",
					color: "green",
				},
				{
					text: "] ",
					color: "gray",
				},
				{
					text: this.username,
					color: "green",
				},
			])
		);

		Game.getPlayers().forEach(async (p) => {
			p.socket.write(this.toPacket());
			if (p === this) return;
			this.socket.write(p.toPacket());
		});
	}

	public cleanup() {
		if (!this.username) return;
		log(Prefix.PLAYERS, `Player ${this.username} has disconnected`);
		if (this.keepAliveInterval) {
			clearInterval(this.keepAliveInterval);
		}
		this.destroy();
		Game.removePlayer(this);
		Game.getPlayers().forEach(async (p) => {
			if (!this.username) return;
			await p.onReady;
			Game.addChatMessage(
				new TextComponent("", [
					{
						text: "[",
						color: "gray",
					},
					{
						text: "-",
						color: "red",
					},
					{
						text: "] ",
						color: "gray",
					},
					{
						text: this.username,
						color: "red",
					},
				])
			);
			// TODO: remove player entity
		});
	}

	public toPacket() {
		return constructPacket("ClientBound", State.Play, "SpawnEntity", {
			entityID: this.getEntityId(),
			entityUUID: `OfflinePlayer:${this.username}`,
			entityType: EntityType.Player,
			x: this.getPosition().x,
			y: this.getPosition().y,
			z: this.getPosition().z,
			pitch: 0,
			yaw: 0,
			velocityX: 0,
			velocityY: 0,
			velocityZ: 0,
			headYaw: 0,
			data: 0,
		});
	}

	public setUUID(uuid: string) {
		// this.uuid = uuid;
	}

	public getUUID() {
		return this.uuid;
	}

	public tick() {
		if (!this.ingame) return;
		this.util.sendDebugInfo();
	}

	public goto(x: number, y: number, z: number) {
		// synchronize player position
		this.socket.write(
			constructPacket(
				"ClientBound",
				State.Play,
				"SynchronizePlayerPosition",
				{
					position: {
						x,
						y,
						z,
					},
					rotation: {
						pitch: 0,
						yaw: 0,
					},
					flags: 0,
					teleportId: 0,
				}
			)
		);
		this.setPosition({ x, y, z });
	}

	public util = {
		debugChunk: () => {
			this.socket.write(
				constructPacket("ClientBound", State.Play, "SetCenterChunk", {
					chunkX: 0,
					chunkZ: 0,
				})
			);
			// const chunk = new Chunk(0, 0);
			// this.socket.write(chunk.toPacket());
			// write at -1, -1 to 1, 1
			for (let x = -4; x < 4; x++) {
				for (let z = -4; z < 4; z++) {
					const chunk = World.getChunk(x, z);
					if (chunk) {
						this.socket.write(chunk.toPacket());
						this.goto(defaultPos.x, defaultPos.y, defaultPos.z);
					}
				}
			}
			this.socket.write(
				constructPacket("ClientBound", State.Play, "EntityEffect", {
					entityId: this.getEntityId(),
					effectId: 15, // night vision
					amplifier: 40,
					duration: 1000000,
					flags: 0x02,
					hasFactorData: false,
				})
			);
		},
		sendDebugInfo: () => {
			const colors = {
				30: "green",
				60: "yellow",
				80: "red",
			};
			const memoryData = process.memoryUsage();
			const memoryUsage = {
				heapUsed: formatMemoryUsage(memoryData.heapUsed),
				heapTotal: formatMemoryUsage(memoryData.heapTotal),
			};
			const p = Math.round(
				(memoryData.heapUsed / memoryData.heapTotal) * 100
			);
			// 31 should be green
			// 61 should be yellow
			// 81 should be red
			let color = null;
			for (const [key, value] of Object.entries(colors)) {
				if (p >= parseInt(key)) {
					color = value;
				}
			}
			this.socket.write(
				constructPacket(
					"ClientBound",
					State.Play,
					"SystemChatMessage",
					{
						message: new TextComponent("", [
							{
								text: `${memoryUsage.heapUsed} / ${memoryUsage.heapTotal} (${p}%)`,
								color: color || "red",
							},
							{
								text: " | ",
								color: "gray",
							},
							{
								text: Math.round(
									this.getPosition().x
								).toString(),
								color: "red",
							},
							{
								text: ", ",
								color: "gray",
							},
							{
								text: Math.round(
									this.getPosition().y
								).toString(),
								color: "green",
							},
							{
								text: ", ",
								color: "gray",
							},
							{
								text: Math.round(
									this.getPosition().z
								).toString(),
								color: "blue",
							},
							{
								text: " | ",
								color: "gray",
							},
							{
								text: `Tick: ${Game.getTick()}`,
								color: "white",
							},
						]),
						actionBar: true,
					}
				)
			);
		},
	};
}
