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
	console.log(`${"[".gray}${prefix}${"]".gray}`, ...message);
}
