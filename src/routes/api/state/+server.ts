import { json } from '@sveltejs/kit';
import { loadState, updateState } from '$lib/server/db';
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
      const payload = await request.json();
      const { lastModifiedBy, lastModifiedAction, ...data } = payload;

      updateState(() => {
          // Full state replacement
          return data;
      }, lastModifiedBy, lastModifiedAction);

    return json({ success: true });
  } catch (err: any) {
      return json({ success: false, error: err.message || 'Update failed' }, { status: 500 });
  }
};
