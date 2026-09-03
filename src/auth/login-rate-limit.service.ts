import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

interface AttemptState {
  failures: number;
  windowStartedAt: number;
  blockedUntil?: number;
}

@Injectable()
export class LoginRateLimitService {
  private readonly attempts = new Map<string, AttemptState>();
  private readonly windowMs = 15 * 60 * 1000;
  private readonly maxFailures = 5;

  assertAllowed(key: string): void {
    const now = Date.now();
    const state = this.attempts.get(key);
    if (!state) return;
    if (state.blockedUntil && state.blockedUntil > now) {
      throw new HttpException(
        'Слишком много попыток входа. Повторите позже.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (now - state.windowStartedAt >= this.windowMs) {
      this.attempts.delete(key);
    }
  }

  recordFailure(key: string): void {
    const now = Date.now();
    const current = this.attempts.get(key);
    const state =
      !current || now - current.windowStartedAt >= this.windowMs
        ? { failures: 0, windowStartedAt: now }
        : current;
    state.failures += 1;
    if (state.failures >= this.maxFailures) {
      state.blockedUntil = now + this.windowMs;
    }
    this.attempts.set(key, state);
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}
