import { json } from '@sveltejs/kit';
import { loadState, saveState } from '$lib/server/db';
import type { RequestHandler } from './$types';
import type { Player } from '$lib/state/gameStore.svelte';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { lastModifiedBy, lastModifiedAction, ...data } = body;
    const player = data as Player;
    
    if (!player.id) {
        return json({ success: false, error: 'Player ID required' }, { status: 400 });
    }

    // Load current DB state
    const stateString = loadState();
    let currentState: any = {};
    try {
        currentState = JSON.parse(stateString);
    } catch(e) { /* ignore */ }

    // Ensure players array exists
    if (!currentState.players) {
        currentState.players = [];
    }

    // Find and update or insert the player
    const playerIndex = currentState.players.findIndex((p: Player) => p.id === player.id);
    if (playerIndex >= 0) {
      currentState.players[playerIndex] = { ...currentState.players[playerIndex], ...player };
    } else {
      currentState.players.push(player);
    }

    // Add metadata
    if (lastModifiedBy) currentState.lastModifiedBy = lastModifiedBy;
    if (lastModifiedAction) currentState.lastModifiedAction = lastModifiedAction;

    // Save back to DB
    saveState(JSON.stringify(currentState));
    
    return json({ success: true, player });
  } catch (err) {
    return json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }
};
