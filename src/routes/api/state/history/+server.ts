import { json } from '@sveltejs/kit';
import { getHistory } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
  const history = getHistory();
  return json(history);
};
