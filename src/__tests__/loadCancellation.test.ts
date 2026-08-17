/**
 * Task 3 (RED): createCancellableFormLoad(loader) contract.
 *
 * Discard-on-resolve cancellation wrapper: `cancel()` doesn't abort the
 * underlying loader (it may be a synchronous CPU stretch with no yield
 * points) — it just discards the result when it eventually settles.
 */
import { createCancellableFormLoad } from '../loadCancellation';

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('createCancellableFormLoad', () => {
  it('resolves with the loader value when never cancelled', async () => {
    const load = createCancellableFormLoad(() => Promise.resolve('session-a'));
    await expect(load.promise).resolves.toBe('session-a');
    expect(load.isCancelled()).toBe(false);
  });

  it('resolves to null when cancelled before a pending loader settles', async () => {
    const d = deferred<string>();
    const load = createCancellableFormLoad(() => d.promise);

    load.cancel();
    d.resolve('late-session');

    await expect(load.promise).resolves.toBeNull();
    expect(load.isCancelled()).toBe(true);
  });

  it('resolves to null when the loader throws after being cancelled (no leak)', async () => {
    const d = deferred<string>();
    const load = createCancellableFormLoad(() => d.promise);

    load.cancel();
    d.reject(new Error('boom'));

    await expect(load.promise).resolves.toBeNull();
  });

  it('cancel-after-settle is a no-op — the already-resolved value is unaffected', async () => {
    const load = createCancellableFormLoad(() => Promise.resolve('session-b'));
    const value = await load.promise;
    load.cancel();

    expect(value).toBe('session-b');
    expect(load.isCancelled()).toBe(false);
  });

  it('double-cancel is idempotent', async () => {
    const d = deferred<string>();
    const load = createCancellableFormLoad(() => d.promise);

    load.cancel();
    load.cancel();
    d.resolve('x');

    await expect(load.promise).resolves.toBeNull();
    expect(load.isCancelled()).toBe(true);
  });

  it('propagates a real (non-cancellation) rejection when not cancelled', async () => {
    const boom = new Error('real failure');
    const load = createCancellableFormLoad(() => Promise.reject(boom));

    await expect(load.promise).rejects.toThrow(boom);
    expect(load.isCancelled()).toBe(false);
  });
});
