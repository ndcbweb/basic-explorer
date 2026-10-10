export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.DISABLE_INDEXER === "1") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const { startIndexer } = await import("./lib/indexer");
  startIndexer();
}
