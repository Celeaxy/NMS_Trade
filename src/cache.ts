export class Cache<T> {
  private data: T | null = null;
  private timestamp: number = 0;
  private ttl: number; // time to live in milliseconds

  constructor(ttl: number) {
    this.ttl = ttl;
  }

  isValid(): boolean {
    return this.data !== null && Date.now() - this.timestamp < this.ttl;
  }

  get(): T | null {
    if (Date.now() - this.timestamp < this.ttl) {
      return this.data;
    }
    this.clear();
    return null;
  }

  set(data: T) {
    this.data = data;
    this.timestamp = Date.now();
  }

  clear() {
    this.data = null;
    this.timestamp = 0;
  }
}

export type CachedFunction<TArgs extends unknown[], TResult> = {(...args: TArgs): Promise<TResult>;  clear: () => void };

export function cached<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  ttl: number
): CachedFunction<TArgs, TResult> {
  const cache = new Cache<TResult>(ttl);

  const wrapped = async (...args: TArgs): Promise<TResult> => {
    const cached = cache.get();
    if (cached !== null) return cached;

    const result = await fn(...args);
    cache.set(result);
    return result;
  };

  wrapped.clear = () => cache.clear();

  return wrapped;
}