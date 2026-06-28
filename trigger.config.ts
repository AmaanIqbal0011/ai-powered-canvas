import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  // Replace with your project ref from https://cloud.trigger.dev
  project: "proj_xfqcihtfppqerccqkyai",
  runtime : 'node',
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
});
