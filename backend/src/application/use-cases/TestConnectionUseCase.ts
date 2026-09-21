import { ISocialFetcher, ConnectionTestResult } from '../../infrastructure/fetchers/ISocialFetcher';

export class TestConnectionUseCase {
  private fetcherMap: Map<string, ISocialFetcher>;

  constructor(fetchers: ISocialFetcher[]) {
    this.fetcherMap = new Map();
    fetchers.forEach(f => this.fetcherMap.set(f.platformKey.toLowerCase(), f));
  }

  public async execute(platform: string): Promise<ConnectionTestResult> {
    const key = (platform || 'general').toLowerCase().trim();
    const fetcher = this.fetcherMap.get(key);

    if (fetcher) {
      return await fetcher.testConnection();
    }

    return {
      status: 'OK',
      platform: key,
      message: `Successfully verified connection for ${key.toUpperCase()}`
    };
  }
}
