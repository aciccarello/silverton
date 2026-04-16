import { json } from "@sveltejs/kit";
import { rollbackTo } from "$lib/server/db";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    if (typeof data.id !== "number") {
      return json({ success: false, error: "Invalid ID" }, { status: 400 });
    }
    rollbackTo(data.id, data.lastModifiedBy, data.lastModifiedAction);
    return json({ success: true });
  } catch (err: any) {
    return json(
      { success: false, error: err.message || "Server Error" },
      { status: 500 },
    );
  }
};
