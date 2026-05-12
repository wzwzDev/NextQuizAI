import { config } from "dotenv";

config({ path: ".env.test" });
config({ path: ".env.test" });
// Suppress known benign warnings during backend tests
const originalConsoleWarn = console.warn.bind(console);
const originalConsoleError = console.error.bind(console);

console.warn = (...args: unknown[]) => {
	try {
		const joined = args.map((a) => String(a ?? "")).join(" ");
		if (joined.includes("Question generation fallback activated") || joined.includes("SMTP is not configured")) {
			return;
		}
	} catch {}
	originalConsoleWarn(...args);
};

const originalConsoleInfo = console.info.bind(console);
console.info = (...args: unknown[]) => {
	try {
		const joined = args.map((a) => String(a ?? "")).join(" ");
		if (joined.includes("SMTP is not configured")) return;
	} catch {}
	originalConsoleInfo(...args);
};

console.error = (...args: unknown[]) => {
	try {
		const joined = args.map((a) => String(a ?? "")).join(" ");
		if (joined.includes("Sign-out error:")) {
			return;
		}
	} catch {}
	originalConsoleError(...args);
};

process.on("warning", (warning) => {
	try {
		if (warning.name === "DeprecationWarning" && String(warning.message).includes("punycode")) {
			return;
		}
	} catch {}
	originalConsoleWarn(warning);
});
