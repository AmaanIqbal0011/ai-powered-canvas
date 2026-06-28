import { task } from "@trigger.dev/sdk";

/**
 * Example task — validates that Trigger.dev is wired up correctly.
 * Remove or replace once you confirm the setup works.
 */
export const helloWorld = task({
  id: "hello-world",
  run: async (payload: { name: string }) => {
    console.log(`Hello ${payload.name}!`);
    return {
      message: `Hello ${payload.name}!`,
      timestamp: new Date().toISOString(),
    };
  },
});
