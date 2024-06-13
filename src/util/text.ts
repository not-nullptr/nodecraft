import { TextComponent } from "./status";

export enum TextEffect {
	Black = 0,
	DarkBlue = 1,
	DarkGreen = 2,
	DarkAqua = 3,
	DarkRed = 4,
	DarkPurple = 5,
	Gold = 6,
	Gray = 7,
	DarkGray = 8,
	Blue = 9,
	Green = "a",
	Aqua = "b",
	Red = "c",
	LightPurple = "d",
	Yellow = "e",
	White = "f",
	Obfuscated = "k",
	Bold = "l",
	Strikethrough = "m",
	Underline = "n",
	Italic = "o",
	Reset = "r",
}

export const prefix = "§";

const toSnakeCase = (str: string) =>
	str.replace(/([A-Z])/g, (match) => `_${match.toLowerCase()}`).slice(1);

const getColorNameFromLetter = (letter: string) => {
	const vals = Object.values(TextEffect);
	const keys = Object.keys(TextEffect);
	const index = vals.indexOf(letter);
	return keys[index];
};

export class TextBuilder {
	private text: string = "";

	public append(opts: { text: string; effects: TextEffect[] }) {
		this.text +=
			opts.effects.map((effect) => `${prefix}${effect}`).join("") +
			opts.text +
			" ";
		return this;
	}

	public newline() {
		this.text += "\n";
		return this;
	}

	public build() {
		return this.text.slice(0, -1);
	}

	public buildAsTextComponent(): TextComponent {
		const prefix = "§";
		if (this.text.includes(prefix)) {
			this.text = `§r${this.text}§r`;
			let extras: TextComponent["extra"] = [];
			const groups = this.text.match(/(§[a-z0-9](?:§[a-z0-9])*[^§]*)/g);
			if (!groups) return new TextComponent(this.text);
			for (const group of groups) {
				const extra: (typeof extras)[number] = {
					text: "",
				};
				const colors = group.match(/§[a-z0-9]/g);
				let text = group.replace(/§[a-z0-9]/g, "");
				extra.text = text;
				for (const constColor of colors || []) {
					let color = constColor.replace("§", "");
					const colorName = getColorNameFromLetter(color) || "white";
					const colorKey = toSnakeCase(colorName.toString());
					// @ts-ignore
					if (
						color === "k" ||
						color === "l" ||
						color === "m" ||
						color === "n" ||
						color === "o" ||
						color === "r"
					) {
						// @ts-expect-error
						extra[colorKey] = true;
					} else {
						extra.color = colorKey;
					}
				}
				extras.push(extra);
			}
			return new TextComponent("", extras);
		}
		return new TextComponent(this.text);
	}
}
