import { getHistory } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
    const historyData = getHistory();
    
    // Parse the json eagerly so the template can display summary info natively
    const formattedHistory = historyData.map((row) => {
        let parsed = {};
        try {
            parsed = JSON.parse(row.state_json);
        } catch (e) {
            console.error('Failed to parse history state_json', e);
        }
        return {
            id: row.id,
            timestamp: row.timestamp,
            state: parsed
        };
    });

    return {
        history: formattedHistory
    };
};
