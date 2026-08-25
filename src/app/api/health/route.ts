export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    { ok: true, service: "garanimal" },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
