export function registerTimeoutGuard(ms: number, cleanup: () => Promise<void>) {
  setTimeout(async () => {
    console.error(`Script exceeded maximum execution time of ${ms}ms.`);
    try {
      await cleanup();
    } catch (err) {
      console.error('Error during timeout cleanup:', err);
    }
    process.exit(1);
  }, ms).unref();
}
