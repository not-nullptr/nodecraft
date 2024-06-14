// tcp server
import { createConnection, createServer } from "net";
import {
	PacketReader,
	PacketWriter,
	constructPacket,
	createVarInt,
} from "./util/packet";
import { StatusBuilder, TextComponent } from "./util/status";
import { CpuInfo, cpus, totalmem } from "os";
import { TextBuilder, TextEffect } from "./util/text";
import { Game, Player, PlayerActions } from "./util/player";
import { Chunk } from "./util/world";
import {
	Block,
	Difficulty,
	EntityAnimation,
	Gamemode,
	PlayerAction,
} from "./util/enum";
import { readFileSync, writeFile, writeFileSync } from "fs";
import config from "../config.json";
import { Prefix, log } from "./util/log";

function hashStringToNumber(str: string) {
	// Simple hash function
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash |= 0; // Convert to 32bit integer
	}
	// Map hash to a number between 0 and 9
	return Math.abs(hash) % 10;
}

const port = 25565;

export enum State {
	Handshaking,
	Status,
	Login,
	Configuration,
	Play,
}

export const PacketType = {
	ServerBound: {
		[State.Handshaking]: {
			Handshake: 0x00,
		},
		[State.Status]: {
			Status: 0x00,
			Ping: 0x01,
		},
		[State.Login]: {
			LoginStart: 0x00,
			EncryptionResponse: 0x01,
			LoginPluginResponse: 0x02,
			LoginAcknowledged: 0x03,
		},
		[State.Configuration]: {
			ClientInformation: 0x00,
			PluginMessage: 0x01,
			AcknowledgeFinishConfiguration: 0x02,
		},
		[State.Play]: {
			ConfirmTeleportation: 0x00,
			QueryBlockEntityTag: 0x01,
			ChangeDifficulty: 0x02,
			AcknowledgeMessage: 0x03,
			ChatCommand: 0x04,
			ChatMessage: 0x05,
			PlayerSession: 0x06,
			ChunkBatchReceived: 0x07,
			ClientStatus: 0x08,
			ClientInformation: 0x09,
			CommandSuggestionsRequest: 0x0a,
			AcknowledgeConfiguration: 0x0b,
			ClickContainerButton: 0x0c,
			ClickContainer: 0x0d,
			CloseContainer: 0x0e,
			ChangeContainerSlotState: 0x0f,
			ServerboundPluginMessage: 0x10,
			EditBook: 0x11,
			QueryEntityTag: 0x12,
			Interact: 0x13,
			JigsawGenerate: 0x14,
			ServerboundKeepAlive: 0x15,
			LockDifficulty: 0x16,
			SetPlayerPosition: 0x17,
			SetPlayerPositionandRotation: 0x18,
			SetPlayerRotation: 0x19,
			SetPlayerOnGround: 0x1a,
			MoveVehicle: 0x1b,
			PaddleBoat: 0x1c,
			PickItem: 0x1d,
			PingRequest: 0x1e,
			PlaceRecipe: 0x1f,
			PlayerAbilities: 0x20,
			PlayerAction: 0x21,
			PlayerCommand: 0x22,
			PlayerInput: 0x23,
			Pong: 0x24,
			ChangeRecipeBookSettings: 0x25,
			SetSeenRecipe: 0x26,
			RenameItem: 0x27,
			ResourcePackResponse: 0x28,
			SeenAdvancements: 0x29,
			SelectTrade: 0x2a,
			SetBeaconEffect: 0x2b,
			SetHeldItem: 0x2c,
			ProgramCommandBlock: 0x2d,
			ProgramCommandBlockMinecart: 0x2e,
			SetCreativeModeSlot: 0x2f,
			ProgramJigsawBlock: 0x30,
			ProgramStructureBlock: 0x31,
			UpdateSign: 0x32,
			SwingArm: 0x33,
			TeleportToEntity: 0x34,
			UseItemOn: 0x35,
			UseItem: 0x36,
		},
	},
	ClientBound: {
		[State.Handshaking]: {
			Handshake: 0x00,
		},
		[State.Status]: {
			Status: 0x00,
			Ping: 0x01,
		},
		[State.Login]: {
			Disconnect: 0x00,
			EncryptionRequest: 0x01,
			LoginSuccess: 0x02,
		},
		[State.Configuration]: {
			PluginMessage: 0x00,
			FinishConfiguration: 0x02,
			FeatureFlags: 0x08,
		},
		[State.Play]: {
			BundleDelimiter: 0x00,
			SpawnEntity: 0x01,
			SpawnExperienceOrb: 0x02,
			EntityAnimation: 0x03,
			AwardStatistics: 0x04,
			AcknowledgeBlockChange: 0x05,
			SetBlockDestroyStage: 0x06,
			BlockEntityData: 0x07,
			BlockAction: 0x08,
			BlockUpdate: 0x09,
			BossBar: 0x0a,
			ChangeDifficulty: 0x0b,
			ChunkBatchFinished: 0x0c,
			ChunkBatchStart: 0x0d,
			ChunkBiomes: 0x0e,
			ClearTitles: 0x0f,
			CommandSuggestionsResponse: 0x10,
			Commands: 0x11,
			CloseContainer: 0x12,
			SetContainerContent: 0x13,
			SetContainerProperty: 0x14,
			SetContainerSlot: 0x15,
			SetCooldown: 0x16,
			ChatSuggestions: 0x17,
			ClientboundPluginMessage: 0x18,
			DamageEvent: 0x19,
			DeleteMessage: 0x1a,
			Disconnect: 0x1b,
			DisguisedChatMessage: 0x1c,
			EntityEvent: 0x1d,
			Explosion: 0x1e,
			UnloadChunk: 0x1f,
			GameEvent: 0x20,
			OpenHorseScreen: 0x21,
			HurtAnimation: 0x22,
			InitializeWorldBorder: 0x23,
			ClientboundKeepAlive: 0x24,
			ChunkDataandUpdateLight: 0x25,
			WorldEvent: 0x26,
			Particle: 0x27,
			UpdateLight: 0x28,
			Login: 0x29,
			MapData: 0x2a,
			MerchantOffers: 0x2b,
			UpdateEntityPosition: 0x2c,
			UpdateEntityPositionandRotation: 0x2d,
			UpdateEntityRotation: 0x2e,
			MoveVehicle: 0x2f,
			OpenBook: 0x30,
			OpenScreen: 0x31,
			OpenSignEditor: 0x32,
			Ping: 0x33,
			PingResponse: 0x34,
			PlaceGhostRecipe: 0x35,
			PlayerAbilities: 0x36,
			PlayerChatMessage: 0x37,
			EndCombat: 0x38,
			EnterCombat: 0x39,
			CombatDeath: 0x3a,
			PlayerInfoRemove: 0x3b,
			PlayerInfoUpdate: 0x3c,
			LookAt: 0x3d,
			SynchronizePlayerPosition: 0x3e,
			UpdateRecipeBook: 0x3f,
			RemoveEntities: 0x40,
			RemoveEntityEffect: 0x41,
			ResetScore: 0x42,
			RemoveResourcePack: 0x43,
			AddResourcePack: 0x44,
			Respawn: 0x45,
			SetHeadRotation: 0x46,
			UpdateSectionBlocks: 0x47,
			SelectAdvancementsTab: 0x48,
			ServerData: 0x49,
			SetActionBarText: 0x4a,
			SetBorderCenter: 0x4b,
			SetBorderLerpSize: 0x4c,
			SetBorderSize: 0x4d,
			SetBorderWarningDelay: 0x4e,
			SetBorderWarningDistance: 0x4f,
			SetCamera: 0x50,
			SetHeldItem: 0x51,
			SetCenterChunk: 0x52,
			SetRenderDistance: 0x53,
			SetDefaultSpawnPosition: 0x54,
			DisplayObjective: 0x55,
			SetEntityMetadata: 0x56,
			LinkEntities: 0x57,
			SetEntityVelocity: 0x58,
			SetEquipment: 0x59,
			SetExperience: 0x5a,
			SetHealth: 0x5b,
			UpdateObjectives: 0x5c,
			SetPassengers: 0x5d,
			UpdateTeams: 0x5e,
			UpdateScore: 0x5f,
			SetSimulationDistance: 0x60,
			SetSubtitleText: 0x61,
			UpdateTime: 0x62,
			SetTitleText: 0x63,
			SetTitleAnimationTimes: 0x64,
			EntitySoundEffect: 0x65,
			SoundEffect: 0x66,
			StartConfiguration: 0x67,
			StopSound: 0x68,
			SystemChatMessage: 0x69,
			SetTabListHeaderAndFooter: 0x6a,
			TagQueryResponse: 0x6b,
			PickupItem: 0x6c,
			TeleportEntity: 0x6d,
			SetTickingState: 0x6e,
			StepTick: 0x6f,
			UpdateAdvancements: 0x70,
			UpdateAttributes: 0x71,
			EntityEffect: 0x72,
			UpdateRecipes: 0x73,
			UpdateTags: 0x74,
		},
	},
} as const;

