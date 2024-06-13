import getUuidByString from "uuid-by-string";
import { PacketType, State } from "..";
import { EntityType, MetadataType, Pose } from "./enum";
import {
	PacketWriter,
	constructPacket,
	createVarInt,
	createVarLong,
} from "./packet";
import { Game } from "./player";

export let currentId = 0;

class EntityMetadata {
	private metadata: Buffer = Buffer.from([]);
	private _metadata: {
		index: number;
		type: MetadataType;
		value: any;
	}[] = [];

	constructor(private entityId: number) {}

	public addMetadata(
		metadata: {
			index: number;
			type: MetadataType;
			value: any;
		}[]
	) {
		this.metadata = Buffer.concat([
			this.metadata.slice(0, this.metadata.length - 1),
			generateMetadata(metadata),
			Buffer.from([0xff]),
		]);
		Game.getPlayers().forEach(async (p) => {
			await p.onReady;
			const packet = new PacketWriter(
				PacketType.ClientBound[State.Play].SetEntityMetadata
			);

			packet.writeVarInt(this.entityId);
			packet.writeBytes(this.metadata, false);
			p.socket.write(packet.toBuffer());
		});
		this._metadata.push(...metadata);
	}

	public removeMetadata(index: number) {
		this._metadata = this._metadata.filter((md) => md.index !== index);
		let newMetadata = Buffer.from([]);
		let metadata = this.metadata;
		let i = 0;
		while (i < metadata.length) {
			if (metadata[i] === index) {
				i += 2;
				while (metadata[i] !== 0xff) {
					i++;
				}
			} else {
				newMetadata = Buffer.concat([
					newMetadata,
					Buffer.from([metadata[i], metadata[i + 1]]),
				]);
				i += 2;
				while (metadata[i] !== 0xff) {
					newMetadata = Buffer.concat([
						newMetadata,
						Buffer.from([metadata[i]]),
					]);
					i++;
				}
				newMetadata = Buffer.concat([newMetadata, Buffer.from([0xff])]);
			}
		}
		this.metadata = newMetadata;
		Game.getPlayers().forEach(async (p) => {
			await p.onReady;
			const packet = new PacketWriter(
				PacketType.ClientBound[State.Play].SetEntityMetadata
			);

			packet.writeVarInt(this.entityId);
			packet.writeBytes(this.metadata, false);
			p.socket.write(packet.toBuffer());
		});
	}

	public getMetadata() {
		return this._metadata;
	}
}

export class Entity {
	private id = currentId++;
	private rotation: { yaw: number; pitch: number } = { yaw: 0, pitch: 0 };
	constructor(
		private readonly type: EntityType,
		private position: { x: number; y: number; z: number },
		public uuid: string
	) {}
	public metadata = new EntityMetadata(this.id);

	public toPacket() {
		return constructPacket("ClientBound", State.Play, "SpawnEntity", {
			entityID: this.id,
			entityUUID: crypto.randomUUID(),
			entityType: this.type,
			x: this.position.x,
			y: this.position.y,
			z: this.position.z,
			pitch: 0,
			yaw: 0,
			velocityX: 0,
			velocityY: 0,
			velocityZ: 0,
			headYaw: 0,
			data: 0,
		});
	}

	public getPosition(): { x: number; y: number; z: number } {
		return this.position;
	}

	public setPosition(position: { x: number; y: number; z: number }): void {
		let oldPosition = this.position;
		this.position = position;
		Game.getPlayers().forEach(async (player) => {
			if (player.getEntityId() === this.id) return;
			await player.onReady;
			const deltaX = (position.x * 32 - oldPosition.x * 32) * 128;
			const deltaY = (position.y * 32 - oldPosition.y * 32) * 128;
			const deltaZ = (position.z * 32 - oldPosition.z * 32) * 128;
			player.socket.write(
				constructPacket(
					"ClientBound",
					State.Play,
					"UpdateEntityPosition",
					{
						entityID: this.id,
						deltaX,
						deltaY,
						deltaZ,
						onGround: true,
					}
				)
			);
		});
	}

	public destroy(): void {
		Game.getPlayers().forEach(async (player) => {
			await player.onReady;
			player.socket.write(
				constructPacket("ClientBound", State.Play, "RemoveEntities", {
					entityIds: {
						arr: [this.id],
						fn: (x, w) => w.writeVarInt(x),
					},
				})
			);
		});
	}

	public getEntityId(): number {
		return this.id;
	}

