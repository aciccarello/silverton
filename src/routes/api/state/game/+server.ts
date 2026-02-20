import { json } from '@sveltejs/kit';
import { loadState, saveState } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    
    // Load current DB state
    const stateString = loadState();
    let currentState: any = {};
    try {
        currentState = JSON.parse(stateString);
    } catch(e) { /* ignore */ }

    // Shallow merge data, EXCEPT 'players'
    const updatedState = { ...currentState };
    for (const key in data) {
        if (key !== 'players') {
            updatedState[key] = data[key];
        }
    }

    // Save back to DB
    saveState(JSON.stringify(updatedState));
    
    return json({ success: true });
  } catch (err) {
    return json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }
};
