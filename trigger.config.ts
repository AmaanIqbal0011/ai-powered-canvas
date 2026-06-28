import { defineConfig } from "@trigger.dev/sdk";
import { prismaExtension } from "@trigger.dev/build/extensions/prisma";

export default defineConfig({
  project: "proj_xfqcihtfppqerccqkyai",
  runtime: "node",
  dirs: ["trigger"],
  maxDuration: 600,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      factor: 2,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      randomize: true,
    },
  },
  build: {
    extensions: [
      prismaExtension({
        mode: "modern",
      }),
    ],
  },
});
