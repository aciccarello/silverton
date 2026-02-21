import { json } from '@sveltejs/kit';
import { updateState } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const payload = await request.json();
    const { lastModifiedBy, lastModifiedAction, ...data } = payload;

    try {
      updateState((state) => {
      // Shallow merge data, EXCEPT 'players'
          for (const key in data) {
            if (key !== 'players') {
                state[key] = data[key];
              }
            }
          return state;
        }, lastModifiedBy, lastModifiedAction);

      return json({ success: true });
    } catch (err: any) {
      return json({ success: false, error: err.message || 'Update failed' }, { status: 500 });
    }
  } catch (err) {
    return json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }
};