	public setRotation(yaw: number, pitch: number): void {
		Game.getPlayers().forEach(async (player) => {
			if (player.getEntityId() === this.id) return;
			await player.onReady;
			player.socket.write(
				constructPacket(
					"ClientBound",
					State.Play,
					"UpdateEntityRotation",
					{
						entityID: this.id,
						// limit yaw between 360 - 720. wrap around
						yaw: ((yaw % 360) + 360) % 360,
						pitch: ((pitch % 360) + 360) % 360,
						onGround: true,
					}
				)
			);
			player.socket.write(
				constructPacket("ClientBound", State.Play, "SetHeadRotation", {
					entityID: this.id,
					headYaw: ((yaw % 360) + 360) % 360,
				})
			);
		});
	}
}

export const generateMetadata = (
	metadata: {
		index: number;
		type: MetadataType;
		value: any; // i trust you <3
	}[]
) => {
	let buf = Buffer.from([]);
	for (const md of metadata) {
		switch (md.type) {
			case MetadataType.Byte:
				buf = Buffer.concat([
					buf,
					Buffer.from([md.index, md.type, md.value]),
				]);
				break;
			case MetadataType.VarInt:
				buf = Buffer.concat([
					buf,
					Buffer.from([md.index, md.type]),
					Buffer.from(createVarInt(md.value)),
				]);
				break;
			case MetadataType.VarLong:
				buf = Buffer.concat([
					buf,
					Buffer.from([md.index, md.type]),
					Buffer.from(createVarLong(md.value)),
				]);
				break;
			case MetadataType.Float:
				buf = Buffer.concat([
					buf,
					Buffer.from([md.index, md.type]),
					Buffer.from([md.value]),
				]);
				break;
			case MetadataType.String:
				buf = Buffer.concat([
					buf,
					Buffer.from([md.index, md.type]),
					Buffer.from([md.value]),
				]);
				break;
			case MetadataType.TextComponent:
				buf = Buffer.concat([
					buf,
					Buffer.from([md.index, md.type]),
					Buffer.from([md.value]),
				]);
				break;
			case MetadataType.OptionalTextComponent:
				buf = Buffer.concat([
					buf,
					Buffer.from([md.index, md.type]),
					Buffer.from([md.value ? 1 : 0]),
					Buffer.from([md.value]),
				]);
				break;
			case MetadataType.Slot:
				buf = Buffer.concat([
					buf,
					Buffer.from([md.index, md.type]),
					Buffer.from([md.value]),
				]);
				break;
			case MetadataType.Boolean:
				buf = Buffer.concat([
					buf,
					Buffer.from([md.index, md.type]),
					Buffer.from([md.value ? 1 : 0]),
				]);
				break;
			case MetadataType.Rotations:
				buf = Buffer.concat([
					buf,
					Buffer.from([md.index, md.type]),
					Buffer.from([md.value]),
				]);
				break;
			case MetadataType.Position:
				buf = Buffer.concat([
					buf,
					Buffer.from([md.index, md.type]),
					Buffer.from([md.value]),
				]);
				break;
			case MetadataType.OptionalPosition:
				buf = Buffer.concat([
					buf,
					Buffer.from([md.index, md.type]),
					Buffer.from([md.value ? 1 : 0]),
					Buffer.from([md.value]),
				]);
				break;
			case MetadataType.Direction:
				buf = Buffer.concat([
					buf,
					Buffer.from([md.index, md.type]),
					Buffer.from(createVarInt(md.value)),
				]);
				break;
			case MetadataType.OptionalUUID:
				buf = Buffer.concat([
					buf,
					Buffer.from([md.index, md.type]),
					Buffer.from([md.value ? 1 : 0]),
					Buffer.from([md.value]),
				]);
				break;
			case MetadataType.BlockState:
				buf = Buffer.concat([
					buf,
					Buffer.from([md.index, md.type]),
					Buffer.from(createVarInt(md.value)),
				]);
				break;
			case MetadataType.OptionalBlockState:
				buf = Buffer.concat([
					buf,
					Buffer.from([md.index, md.type]),
					Buffer.from(createVarInt(md.value)),
				]);
				break;
			case MetadataType.NBT:
				buf = Buffer.concat([
					buf,
					Buffer.from([md.index, md.type]),
					Buffer.from([md.value]),
				]);
				break;
			default:
				buf = Buffer.concat([
					buf,
					Buffer.from([md.index, md.type]),
					Buffer.from([md.value]),
				]);
		}
	}
	return buf;
};
