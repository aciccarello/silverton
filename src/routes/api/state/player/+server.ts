import { json } from "@sveltejs/kit";
import { updateState } from "$lib/server/db";
import type { RequestHandler } from "./$types";
import type { Player } from "$lib/state/gameStore.svelte";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { lastModifiedBy, lastModifiedAction, ...data } = body;
    const player = data as Player;

    if (!player.id) {
      return json(
        { success: false, error: "Player ID required" },
        { status: 400 },
      );
    }

    try {
      updateState(
        (state) => {
          if (!state.players) state.players = [];

          const playerIndex = state.players.findIndex(
            (p: Player) => p.id === player.id,
          );
          if (playerIndex >= 0) {
            state.players[playerIndex] = {
              ...state.players[playerIndex],
              ...player,
            };
          } else {
            state.players.push(player);
          }
          return state;
        },
        lastModifiedBy,
        lastModifiedAction,
      );

      return json({ success: true, player });
    } catch (err: any) {
      return json(
        { success: false, error: err.message || "Update failed" },
        { status: 500 },
      );
    }
  } catch (err) {
    return json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
};
