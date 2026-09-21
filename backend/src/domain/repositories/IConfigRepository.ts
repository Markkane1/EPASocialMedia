import { AppConfig } from '../entities/AppConfig';

export interface IConfigRepository {
  /**
   * Loads full configuration.
   */
  getConfig(): Promise<AppConfig>;

  /**
   * Updates one or more configuration settings.
   */
  updateConfig(updates: Record<string, string>): Promise<void>;

  /**
   * Gets single config value by key.
   */
  get(key: string): Promise<string>;
}