setInterval(Game.advanceTick, 50);

const server = createServer((socket) => {
	let state = State.Handshaking;
	let clientVersion: number;
	let player = new Player(socket);
	const handlers = {
		[State.Handshaking]: {
			[PacketType.ServerBound[State.Handshaking].Handshake]: (
				reader: PacketReader
			) => {
				const protocolVersion = reader.readVarInt();
				reader.readString();
				reader.readShort(); // port
				const newState = reader.readVarInt() as State;
				state = newState;
				clientVersion = protocolVersion;
				const newReader = new PacketReader(reader.getRemaining());
				newReader.addOffset(1);
				switch (state) {
					case State.Status:
						// call the state.status status handler
						handlers[state][PacketType.ServerBound[state].Status](
							newReader
						);
						break;
					case State.Login:
						handlers[state][
							PacketType.ServerBound[state].LoginStart
						](newReader);
						break;
				}
			},
		},
		[State.Status]: {
			[PacketType.ServerBound[State.Status].Status]: (
				reader: PacketReader
			) => {
				const packet = new PacketWriter(
					PacketType.ClientBound[State.Status].Status
				);
				const response = new StatusBuilder()
					.setDescription(
						new TextBuilder()
							.append({
								text: "CPU Info:",
								effects: [TextEffect.Bold, TextEffect.Yellow],
							})
							.append({
								text: [cpus()[0]]
									.map((cpu: CpuInfo) => {
										return `${cpu.model}`.trim();
									})
									.join(""),
								effects: [TextEffect.Red],
							})
							.newline()
							.append({
								text: "Memory Info:",
								effects: [TextEffect.Bold, TextEffect.Yellow],
							})
							.append({
								text: `${(
									totalmem() /
									1024 /
									1024 /
									1024
								).toFixed(2)} GB Total`,
								effects: [TextEffect.Red],
							})
							.buildAsTextComponent()
					)
					.setEnforcesSecureChat(false)
					.setMaxPlayers(100)
					.setPlayers([])
					.setPreviewsChat(false)
					.setVersion({
						name: `Node.js ${process.version} (${process.platform})`,
						protocol: clientVersion,
					})
					.build();
				packet.writeString(JSON.stringify(response));
				socket.write(packet.toBuffer());
			},
			[PacketType.ServerBound[State.Status].Ping]: (
				reader: PacketReader
			) => {
				const packet = new PacketWriter(
					PacketType.ClientBound[State.Status].Ping
				);
				packet.writeLong(reader.readLong());
				socket.write(packet.toBuffer());
			},
		},
		[State.Login]: {
			[PacketType.ServerBound[State.Login].LoginStart]: (
				reader: PacketReader
			) => {
				const username = reader.readString();
				const uuid = reader.readUUID();
				player.setUUID(uuid);
				player.completeLogin(username, uuid);
				// player.failConnection(
				// 	new TextBuilder()
				// 		.append({
				// 			text: "You need to log in to join the server",
				// 			effects: [TextEffect.Red],
				// 		})
				// 		.buildAsTextComponent()
				// );
			},
			[PacketType.ServerBound[State.Login].LoginAcknowledged]: (
				reader: PacketReader
			) => {
				state = State.Configuration;

				// const pluginMessagePacket = new PacketWriter(
				// 	PacketType.ClientBound[State.Configuration].PluginMessage
				// );

				// pluginMessagePacket.writeString("minecraft:brand");
				// pluginMessagePacket.writeBytes(Buffer.from("vanilla"));

				// socket.write(pluginMessagePacket.toBuffer());

				// const featurePacket = new PacketWriter(
				// 	PacketType.ClientBound[State.Configuration].FeatureFlags
				// );
				// featurePacket.writeVarInt(1);
				// featurePacket.writeString("minecraft:vanilla");

				// socket.write(featurePacket.toBuffer());

				socket.write(readFileSync("src/replay/reg-1.dat"));
				socket.write(readFileSync("src/replay/reg-2.dat"));

				const packet = new PacketWriter(
					PacketType.ClientBound[
						State.Configuration
					].FinishConfiguration
				);
				socket.write(packet.toBuffer());
			},
		},
		[State.Configuration]: {
			[PacketType.ServerBound[State.Configuration].ClientInformation]: (
				reader: PacketReader
			) => {},
			[PacketType.ServerBound[State.Configuration]
				.AcknowledgeFinishConfiguration]: async (
				reader: PacketReader
			) => {
				state = State.Play;

				socket.write(
					constructPacket("ClientBound", State.Play, "Login", {
						entityId: player.getEntityId(),
						isHardcore: false,
						dimensionNames: {
							arr: ["minecraft:overworld"],
							fn: (v, w) => w.writeString(v),
						},
						maxPlayers: 100,
						viewDistance: 10,
						simulationDistance: 10,
						reducedDebugInfo: false,
						enableRespawnScreen: true,
						doLimitedCrafting: false,
						dimensionType: "minecraft:overworld",
						dimensionName: "minecraft:overworld",
						hashedSeed: 0n,
						gameMode: Gamemode.Creative,
						previousGameMode: -1,
						isDebug: false,
						isFlat: false,
						hasDeathLocation: false,
						portalCooldown: 0,
					})
				);

				socket.write(
					constructPacket("ClientBound", State.Play, "GameEvent", {
						event: 13,
						data: 0x1f,
					})
				);

				socket.write(
					constructPacket(
						"ClientBound",
						State.Play,
						"SynchronizePlayerPosition",
						{
							position: player.getPosition(),
							rotation: {
								yaw: 0,
								pitch: 0,
							},
							flags: 0,
							teleportId: 0,
						}
					)
				);

				player.init();
			},
		},
		[State.Play]: {
			[PacketType.ServerBound[State.Play].SetPlayerPosition]: (
				reader: PacketReader
			) => {
				const x = reader.readDouble();
				const y = reader.readDouble();
				const z = reader.readDouble();
				const onGround = reader.readBoolean();
				player.onGround = onGround;
				player.setPosition({ x, y, z });
			},
			[PacketType.ServerBound[State.Play].SetPlayerPositionandRotation]: (
				reader: PacketReader
			) => {
				const x = reader.readDouble();
				const y = reader.readDouble();
				const z = reader.readDouble();
				const yaw = reader.readFloat();
				const pitch = reader.readFloat();
				const onGround = reader.readBoolean();
				player.onGround = onGround;
				player.setPosition({ x, y, z });
				player.setRotation(yaw, pitch);
			},
			[PacketType.ServerBound[State.Play].SetPlayerRotation]: (
				reader: PacketReader
			) => {
				const yaw = reader.readFloat();
				const pitch = reader.readFloat();
				const onGround = reader.readBoolean();
				player.onGround = onGround;
				player.setRotation(yaw, pitch + 360);
			},
			[PacketType.ServerBound[State.Play].PlayerCommand]: (
				reader: PacketReader
			) => {
				reader.readVarInt(); // plr id
				const actionId = reader.readVarInt() as PlayerAction;
				player.setAction(actionId);
			},
			[PacketType.ServerBound[State.Play].ChatMessage]: (
				reader: PacketReader
			) => {
				const message = reader.readString();
				const colors = [
					"red",
					"green",
					"blue",
					"yellow",
					"purple",
					"aqua",
					"gray",
					"gold",
					"white",
				];
				Game.addChatMessage(
					new TextComponent("", [
						{
							text: `[`,
							color: "gray",
						},
						{
							text: player.getUsername(),
							color: colors[
								hashStringToNumber(player.getUsername())
							],
						},
						{
							text: `] `,
							color: "gray",
						},
						{
							text: message,
							color: "white",
						},
					])
				);
			},
			[PacketType.ServerBound[State.Play].SwingArm]: (
				reader: PacketReader
			) => {
				const hand = reader.readVarInt();
				player.animate(
					hand
						? EntityAnimation.SwingOffhand
						: EntityAnimation.SwingMainArm
				);
			},
			[PacketType.ServerBound[State.Play].Interact]: (
				reader: PacketReader
			) => {
				player.animate(EntityAnimation.SwingMainArm);
			},
			[PacketType.ServerBound[State.Play].SetCreativeModeSlot]: (
				reader: PacketReader
			) => {
				const slot = reader.readShort();
				const item = reader.readSlot();
				player.setSlot(slot, item);
			},
			[PacketType.ServerBound[State.Play].UseItemOn]: (
				reader: PacketReader
			) => {
				const hand = reader.readVarInt();
				const position = reader.readPosition();
				const face = reader.readVarInt();
				switch (face) {
					case 0:
						position.y--;
						break;
					case 1:
						position.y++;
						break;
					case 2:
						position.z--;
						break;
					case 3:
						position.z++;
						break;
					case 4:
						position.x--;
						break;
					case 5:
						position.x++;
						break;
				}
				log(Prefix.DEBUG, "Placing block at", position);
				Game.getPlayers().forEach(async (p) => {
					await p.onReady;
					p.socket.write(
						constructPacket(
							"ClientBound",
							State.Play,
							"BlockUpdate",
							{
								location: {
									x: position.x,
									y: position.y,
									z: position.z,
								},
								blockId: 1,
							}
						)
					);
				});
			},
		},
	};
	socket.on("data", (data) => {
		const reader = new PacketReader(data);
		const packetId = reader.readVarInt() as number;
		const packets = PacketType.ServerBound[state];
		if (!packets) {
			console.log(
				"Invalid state:",
				State[state],
				"(did you forget to handle this state?)"
			);
			return;
		}
		const name = Object.keys(packets).find(
			(key) => packets[key as keyof typeof packets] === packetId
		);
		if (config.debugLevel > 1)
			log(
				Prefix.DEBUG,
				`Packet type: ${name || `0x${packetId.toString(16)}`}`
			);
		// @ts-expect-error
		if (handlers?.[state]?.[packetId]) {
			try {
				// @ts-expect-error
				handlers[state][packetId](reader);
			} catch (e) {
				console.error(e);
			}
		} else {
			log(
				Prefix.ERROR,
				"Unhandled packet of type",
				name || `0x${packetId.toString(16)}`
			);
		}
	});

	socket.on("close", () => {
		player.cleanup();
	});

	socket.on("error", (err) => {
		console.error(err);
	});
});

server.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});

const interceptor = createServer((socket) => {
	// open a connection to the original server, running on 25565
	const target = createConnection({ port: 25565 });
	// when the original server sends data, send it to the client

	target.on("data", (data) => {
		socket.write(data);
		console.log(data);
	});
	// when the client sends data, send it to the original server
	socket.on("data", (data) => {
		target.write(data);
	});
	// when the original server closes, close the client
	target.on("close", () => {
		socket.end();
	});
	// when the client closes, close the original server
	socket.on("close", () => {
		target.end();
	});
});

// interceptor.listen(25566, () => console.log("Intercepting on 25566"));
