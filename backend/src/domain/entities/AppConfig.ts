export interface ConfigKeyItem {
  key: string;
  value: string;
  isSensitive: boolean;
}

export class AppConfig {
  private configMap: Map<string, ConfigKeyItem>;

  constructor(items: ConfigKeyItem[] = []) {
    this.configMap = new Map();
    items.forEach(item => this.configMap.set(item.key, item));
  }

  public get(key: string): string {
    return this.configMap.get(key)?.value || '';
  }

  public set(key: string, value: string, isSensitive: boolean = false): void {
    this.configMap.set(key, { key, value, isSensitive });
  }

  public getAllMasked(): Record<string, string> {
    const masked: Record<string, string> = {};
    for (const [key, item] of this.configMap.entries()) {
      if (item.isSensitive && item.value && item.value.trim().length > 0) {
        masked[key] = this.maskValue(item.value);
      } else {
        masked[key] = item.value || '';
      }
    }
    return masked;
  }


  private maskValue(val: string): string {
    if (!val || val.length < 8) {
      return '••••••••';
    }
    return `${val.substring(0, 4)}••••••••${val.substring(val.length - 4)}`;
  }
}
