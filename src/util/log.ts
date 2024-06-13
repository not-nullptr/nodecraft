import "colorts/lib/string";

export const Prefix = {
	INFO: "INFO".green,
	WARN: "WARN".yellow,
	ERROR: "ERROR".red,
	LOGIN: "Login".blue,
	PLAYERS: "Players".cyan,
	CHAT: "Chat".magenta,
	DEBUG: "Debug".magenta,
};

export function log(prefix: string, message: string) {
	console.log(`${"[".gray}${prefix}${"]".gray} ${message}`);
}
