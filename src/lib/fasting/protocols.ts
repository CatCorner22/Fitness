export const FAST_PROTOCOLS = [
  { id: "12:12", hours: 12, label: "12:12", blurb: "Overnight. Easy entry." },
  { id: "14:10", hours: 14, label: "14:10", blurb: "A longer overnight." },
  { id: "16:8", hours: 16, label: "16:8", blurb: "Common TRE window." },
  { id: "18:6", hours: 18, label: "18:6", blurb: "Tighter eating window." },
  { id: "20:4", hours: 20, label: "20:4", blurb: "One main meal window." },
  { id: "24h", hours: 24, label: "24 h", blurb: "A one-day fast. Not a weekly default." },
] as const;

const MIN_FAST_MINUTES = 8 * 60;
export const MAX_FAST_MINUTES = 48 * 60;

export function clampFastMinutes(n: number) {
  if (!Number.isFinite(n)) return 16 * 60;
  return Math.min(MAX_FAST_MINUTES, Math.max(MIN_FAST_MINUTES, Math.round(n)));
}

/** Actual elapsed time on a finished fast. Can be shorter than a protocol window. */
export function elapsedFastMinutes(startedAt: string, endedAt: string) {
  const delta = Date.parse(endedAt) - Date.parse(startedAt);
  if (!Number.isFinite(delta) || delta < 0) return 0;
  return Math.min(MAX_FAST_MINUTES, Math.round(delta / 60_000));
}

export function formatElapsedLabel(startedAt: string, endedAt: string) {
  const ms = Date.parse(endedAt) - Date.parse(startedAt);
  if (!Number.isFinite(ms) || ms < 60_000) return "<1 min";
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)} min`;
  const hours = Math.round((ms / 3_600_000) * 10) / 10;
  return `${hours} h`;
}

export function protocolHours(id: string, customHours?: number) {
  const found = FAST_PROTOCOLS.find((p) => p.id === id);
  if (found) return found.hours;
  return customHours && customHours > 0 ? customHours : 16;
}

export function isoToLocalInput(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function localInputToIso(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function formatDuration(ms: number) {
  const abs = Math.abs(ms);
  const totalSec = Math.floor(abs / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${m}:${pad(s)}`;
}

export function plannedEndIso(startedAt: string, targetMinutes: number) {
  return new Date(Date.parse(startedAt) + targetMinutes * 60_000).toISOString();
}

export type FastAdjustmentKind =
  | "start"
  | "shift_start"
  | "set_target"
  | "shift_end"
  | "nudge"
  | "end_now"
  | "abort"
  | "edit_completed";
