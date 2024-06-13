import { appendFileSync, writeFileSync } from "fs";
import j from "../1.20.4.json";

const json = (j as any)[0];

function toPascalCase(str: string) {
	return str
		.split("_")
		.map((word) => word[0].toUpperCase() + word.slice(1))
		.join("");
}

let finalEnum = "export enum Block {\n";

for (const block of json.blocks.ordered_blocks) {
	const blockData = json.blocks.block[block];
	if (!blockData) continue;
	finalEnum += `${toPascalCase(block)} = ${Math.min(
		blockData.min_state_id + 1,
		blockData.max_state_id
	)},\n`;
}

finalEnum += "}";

appendFileSync("src/util/enum.ts", finalEnum);
