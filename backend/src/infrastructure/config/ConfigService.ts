import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { AppConfig, ConfigKeyItem } from '../../domain/entities/AppConfig';

export class ConfigService {
  private static readonly SENSITIVE_KEYS = new Set([
    'FB_ACCESS_TOKEN',
    'IG_ACCESS_TOKEN',
    'YOUTUBE_API_KEY',
    'TIKTOK_CLIENT_KEY',
    'TIKTOK_CLIENT_SECRET',
    'X_BEARER_TOKEN',
    'LINKEDIN_ACCESS_TOKEN',
    'DATABASE_URL'
  ]);

  private static readonly MANAGED_KEYS = [
    'FB_ACCESS_TOKEN',
    'FB_PAGE_ID',
    'IG_ACCESS_TOKEN',
    'IG_USER_ID',
    'YOUTUBE_API_KEY',
    'YOUTUBE_CHANNEL_ID',
    'TIKTOK_CLIENT_KEY',
    'TIKTOK_CLIENT_SECRET',
    'TIKTOK_USERNAME',
    'X_BEARER_TOKEN',
    'X_USERNAME',
    'LINKEDIN_ACCESS_TOKEN',
    'LINKEDIN_ORGANIZATION_ID',
    'LINKEDIN_VANITY_NAME',
    'DATABASE_URL',
    'PORT',
    'NODE_ENV'
  ];

  private envPath: string;

  constructor(envPath?: string) {
    this.envPath = envPath || path.resolve(__dirname, '../../../../.env');
    dotenv.config({ path: this.envPath });
  }

  public loadConfig(): AppConfig {
    const items: ConfigKeyItem[] = [];

    for (const key of ConfigService.MANAGED_KEYS) {
      const val = process.env[key] || '';
      items.push({
        key,
        value: val,
        isSensitive: ConfigService.SENSITIVE_KEYS.has(key)
      });
    }

    return new AppConfig(items);
  }

  public saveConfig(updates: Record<string, string>): void {
    // 1. Update in-memory process.env
    for (const [key, val] of Object.entries(updates)) {
      process.env[key] = val;
    }

    // 2. Persist to .env file
    try {
      let existingContent = '';
      if (fs.existsSync(this.envPath)) {
        existingContent = fs.readFileSync(this.envPath, 'utf-8');
      }

      const lines = existingContent.split('\n');
      const updatedKeys = new Set<string>();

      const newLines = lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
          return line;
        }
        const eqIdx = line.indexOf('=');
        if (eqIdx !== -1) {
          const k = line.substring(0, eqIdx).trim();
          if (k in updates) {
            updatedKeys.add(k);
            return `${k}=${updates[k]}`;
          }
        }
        return line;
      });

      // Append any new keys not already in the file
      for (const [k, v] of Object.entries(updates)) {
        if (!updatedKeys.has(k)) {
          newLines.push(`${k}=${v}`);
        }
      }

      fs.writeFileSync(this.envPath, newLines.join('\n'), 'utf-8');
    } catch (err) {
      console.error('[CONFIG] Error writing to .env file:', err);
    }
  }
}
