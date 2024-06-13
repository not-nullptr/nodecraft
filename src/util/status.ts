import nbt from "prismarine-nbt";

interface StatusResponse {
	version: Version;
	players: Players;
	description: TextComponent;
	favicon?: string;
	enforcesSecureChat: boolean;
	previewsChat: boolean;
}

export class TextComponent {
	public readonly text: string;
	public readonly extra?: {
		text: string;
		color?: string;
		bold?: boolean;
		italic?: boolean;
		underlined?: boolean;
		strikethrough?: boolean;
		obfuscated?: boolean;
	}[];

	constructor(
		text: string,
		extra: typeof TextComponent.prototype.extra = []
	) {
		this.text = text;
		this.extra = extra;
	}

	public toString() {
		return JSON.stringify({
			text: this.text,
			extra: this.extra,
		});
	}

	public toNetworkNBT() {
		const tag = nbt.comp(
			this.extra
				? {
						extra: nbt.list(
							nbt.comp(
								this.extra.map((extra) => ({
									text: nbt.string(extra.text),
									color: nbt.string(extra.color || "white"),
								}))
							)
						),
						text: nbt.string(""),
				  }
				: {
						text: nbt.string(this.text),
						extra: nbt.list(nbt.comp([])),
				  }
		);
		let buf = nbt.writeUncompressed(tag as any);
		buf = Buffer.concat([Buffer.from([0x0a]), buf.slice(3)]);
		return buf;
	}
}

interface Players {
	max: number;
	online: number;
	sample: Sample[];
}

interface Sample {
	name: string;
	id: string;
}

interface Version {
	name: string;
	protocol: number;
}

export class StatusBuilder {
	private response: StatusResponse = {
		version: {
			name: "1.20.4",
			protocol: 754,
		},
		players: {
			max: 0,
			online: 0,
			sample: [],
		},
		description: new TextComponent("A Minecraft Server"),
		enforcesSecureChat: false,
		previewsChat: false,
	};

	public setVersion(version: Version) {
		this.response.version = version;
		return this;
	}

	public setPlayers(players: Players["sample"]) {
		this.response.players.online = players.length;
		this.response.players.sample = players;
		return this;
	}

	public setMaxPlayers(maxPlayers: number) {
		this.response.players.max = maxPlayers;
		return this;
	}

	public setDescription(component: TextComponent) {
		this.response.description = component;
		return this;
	}

	public setFavicon(favicon: string) {
		this.response.favicon = favicon;
		return this;
	}

	public setEnforcesSecureChat(enforcesSecureChat: boolean) {
		this.response.enforcesSecureChat = enforcesSecureChat;
		return this;
	}

	public setPreviewsChat(previewsChat: boolean) {
		this.response.previewsChat = previewsChat;
		return this;
	}

	public build() {
		return this.response;
	}
}
