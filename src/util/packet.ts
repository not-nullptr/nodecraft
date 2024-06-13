import uuid from "uuid";
import { Difficulty, EntityAnimation, EntityType } from "./enum";
import { TextComponent } from "./status";

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

const SEGMENT_BITS = 0x7f;
const CONTINUE_BIT = 0x80;

export const createVarInt = (value: number) => {
	let result: number[] = [];
	while (true) {
		if ((value & ~SEGMENT_BITS) === 0) {
			result.push(value);
			break;
		} else {
			result.push((value & SEGMENT_BITS) | CONTINUE_BIT);
			value = value >>> 7;
		}
	}
	return result;
};

export const createVarLong = (value: bigint) => {
	let result: number[] = [];
	while (true) {
		if ((value & ~BigInt(SEGMENT_BITS)) === BigInt(0)) {
			result.push(Number(value));
			break;
		} else {
			result.push(
				Number((value & BigInt(SEGMENT_BITS)) | BigInt(CONTINUE_BIT))
			);
			value = value >> BigInt(7);
		}
	}
	return result;
};

export class PacketReader {
	private offset = 0;
	private data: Buffer;
	public readonly length: number;

	constructor(data: Buffer, length = true) {
		this.data = data;
		if (length) this.length = this.readVarInt();
		else this.length = 0;
	}

	public readVarInt(): number {
		let value = 0;
		let position = 0;
		let currentByte: number;

		while (true) {
			currentByte = this.readByte();
			value |= (currentByte & SEGMENT_BITS) << position;

			if ((currentByte & CONTINUE_BIT) === 0) break;

			position += 7;

			if (position >= 32) throw new Error("VarInt is too big");
		}

		return value;
	}

	public read(byteLength: number): Buffer {
		const buffer = this.data.slice(this.offset, this.offset + byteLength);
		this.offset += byteLength;
		return buffer;
	}

	public readDouble(): number {
		const value = this.data.readDoubleBE(this.offset);
		this.offset += 8;
		return value;
	}

	public readFloat(): number {
		const value = this.data.readFloatBE(this.offset);
		this.offset += 4;
		return value;
	}

	public readBoolean(): boolean {
		return this.readByte() === 1;
	}

	public readUUID(): string {
		const msb = this.readLong();
		const lsb = this.readLong();
		const hex =
			(msb & BigInt("0xFFFFFFFFFFFF0000"))
				.toString(16)
				.padStart(16, "0") +
			(msb & BigInt("0x000000000000FFFF")).toString(16).padStart(4, "0") +
			(lsb & BigInt("0xFFFFFFFFFFFF0000"))
				.toString(16)
				.padStart(16, "0") +
			(lsb & BigInt("0x000000000000FFFF")).toString(16).padStart(4, "0");
		return [
			hex.slice(0, 8),
			hex.slice(8, 12),
			hex.slice(12, 16),
			hex.slice(16, 20),
			hex.slice(20),
		].join("-");
	}

	public readLong(): bigint {
		const value = this.data.readBigInt64BE(this.offset);
		this.offset += 8;
		return value;
	}

	private readByte(): number {
		return this.data[this.offset++];
	}

	public readString(): string {
		const length = this.readVarInt();
		const str = this.data.toString(
			"utf-8",
			this.offset,
			this.offset + length
		);
		this.offset += length;
		return str;
	}

	public readShort(): number {
		const value = this.data.readInt16BE(this.offset);
		this.offset += 2;
		return value;
	}

	public getRemaining(): Buffer {
		return this.data.slice(this.offset);
	}

	public addOffset(offset: number): void {
		this.offset += offset;
	}
}

export class BufferWriter {
	private data: Buffer;
	private offset = 0;

	constructor() {
		this.data = Buffer.alloc(8192);
	}

