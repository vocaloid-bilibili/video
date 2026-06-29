// packages/controller/src/utils/downloadLocks.ts

export interface DownloadLock {
  promise: Promise<void>;
  release: () => void;
  startTime: number;
}

const downloadLocks = new Map<string, DownloadLock>();

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function acquireDownloadLock(
  lockKey: string,
  timeoutMs = 60_000,
): Promise<boolean> {
  const existingLock = downloadLocks.get(lockKey);

  if (existingLock) {
    const expired = Date.now() - existingLock.startTime > timeoutMs;

    if (expired) {
      existingLock.release();
      downloadLocks.delete(lockKey);
    } else {
      try {
        await Promise.race([
          existingLock.promise,
          new Promise<void>((_resolve, reject) => {
            setTimeout(
              () => reject(new Error("download lock timeout")),
              timeoutMs,
            );
          }),
        ]);
      } catch {
        downloadLocks.delete(lockKey);
      }

      return false;
    }
  }

  let release!: () => void;

  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });

  downloadLocks.set(lockKey, {
    promise,
    release,
    startTime: Date.now(),
  });

  return true;
}

export function releaseDownloadLock(lockKey: string): void {
  const lock = downloadLocks.get(lockKey);

  if (!lock) return;

  lock.release();
  downloadLocks.delete(lockKey);
}
