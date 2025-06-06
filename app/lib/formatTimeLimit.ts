/**
 * Converts seconds to a string in "Hh Mm" or "Mm" format.
 * @param seconds Number of seconds
 * @returns Formatted string, e.g. "1h 30m" or "15m"
 */
export function formatTimeLimit(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h > 0 ? `${h}h ` : ""}${m}m`;
}