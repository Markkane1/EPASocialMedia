import { TestConnectionUseCase } from '../../src/application/use-cases/TestConnectionUseCase';
import { FacebookFetcher } from '../../src/infrastructure/fetchers/FacebookFetcher';
import { InstagramFetcher } from '../../src/infrastructure/fetchers/InstagramFetcher';
import { LinkedInFetcher } from '../../src/infrastructure/fetchers/LinkedInFetcher';
import { XFetcher } from '../../src/infrastructure/fetchers/XFetcher';
import { TikTokFetcher } from '../../src/infrastructure/fetchers/TikTokFetcher';
import { YouTubeFetcher } from '../../src/infrastructure/fetchers/YouTubeFetcher';

describe('TestConnectionUseCase & Fetcher Status Integrity (H-11, H-14, M-12)', () => {
  let useCase: TestConnectionUseCase;

  beforeEach(() => {
    // Instantiate fetchers without tokens
    const fetchers = [
      new FacebookFetcher('test_page', ''),
      new InstagramFetcher('test_user', ''),
      new LinkedInFetcher('test_vanity', '', ''),
      new XFetcher('test_handle', ''),
      new TikTokFetcher('test_user'),
      new YouTubeFetcher()
    ];
    useCase = new TestConnectionUseCase(fetchers);
  });

  test('Returns ERROR for unknown/unsupported platform names', async () => {
    const result = await useCase.execute('invalid_platform_xyz');
    expect(result.status).toBe('ERROR');
    expect(result.message).toContain('Unknown or unconfigured platform');
  });

  test('Returns ERROR for general or empty platform key', async () => {
    const result = await useCase.execute('general');
    expect(result.status).toBe('ERROR');
  });

  test('Facebook returns ERROR when FB_ACCESS_TOKEN is missing', async () => {
    const result = await useCase.execute('facebook');
    expect(result.status).toBe('ERROR');
    expect(result.message).toContain('FB_ACCESS_TOKEN is missing');
  });

  test('Instagram returns ERROR when IG_ACCESS_TOKEN is missing', async () => {
    const result = await useCase.execute('instagram');
    expect(result.status).toBe('ERROR');
    expect(result.message).toContain('IG_ACCESS_TOKEN is missing');
  });

  test('LinkedIn returns ERROR when LINKEDIN_ACCESS_TOKEN is missing', async () => {
    const result = await useCase.execute('linkedin');
    expect(result.status).toBe('ERROR');
    expect(result.message).toContain('LINKEDIN_ACCESS_TOKEN is missing');
  });

  test('X returns ERROR when X_BEARER_TOKEN is missing', async () => {
    const result = await useCase.execute('x');
    expect(result.status).toBe('ERROR');
    expect(result.message).toContain('X_BEARER_TOKEN is missing');
  });

  test('TikTok returns ERROR when official API credentials are not configured', async () => {
    const result = await useCase.execute('tiktok');
    expect(result.status).toBe('ERROR');
  });

  test('YouTube returns ERROR when channel is pending launch', async () => {
    const result = await useCase.execute('youtube');
    expect(result.status).toBe('ERROR');
    expect(result.message).toContain('Pending Launch');
  });
});
