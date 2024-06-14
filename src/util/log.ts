import "colorts/lib/string";
import config from "../../config.json";

export const Prefix = {
	INFO: "INFO".green,
	WARN: "WARN".yellow,
	ERROR: "ERROR".red,
	LOGIN: "Login".blue,
	PLAYERS: "Players".cyan,
	CHAT: "Chat".magenta,
	DEBUG: "Debug".magenta,
};

export function log(prefix: string, ...message: any[]) {
	if (prefix === "Debug".magenta && !config.debug) return;
	// for each item in message, if it's { x: string, y: string, z: string },
	// log it as `${x.red}, ${y.green}, ${z.blue}`
	message = message.map((item) => {
		if (
			typeof item === "object" &&
			item !== null &&
			"x" in item &&
			"y" in item &&
			"z" in item
		) {
			return `at X: ${item.x.toString().red}, Y: ${
				item.y.toString().green
			}, Z: ${item.z.toString().blue}`;
		}
		return item;
	});
	console.log(`${"[".gray}${prefix}${"]".gray}`, ...message);
}
