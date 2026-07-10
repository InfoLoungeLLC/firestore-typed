/**
 * Runs a function that is expected to throw (or reject) and returns the
 * thrown error. Fails the test if nothing is thrown.
 *
 * Keeps error-detail assertions linear so tests comply with
 * `vitest/no-conditional-expect` (no `expect` inside catch blocks).
 */
export async function catchError<T = unknown>(fn: () => unknown): Promise<T> {
  try {
    await fn()
  } catch (error) {
    return error as T
  }
  throw new Error('Expected function to throw, but it did not')
}
