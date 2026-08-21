import fs from "node:fs";

const file = "server/db.ts";
const source = fs.readFileSync(file, "utf8");
const start = source.indexOf("export async function commitPrivateMarketBid");
const end = source.indexOf("\nexport async function createLaunchpadProject", start);
if (start < 0 || end < 0) throw new Error("commitPrivateMarketBid boundaries not found");
let block = source.slice(start, end);
block = block.replace("return db.transaction(async tx => {\n  const market = await db", "return db.transaction(async tx => {\n    const market = await tx");
block = block.replaceAll("await db", "await tx");
block = block.replace("\n}\n\n  });\n", "\n  });\n}\n");
if (block.includes("await db") || block.includes("\n}\n\n  });")) throw new Error("sealed-bid transaction repair did not converge");
fs.writeFileSync(file, `${source.slice(0, start)}${block}${source.slice(end)}`);
fs.unlinkSync(new URL(import.meta.url));
