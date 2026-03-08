/**
 * Provides a fire-and-forget way to call backend methods outside of React Query context.
 * Only used for best-effort, non-blocking backend calls (like submitJob after print).
 */
import { createActorWithConfig } from "../config";

let actorCache: Awaited<ReturnType<typeof createActorWithConfig>> | null = null;

async function getActor() {
  if (!actorCache) {
    actorCache = await createActorWithConfig();
  }
  return actorCache;
}

/**
 * Best-effort submit print job to backend — non-blocking, errors are ignored.
 */
export function submitJobBestEffort(
  prefix: string,
  leftSerial: bigint,
  rightSerial: bigint,
): void {
  getActor()
    .then((actor) => actor.submitJob(prefix, leftSerial, rightSerial))
    .catch(() => {
      // Non-blocking — ignore failures
    });
}
