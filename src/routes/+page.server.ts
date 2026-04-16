import { loadState } from "$lib/server/db";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = () => {
  const stateString = loadState();
  let stateJson = {};
  try {
    stateJson = JSON.parse(stateString);
  } catch (e) {
    stateJson = {};
  }

  return {
    initialGameState: stateJson,
  };
};
