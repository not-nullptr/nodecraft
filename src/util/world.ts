import Long from "long";
import { PacketType, State } from "..";
import { Block } from "./enum";
import { BufferWriter, PacketWriter } from "./packet";
import nbt, { long, longArray } from "prismarine-nbt";
import { writeFileSync } from "fs";
import { Prefix, log } from "./log";

abstract class Generator {
	constructor() {}
	public abstract generateAt(x: number, z: number): Chunk;
}

class FlatGenerator extends Generator {
	constructor() {
		super();
	}
	public generateAt(x: number, z: number): Chunk {
		const chunk = new Chunk(x, z);
		const section = new ChunkSection();
		section.fill(0, 0, 0, 15, 15, 15, Block.Stone);
		for (let y = 0; y < 24; y++) {
			chunk.setSection(y, section);
		}
		return chunk;
	}
}

class ChunkSection {
	private nonAirBlocks = 0;
	private blocks: Block[] = [];

	public setBlock(x: number, y: number, z: number, block: Block): void {
		const index = y * 16 * 16 + z * 16 + x;
		this.blocks[index] = block;
		this.nonAirBlocks++;
	}

	public getBlock(x: number, y: number, z: number): Block {
		const index = y * 16 * 16 + z * 16 + x;
		return this.blocks[index];
	}

	public fill(
		x1: number,
		y1: number,
		z1: number,
		x2: number,
		y2: number,
		z2: number,
		block: Block
	) {
		for (let x = x1; x <= x2; x++) {
			for (let y = y1; y <= y2; y++) {
				for (let z = z1; z <= z2; z++) {
					this.setBlock(x, y, z, block);
				}
			}
		}
	}

	constructor() {}

	toBuffer(): Buffer {
		const bpeBlocks = 15;
		const blocksPerLong = Math.floor(64 / bpeBlocks);
		const dataLength = Math.ceil(4096 / blocksPerLong);
		const data: bigint[] = Array(dataLength).fill(0n);

		/*
		for i in 0..blocks.len() {
   			data[i / blocks_per_long] |= blocks[i] << (bpe * (i % blocks_per_long));
		}
		*/
		for (let i = 0; i < this.blocks.length; i++) {
			const block = this.blocks[i];
			data[Math.floor(i / blocksPerLong)] |=
				BigInt(block || Block.Air) <<
				BigInt(bpeBlocks * (i % blocksPerLong));
		}

		const buffer = new BufferWriter();
		buffer.writeShort(this.nonAirBlocks); // block count
		// === block states ===
		// we're forcing direct type here. 15 bpe
		buffer.writeByte(bpeBlocks); // bpe
		// ...no palette, since we're using direct
		buffer.writeVarInt(data.length);

		for (const key in data) {
			buffer.writeLong(data[key]);
		}

		// === biomes ===
		buffer.writeByte(0); // bpe
		buffer.writeVarInt(39); // single valued palette (plains)
		buffer.writeVarInt(0); // data length

		return buffer.toBuffer();
	}

	layers(
		layers: {
			block: Block;
			height: number;
		}[]
	) {
		let y = 0;
		for (const layer of layers) {
			this.fill(0, y, 0, 15, y + (layer.height - 1), 15, layer.block);
			y += layer.height;
		}
	}
}

export class Chunk {
	// sections is an array of 24 sections, each 16x16x16
	constructor(public x: number, public z: number) {}
	private sections: ChunkSection[] = Array(24).fill(new ChunkSection());

	public setSection(y: number, section: ChunkSection): void {
		this.sections[y] = section;
	}

	public getBlock(x: number, y: number, z: number): Block {
		const section = this.sections[Math.floor(y / 16)];
		return section.getBlock(x, y % 16, z);
	}

	public setBlock(x: number, y: number, z: number, block: Block): void {
		const section = this.sections[Math.floor(y / 16)];
		section.setBlock(x, y % 16, z, block);
	}

	public getKey(): string {
		return `${this.x},${this.z}`;
	}

	public toPacket(): Buffer {
		const packet = new PacketWriter(
			PacketType.ClientBound[State.Play].ChunkDataandUpdateLight
		);
		packet.writeInt(this.x); // x
		packet.writeInt(this.z); // z
		packet.writeBytes(Buffer.from([0x0a, 0x00]), false); // heightmaps
		const dataBuf = Buffer.concat(this.sections.map((s) => s.toBuffer()));
		log(
			Prefix.DEBUG,
			`Section count: ${this.sections.length.toString().blue}`
		);
		packet.writeBytes(dataBuf); // data (w/ length)
		packet.writeVarInt(0); // # of block entities
		packet.writeVarInt(0); // sky light mask
		packet.writeVarInt(0); // block light mask
		packet.writeVarInt(0); // empty sky light mask
		packet.writeVarInt(0); // empty block light mask
		packet.writeVarInt(0); // sky light array count
		packet.writeVarInt(0); // block light array count
		return packet.toBuffer();
	}
}

export class World {
	private static chunks: Map<string, Chunk> = new Map();
	private static generator: Generator = new FlatGenerator();

	public static getChunk(x: number, z: number): Chunk {
		const key = `${x},${z}`;
		if (!World.chunks.has(key)) {
			World.chunks.set(key, World.generator.generateAt(x, z));
		}
		return World.chunks.get(key)!;
	}
}
