export type DataMode = "mock" | "hybrid" | "live";

const rawMode = (import.meta.env.VITE_DATA_MODE ?? "mock").toLowerCase();

export const dataMode: DataMode = rawMode === "live" || rawMode === "hybrid" || rawMode === "mock"
  ? (rawMode as DataMode)
  : "mock";

export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787").replace(/\/$/, "");

export function isMockMode(): boolean {
  return dataMode === "mock";
}

export function isLiveSummaryMode(): boolean {
  return dataMode === "hybrid" || dataMode === "live";
}
