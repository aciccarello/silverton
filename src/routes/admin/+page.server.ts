import { getHistory, getTotalHistoryCount } from "$lib/server/db";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ url }) => {
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = 50;
  const offset = (page - 1) * limit;

  const historyData = getHistory(limit, offset);
  const totalCount = getTotalHistoryCount();
  const totalPages = Math.ceil(totalCount / limit);

  // Parse the json eagerly so the template can display summary info natively
  const formattedHistory = historyData.map((row) => {
    let parsed = {};
    try {
      parsed = JSON.parse(row.state_json);
    } catch (e) {
      console.error("Failed to parse history state_json", e);
    }
    return {
      id: row.id,
      timestamp: row.timestamp,
      state: parsed,
    };
  });

  return {
    history: formattedHistory,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      limit,
    },
  };
};