	private ensureSpace(length: number): void {
		// if (this.offset + length > this.data.length) {
		// 	const newBuffer = Buffer.alloc(this.data.length * 2);
		// 	this.data.copy(newBuffer);
		// 	this.data = newBuffer;
		// }
		if (this.offset + length > this.data.length) {
			while (this.offset + length > this.data.length) {
				this.data = Buffer.concat([this.data, Buffer.alloc(8192)]);
			}
		}
	}

	public writeVarInt(value: number): void {
		while (true) {
			if ((value & ~SEGMENT_BITS) === 0) {
				this.writeByte(value);
				return;
			} else {
				this.writeByte((value & SEGMENT_BITS) | CONTINUE_BIT);
				value = value >>> 7;
			}
		}
	}

	public writeShort(value: number): void {
		// const buffer = Buffer.alloc(2);
		// buffer.writeInt16BE(value, 0);
		// this.data = Buffer.cosncat([this.data, buffer]);
		// this.offset += 2;
		this.ensureSpace(2);
		this.data.writeInt16BE(value, this.offset);
		this.offset += 2;
	}

	public writePosition(x: number, y: number, z: number): void {
		/*
		x as a 26-bit integer, followed by z as a 26-bit integer, followed by y as a 12-bit integer (all signed, two's complement). See also the section below.
		*/
		const value = BigInt(
			((x & 0x3ffffff) << 38) | ((z & 0x3ffffff) << 12) | (y & 0xfff)
		);
		this.writeLong(value);
	}

	public writeVarLong(value: number): void {
		while (true) {
			if ((value & ~SEGMENT_BITS) === 0) {
				this.writeByte(value);
				return;
			} else {
				this.writeByte((value & SEGMENT_BITS) | CONTINUE_BIT);
				value = value >>> 7;
			}
		}
	}

	public writeDouble(value: number): void {
		// const buffer = Buffer.alloc(8);
		// buffer.writeDoubleBE(value, 0);
		// this.data = Buffer.concat([this.data, buffer]);
		// this.offset += 8;
		this.ensureSpace(8);
		this.data.writeDoubleBE(value, this.offset);
		this.offset += 8;
	}

	public writeInt(value: number): void {
		// const buffer = Buffer.alloc(4);
		// buffer.writeInt32BE(value, 0);
		// this.data = Buffer.concat([this.data, buffer]);
		// this.offset += 4;
		this.ensureSpace(4);
		this.data.writeInt32BE(value, this.offset);
		this.offset += 4;
	}

	public writeFloat(value: number): void {
		// const buffer = Buffer.alloc(4);
		// buffer.writeFloatBE(value, 0);
		// this.data = Buffer.concat([this.data, buffer]);
		// this.offset += 4;
		this.ensureSpace(4);
		this.data.writeFloatBE(value, this.offset);
		this.offset += 4;
	}

	public writeArray<T = any>(
		array: T[],
		writeFunc: (value: T) => void
	): void {
		this.writeVarInt(array.length);
		array.forEach((value) => writeFunc(value));
	}

	public writeBoolean(value: boolean): void {
		this.writeByte(value ? 1 : 0);
	}

	public writeLong(value: bigint): void {
		// const buffer = Buffer.alloc(8);
		// buffer.writeBigInt64BE(value, 0);
		// this.data = Buffer.concat([this.data, buffer]);
		// this.offset += 8;
		this.ensureSpace(8);
		this.data.writeBigInt64BE(value, this.offset);
		this.offset += 8;
	}

	public writeBytes(value: Buffer, length = true): void {
		// if (length) this.writeVarInt(value.length);
		// this.data = Buffer.concat([this.data, value]);
		// this.offset += value.length;
		if (length) this.writeVarInt(value.length);
		this.ensureSpace(value.length);
		value.copy(this.data, this.offset);
		this.offset += value.length;
	}

	public writeAngle(value: number): void {
		this.writeByte(Math.floor((value * 256) / 360) % 256);
	}

	public writeByte(value: number): void {
		// const buffer = Buffer.alloc(1);
		// buffer.writeUInt8(Math.max(0, Math.min(value, 255)), 0);
		// this.data = Buffer.concat([this.data, buffer]);
		// this.offset++;
		this.ensureSpace(1);
		this.data.writeUInt8(Math.min(value, 255), this.offset++);
	}

