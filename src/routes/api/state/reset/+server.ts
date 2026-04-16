import { json } from "@sveltejs/kit";
import { resetState } from "$lib/server/db";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async () => {
  try {
    resetState("Admin", "Started a new game");
    return json({ success: true });
  } catch (err: any) {
    return json(
      { success: false, error: err.message || "Reset failed" },
      { status: 500 },
    );
  }
};
