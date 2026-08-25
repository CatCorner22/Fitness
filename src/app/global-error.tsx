"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#14110d",
          color: "#f6f0e6",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: 28 * 16, margin: "0 auto", padding: "4rem 1.25rem" }}>
          <h1 style={{ fontSize: "2rem" }}>Garanimal hit a wall</h1>
          <p style={{ marginTop: 12, opacity: 0.75 }}>Reload the page. Your logs are still on this device.</p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: 32,
              minHeight: 48,
              padding: "0 1.25rem",
              borderRadius: 16,
              border: 0,
              background: "#e38a4a",
              color: "#1a140e",
              fontWeight: 600,
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
