import { json } from '@sveltejs/kit';
import { getCities, getGlobalMarketState, getCityMarketState } from '$lib/server/db';
import type { RequestHandler } from './$types';

const CHART_CITY_ORDER = ['Denver', 'Salt Lake City', 'Pueblo', 'Santa Fe', 'El Paso'];

export const GET: RequestHandler = async ({ url }) => {
    const turnParam = url.searchParams.get('turn');
    const turn = turnParam ? Math.max(1, parseInt(turnParam, 10) || 1) : 1;

    const cities = getCities();
    const cityOrder = CHART_CITY_ORDER.map((name) => cities.find((c) => c.name === name)).filter(Boolean) as { id: number; name: string }[];

    const globalRows = getGlobalMarketState(turn);
    const global = Object.fromEntries(globalRows.map((r) => [r.resource, r.price]));

    const cityRows = getCityMarketState(turn);
    const cityByKey = new Map(cityRows.map((r) => [`${r.city_id}-${r.resource}`, r.price]));

    const cityPrices: { cityId: number; cityName: string; lumber: number; coal: number }[] = cityOrder.map((c) => ({
        cityId: c.id,
        cityName: c.name,
        lumber: cityByKey.get(`${c.id}-lumber`) ?? 0,
        coal: cityByKey.get(`${c.id}-coal`) ?? 0
    }));

    return json({
        turn,
        global: {
            gold: global.gold ?? 0,
            copper: global.copper ?? 0,
            silver: global.silver ?? 0
        },
        cityPrices,
        cities: cityOrder
    });
};