	public writeSignedByte(value: number): void {
		// two's complement
		// if (value < 0) value = 0xff + value + 1;
		// this.writeByte(value);
		this.ensureSpace(1);
		if (value < 0) value = 0xff + value + 1;
		this.data.writeUInt8(value, this.offset++);
	}

	public writeString(value: string | object): void {
		// if (typeof value !== "string") {
		// 	value = JSON.stringify(value);
		// }
		// this.writeVarInt(value.length);
		// const buffer = Buffer.from(value, "utf-8");
		// this.data = Buffer.concat([this.data, buffer]);
		// this.offset += buffer.length;
		if (typeof value !== "string") {
			value = JSON.stringify(value);
		}
		this.writeVarInt(value.length);
		this.ensureSpace(value.length);
		this.data.write(value, this.offset, "utf-8");
		this.offset += value.length;
	}

	public writeUUID(value: string): void {
		const hex = value.replace(/-/g, "");
		const buffer = Buffer.alloc(16);
		function writeHexToBuffer(
			hexStr: string,
			buffer: Buffer,
			offset: number
		) {
			for (let i = 0; i < hexStr.length; i += 2) {
				buffer[offset + i / 2] = parseInt(hexStr.substr(i, 2), 16);
			}
		}
		const msbHex = hex.slice(0, 16);
		const lsbHex = hex.slice(16);
		writeHexToBuffer(msbHex, buffer, 0);
		writeHexToBuffer(lsbHex, buffer, 8);
		this.data = Buffer.concat([this.data, buffer]);
		this.offset += 16;
	}

	public toBuffer(): Buffer {
		return this.data.slice(0, this.offset);
	}

	public getOffset(): number {
		return this.offset;
	}

	public getRawData(): Buffer {
		return this.data;
	}
}

export class PacketWriter extends BufferWriter {
	constructor(type: number) {
		super();
		this.writeVarInt(type);
	}

	public toBuffer(): Buffer {
		const length = createVarInt(this.getOffset());
		const buffer = Buffer.alloc(length.length + this.getOffset());
		length.forEach((byte, i) => buffer.writeUInt8(byte, i));
		this.getRawData().copy(buffer, length.length);
		return buffer.slice(0, this.getOffset() + length.length);
	}
}

