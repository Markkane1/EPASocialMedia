interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}

export class LoginThrottle {
  private static attempts: Map<string, AttemptRecord> = new Map();
  private static readonly MAX_FAILED_ATTEMPTS = 5;
  private static readonly ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  private static readonly LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minute progressive cooldown

  public static isLocked(identifier: string): { locked: boolean; retryAfterSeconds?: number } {
    const key = identifier.toLowerCase().trim();
    const record = this.attempts.get(key);
    if (!record) return { locked: false };

    const now = Date.now();
    if (record.lockedUntil && now < record.lockedUntil) {
      const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return { locked: true, retryAfterSeconds };
    }

    // Lockout expired
    if (record.lockedUntil && now >= record.lockedUntil) {
      this.attempts.delete(key);
      return { locked: false };
    }

    // Window expired
    if (now - record.firstAttemptAt > this.ATTEMPT_WINDOW_MS) {
      this.attempts.delete(key);
      return { locked: false };
    }

    return { locked: false };
  }

  public static recordFailure(identifier: string): { locked: boolean; retryAfterSeconds?: number; remainingAttempts: number } {
    const key = identifier.toLowerCase().trim();
    const now = Date.now();
    let record = this.attempts.get(key);

    if (!record || now - record.firstAttemptAt > this.ATTEMPT_WINDOW_MS) {
      record = { count: 1, firstAttemptAt: now };
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, this.MAX_FAILED_ATTEMPTS - record.count);

    if (record.count >= this.MAX_FAILED_ATTEMPTS) {
      record.lockedUntil = now + this.LOCKOUT_DURATION_MS;
      this.attempts.set(key, record);
      return {
        locked: true,
        retryAfterSeconds: Math.ceil(this.LOCKOUT_DURATION_MS / 1000),
        remainingAttempts: 0
      };
    }

    this.attempts.set(key, record);
    return { locked: false, remainingAttempts: remaining };
  }

  public static recordSuccess(identifier: string): void {
    const key = identifier.toLowerCase().trim();
    this.attempts.delete(key);
  }

}
