import { cp } from "node:fs/promises";

// The standalone server needs static assets alongside its traced files.
await cp("public", ".next/standalone/public", { recursive: true });
await cp(".next/static", ".next/standalone/.next/static", { recursive: true });
process.env.HOSTNAME ||= "localhost";
await import("../.next/standalone/server.js");
