import * as crypto from 'crypto';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  result: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  ipAddress?: string;
  metadata?: Record<string, any>;
}

export class SecurityAuditLogger {
  private static logs: AuditLogEntry[] = [];
  private static readonly MAX_LOGS = 1000;

  /**
   * Sanitizes metadata to ensure no passwords, secrets, or raw tokens are ever logged
   */
  private static sanitizeMetadata(meta?: Record<string, any>): Record<string, any> | undefined {
    if (!meta) return undefined;
    const sanitized: Record<string, any> = {};

    for (const [key, val] of Object.entries(meta)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('password') ||
        lowerKey.includes('token') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('authorization') ||
        lowerKey.includes('apikey')
      ) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof val === 'object' && val !== null) {
        sanitized[key] = this.sanitizeMetadata(val);
      } else {
        sanitized[key] = val;
      }
    }

    return sanitized;
  }

  public static record(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const record: AuditLogEntry = {
      id: `audit-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      timestamp: new Date().toISOString(),
      actor: entry.actor || 'ANONYMOUS',
      action: entry.action,
      resource: entry.resource,
      result: entry.result,
      ipAddress: entry.ipAddress || '127.0.0.1',
      metadata: this.sanitizeMetadata(entry.metadata)
    };

    this.logs.unshift(record);
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.pop();
    }

    // Structured security console audit log
    console.log(
      `[SECURITY AUDIT] [${record.timestamp}] [${record.action}] Actor="${record.actor}" Result="${record.result}" Resource="${record.resource}" IP="${record.ipAddress}"`
    );

    return record;
  }

  public static getRecentLogs(limit: number = 50): AuditLogEntry[] {
    return this.logs.slice(0, Math.min(limit, 100));
  }

}