type PacketDataMap = {
	ClientBound: {
		[State.Play]: {
			ChangeDifficulty: {
				difficulty: Difficulty;
				locked: boolean;
			};
			GameEvent: {
				event: number;
				data: number;
			};
			Login: {
				entityId: number;
				isHardcore: boolean;
				dimensionNames: {
					arr: string[];
					fn: (value: string, writer: PacketWriter) => void;
				};
				maxPlayers: number;
				viewDistance: number;
				simulationDistance: number;
				reducedDebugInfo: boolean;
				enableRespawnScreen: boolean;
				doLimitedCrafting: boolean;
				dimensionType: string;
				dimensionName: string;
				hashedSeed: bigint;
				gameMode: number;
				previousGameMode: number;
				isDebug: boolean;
				isFlat: boolean;
				hasDeathLocation: boolean;
				deathDimensionName?: string;
				deathLocation?: { x: number; y: number; z: number };
				portalCooldown: number;
			};
			SynchronizePlayerPosition: {
				position: { x: number; y: number; z: number };
				rotation: { yaw: number; pitch: number };
				flags: number;
				teleportId: number;
			};
			SystemChatMessage: {
				message: TextComponent;
				actionBar: boolean;
			};
			SpawnEntity: {
				entityID: number;
				entityUUID: string;
				entityType: EntityType;
				x: number;
				y: number;
				z: number;
				yaw: number;
				pitch: number;
				headYaw: number;
				data: number;
				velocityX: number;
				velocityY: number;
				velocityZ: number;
			};
			UpdateEntityPosition: {
				entityID: number;
				deltaX: number;
				deltaY: number;
				deltaZ: number;
				onGround: boolean;
			};
			UpdateEntityPositionandRotation: {
				entityID: number;
				deltaX: number;
				deltaY: number;
				deltaZ: number;
				yaw: number;
				pitch: number;
				onGround: boolean;
			};
			UpdateEntityRotation: {
				entityID: number;
				yaw: number;
				pitch: number;
				onGround: boolean;
			};
			SetHeadRotation: {
				entityID: number;
				headYaw: number;
			};
			SetEntityMetadata: {
				entityID: number;
				metadata: Buffer;
			};
			PlayerChatMessage: {
				sender: string;
				index: number;
				messageSignaturePresent: boolean;
				messageSignature?: Buffer;
				message: string;
				timestamp: bigint;
				salt: bigint;
				totalPreviousMessages: number;
				unsignedContentPresent: boolean;
				unsignedContent?: TextComponent;
				filterType: number;
				chatType: number;
				senderName: TextComponent;
				hasTargetName: boolean;
				targetName?: TextComponent;
			};
			EntityAnimation: {
				entityId: number;
				animation: EntityAnimation;
			};
			RemoveEntities: {
				entityIds: {
					arr: number[];
					fn: (value: number, writer: PacketWriter) => void;
				};
			};
			EntityEffect: {
				entityId: number;
				effectId: number;
				amplifier: number;
				duration: number;
				flags: number;
				hasFactorData: boolean;
			};
			SetCenterChunk: {
				chunkX: number;
				chunkZ: number;
			};
		};
	};
};

const PacketTypeMap: {
	[T in "ClientBound" | "ServerBound"]: {
		[U in State]: {
			// @ts-expect-error
			[V in keyof PacketDataMap[T][U]]: {
				// @ts-expect-error
				[W in keyof PacketDataMap[T][U][V]]:
					| "varint"
					| "string"
					| "long"
					| "short"
					| "double"
					| "int"
					| "float"
					| "array"
					| "boolean"
					| "bytes"
					| "byte"
					| "signed_byte"
					| "uuid"
					| "position"
					| "position_seperate"
					| "varlong"
					| "text_component"
					| "rotation"
					| "bytes_unprefixed"
					| "angle";
			};
		};
	};
} = {
	// @ts-expect-error
	ClientBound: {
		[State.Play]: {
			ChangeDifficulty: {
				difficulty: "byte",
				locked: "boolean",
			},
			GameEvent: {
				event: "byte",
				data: "float",
			},
			Login: {
				entityId: "int",
				isHardcore: "boolean",
				dimensionNames: "array",
				maxPlayers: "varint",
				viewDistance: "varint",
				simulationDistance: "varint",
				reducedDebugInfo: "boolean",
				enableRespawnScreen: "boolean",
				doLimitedCrafting: "boolean",
				dimensionType: "string",
				dimensionName: "string",
				hashedSeed: "long",
				gameMode: "byte",
				previousGameMode: "signed_byte",
				isDebug: "boolean",
				isFlat: "boolean",
				hasDeathLocation: "boolean",
				portalCooldown: "varint",
			},
			SynchronizePlayerPosition: {
				position: "position_seperate",
				rotation: "rotation",
				flags: "byte",
				teleportId: "varint",
			},
			SystemChatMessage: {
				message: "text_component",
				actionBar: "boolean",
			},
			SpawnEntity: {
				entityID: "varint",
				entityUUID: "uuid",
				entityType: "varint",
				x: "double",
				y: "double",
				z: "double",
				yaw: "angle",
				pitch: "angle",
				headYaw: "angle",
				data: "varint",
				velocityX: "short",
				velocityY: "short",
				velocityZ: "short",
			},
			UpdateEntityPosition: {
				entityID: "varint",
				deltaX: "short",
				deltaY: "short",
				deltaZ: "short",
				onGround: "boolean",
			},
			UpdateEntityPositionandRotation: {
				entityID: "varint",
				deltaX: "short",
				deltaY: "short",
				deltaZ: "short",
				yaw: "angle",
				pitch: "angle",
				onGround: "boolean",
			},
			UpdateEntityRotation: {
				entityID: "varint",
				yaw: "angle",
				pitch: "angle",
				onGround: "boolean",
			},
			SetHeadRotation: {
				entityID: "varint",
				headYaw: "angle",
			},
			SetEntityMetadata: {
				entityID: "varint",
				metadata: "bytes_unprefixed",
			},
			PlayerChatMessage: {
				sender: "uuid",
				index: "varint",
				messageSignaturePresent: "boolean",
				messageSignature: "bytes_unprefixed",
				message: "string",
				timestamp: "long",
				salt: "long",
				totalPreviousMessages: "varint",
				unsignedContentPresent: "boolean",
				unsignedContent: "text_component",
				filterType: "varint",
				chatType: "varint",
				senderName: "string",
				hasTargetName: "boolean",
				targetName: "text_component",
			},
			EntityAnimation: {
				entityId: "varint",
				animation: "byte",
			},
			RemoveEntities: {
				entityIds: "array",
			},
			EntityEffect: {
				entityId: "varint",
				effectId: "varint",
				amplifier: "byte",
				duration: "varint",
				flags: "byte",
				hasFactorData: "boolean",
			},
			SetCenterChunk: {
				chunkX: "varint",
				chunkZ: "varint",
			},
		},
	},
	// @ts-expect-error
	ServerBound: {},
};

