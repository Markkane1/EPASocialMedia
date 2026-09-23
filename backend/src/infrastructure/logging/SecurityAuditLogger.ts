import * as crypto from 'crypto';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  result: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  ipAddress?: string;
  hash?: string;
  previousHash?: string;
  metadata?: Record<string, any>;
}

export class SecurityAuditLogger {
  private static logs: AuditLogEntry[] = [];
  private static readonly MAX_LOGS = 1000;
  private static lastHash: string = 'GENESIS_EPA_PUNJAB_AUDIT';

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
    const timestamp = new Date().toISOString();
    const actor = entry.actor || 'ANONYMOUS';
    const ipAddress = entry.ipAddress || '127.0.0.1';

    // Cryptographic tamper-evident hash chaining (M-07)
    const hashPayload = `${this.lastHash}|${timestamp}|${actor}|${entry.action}|${entry.resource}|${entry.result}`;
    const hash = crypto.createHash('sha256').update(hashPayload).digest('hex');
    const previousHash = this.lastHash;
    this.lastHash = hash;

    const record: AuditLogEntry = {
      id: `audit-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      timestamp,
      actor,
      action: entry.action,
      resource: entry.resource,
      result: entry.result,
      ipAddress,
      hash,
      previousHash,
      metadata: this.sanitizeMetadata(entry.metadata)
    };

    this.logs.unshift(record);
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.pop();
    }

    // Structured security console audit log
    console.log(
      `[SECURITY AUDIT] [${record.timestamp}] [${record.action}] Actor="${record.actor}" Result="${record.result}" Resource="${record.resource}" IP="${record.ipAddress}" Hash="${record.hash?.substring(0, 8)}..."`
    );

    // Asynchronously persist to database if available (M-06)
    try {
      import('../database/PrismaClientSingleton').then(async ({ PrismaClientSingleton }) => {
        const isConnected = await PrismaClientSingleton.checkConnection();
        if (isConnected) {
          const prisma = PrismaClientSingleton.getInstance();
          await prisma.syncAuditLog.create({
            data: {
              timestamp: new Date(record.timestamp),
              status: `SECURITY_${record.result}`,
              message: `[SECURITY] [${record.action}] Actor="${record.actor}" Resource="${record.resource}"`,
              details: {
                auditId: record.id,
                actor: record.actor,
                action: record.action,
                resource: record.resource,
                result: record.result,
                ipAddress: record.ipAddress,
                hash: record.hash,
                previousHash: record.previousHash,
                metadata: record.metadata
              }
            }
          });
        }
      }).catch(() => {});
    } catch {}

    return record;
  }

  public static getRecentLogs(limit: number = 50): AuditLogEntry[] {
    return this.logs.slice(0, Math.min(Math.max(limit, 1), 100));
  }

  public static async getDurableLogs(limit: number = 50): Promise<AuditLogEntry[]> {
    const boundedLimit = Math.min(Math.max(limit, 1), 100);
    try {
      const { PrismaClientSingleton } = await import('../database/PrismaClientSingleton');
      const isConnected = await PrismaClientSingleton.checkConnection();
      if (isConnected) {
        const prisma = PrismaClientSingleton.getInstance();
        const records = await prisma.syncAuditLog.findMany({
          where: { status: { startsWith: 'SECURITY_' } },
          orderBy: { timestamp: 'desc' },
          take: boundedLimit
        });
        if (records.length > 0) {
          return records.map((r: any) => {
            const d = (r.details as any) || {};
            return {
              id: d.auditId || r.id,
              timestamp: r.timestamp.toISOString(),
              actor: d.actor || 'UNKNOWN',
              action: d.action || 'UNKNOWN',
              resource: d.resource || 'SYSTEM',
              result: d.result || (r.status.replace('SECURITY_', '') as any),
              ipAddress: d.ipAddress,
              hash: d.hash,
              previousHash: d.previousHash,
              metadata: d.metadata
            };
          });
        }
      }
    } catch {
      // Fallback to memory
    }
    return this.getRecentLogs(boundedLimit);
  }

  public static clearAll(): void {
    this.logs = [];
    this.lastHash = 'GENESIS_EPA_PUNJAB_AUDIT';
  }
}


