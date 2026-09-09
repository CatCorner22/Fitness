export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * Public liveness + readiness probe. Returns 200 when the SQLite file opens,
 * reads, and carries the current schema; 503 with a short reason otherwise.
 * The DB path is only echoed outside production so a public probe never leaks
 * filesystem layout.
 */
export async function GET() {
  try {
    const { pingDatabase } = await import("@/lib/db");
    const db = pingDatabase();
    return Response.json(
      {
        ok: true,
        service: "garanimal",
        db: { ok: true, journalMode: db.journalMode, ...(process.env.NODE_ENV === "production" ? {} : { path: db.path }) },
      },
      { headers: NO_STORE },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[health] database check failed:", message);
    return Response.json(
      { ok: false, service: "garanimal", db: { ok: false, error: message } },
      { status: 503, headers: NO_STORE },
    );
  }
}
