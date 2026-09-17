// A single initialization/probe runs at a time. Failures clear initialization
// state so the next health request can recover without a server restart.
export function createReadiness(initialize: () => Promise<unknown>, probe: () => Promise<unknown>) {
  let initialized = false;
  let inFlight: Promise<boolean> | undefined;
  return {
    check(): Promise<boolean> {
      if (inFlight) return inFlight;
      inFlight = Promise.resolve()
        .then(async () => {
          try {
            if (!initialized) await initialize();
            await probe();
            initialized = true;
            return true;
          } catch {
            initialized = false;
            return false;
          }
        })
        .finally(() => {
          inFlight = undefined;
        });
      return inFlight;
    },
    invalidate() {
      initialized = false;
    },
  };
}
