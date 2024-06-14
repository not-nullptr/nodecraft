import { appendFileSync, writeFileSync } from "fs";
import json from "../registries.json";

function toPascalCase(str: string) {
	return str
		.split("_")
		.map((word) => word[0].toUpperCase() + word.slice(1))
		.join("");
}

let finalEnum = "export enum Item {\n";

// for (const block of json.blocks.ordered_blocks) {
// 	const blockData = json.blocks.block[block];
// 	if (!blockData) continue;
// 	finalEnum += `${toPascalCase(block)} = ${Math.min(
// 		blockData.min_state_id + 1,
// 		blockData.max_state_id
// 	)},\n`;
// }

for (const item of Object.entries(json["minecraft:item"].entries)) {
	const [key, value] = item;
	const protocolId = value.protocol_id;
	const name = toPascalCase(key.split(":")[1]);
	finalEnum += `${name} = ${protocolId},\n`;
}

finalEnum += "}";

appendFileSync("src/util/enum.ts", finalEnum);
