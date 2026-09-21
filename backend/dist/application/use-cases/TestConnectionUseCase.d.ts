import { ISocialFetcher, ConnectionTestResult } from '../../infrastructure/fetchers/ISocialFetcher';
export declare class TestConnectionUseCase {
    private fetcherMap;
    constructor(fetchers: ISocialFetcher[]);
    execute(platform: string): Promise<ConnectionTestResult>;
}
