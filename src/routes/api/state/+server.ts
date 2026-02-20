import { json } from '@sveltejs/kit';
import { loadState, saveState } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
  const stateJson = loadState();
  return new Response(stateJson, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    saveState(JSON.stringify(data));
    return json({ success: true });
  } catch (err) {
    return json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }
};
