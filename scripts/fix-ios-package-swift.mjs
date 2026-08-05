// The Capacitor CLI, when it runs `cap sync ios`/`cap update ios` on
// Windows, writes native backslash path separators into the generated
// `path:` arguments of ios/App/CapApp-SPM/Package.swift (e.g.
// "..\..\..\node_modules\@capacitor\app"). Backslash is a Swift string
// escape character — `\.` and `\@` aren't valid escapes — so the file fails
// to parse in Xcode/SPM on macOS. This has recurred more than once; running
// this after every `cap sync` (see the "mobile:sync" npm script) normalizes
// it back to forward slashes so the checked-in file always builds on macOS,
// regardless of which OS last ran `cap sync`.
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";

const FILE = path.resolve(import.meta.dirname, "../ios/App/CapApp-SPM/Package.swift");

if (!existsSync(FILE)) {
  console.log("ios/App/CapApp-SPM/Package.swift doesn't exist yet (no iOS platform added) — skipping.");
  process.exit(0);
}

const before = readFileSync(FILE, "utf-8");
const after = before.replace(/(path:\s*")([^"]+)(")/g, (_, pre, p, post) => pre + p.replace(/\\/g, "/") + post);

if (before !== after) {
  writeFileSync(FILE, after);
  console.log("Fixed backslash paths in ios/App/CapApp-SPM/Package.swift");
} else {
  console.log("ios/App/CapApp-SPM/Package.swift paths already clean, nothing to do.");
}