type PacketData<
	T extends "ClientBound" | "ServerBound",
	U extends State,
	V extends keyof (typeof PacketType)[T][U]
> =
	// @ts-expect-error
	PacketDataMap[T][U][V];

export function constructPacket<
	T extends "ClientBound" | "ServerBound",
	U extends State,
	V extends keyof (typeof PacketType)[T][U]
>(type: T, state: U, packet: V, data: PacketData<T, U, V>): Buffer {
	const writer = new PacketWriter(
		PacketType[type][state][packet] as any // sure...
	);
	// @ts-expect-error
	const fields = PacketTypeMap[type]?.[state]?.[packet];
	if (!fields) throw new Error("Unimplemented packet");
	for (const field in fields) {
		const value = (data as any)[field];
		const fieldType = fields[field];
		if (value === undefined || typeof value === "undefined") continue;
		switch (fieldType) {
			case "varint":
				writer.writeVarInt(value);
				break;
			case "string":
				writer.writeString(value);
				break;
			case "long":
				writer.writeLong(value);
				break;
			case "short":
				writer.writeShort(value);
				break;
			case "double":
				writer.writeDouble(value);
				break;
			case "int":
				writer.writeInt(value);
				break;
			case "float":
				writer.writeFloat(value);
				break;
			case "array":
				writer.writeArray(value.arr, (v) => value.fn(v, writer));
				break;
			case "boolean":
				writer.writeBoolean(value);
				break;
			case "bytes":
				writer.writeBytes(value);
				break;
			case "byte":
				writer.writeByte(value);
				break;
			case "signed_byte":
				writer.writeSignedByte(value);
				break;
			case "uuid":
				writer.writeUUID(value);
				break;
			case "position":
				writer.writePosition(value.x, value.y, value.z);
				break;
			case "varlong":
				writer.writeVarLong(value);
				break;
			case "rotation":
				writer.writeFloat(value.yaw);
				writer.writeFloat(value.pitch);
				break;
			case "text_component":
				writer.writeBytes(value.toNetworkNBT(), false);
				break;
			case "angle":
				writer.writeAngle(value);
				break;
			case "position_seperate":
				writer.writeDouble(value.x);
				writer.writeDouble(value.y);
				writer.writeDouble(value.z);
				break;
			case "bytes_unprefixed":
				writer.writeBytes(value, false);
				break;
		}
	}
	return writer.toBuffer();
}
