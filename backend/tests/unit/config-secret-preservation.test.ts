import { PrismaConfigRepository } from '../../src/infrastructure/database/PrismaConfigRepository';

describe('Configuration Masked-Secret Preservation (H-34)', () => {
  let configRepo: PrismaConfigRepository;

  beforeEach(() => {
    configRepo = new PrismaConfigRepository();
  });

  test('Masked secret bullet string does not overwrite active configuration', async () => {
    // Set initial real secret in process.env
    process.env.FB_ACCESS_TOKEN = 'real_valid_access_token_12345';

    // Simulate UI sending back masked placeholder
    await configRepo.updateConfig({
      FB_PAGE_ID: 'NewPageID123',
      FB_ACCESS_TOKEN: '••••••••'
    });

    // Secret must remain unchanged
    expect(process.env.FB_ACCESS_TOKEN).toBe('real_valid_access_token_12345');
    // Non-sensitive setting should be updated
    expect(process.env.FB_PAGE_ID).toBe('NewPageID123');
  });

  test('Partial mask string (e.g. EAAP••••••••cbs5) does not overwrite active configuration', async () => {
    process.env.IG_ACCESS_TOKEN = 'secret_instagram_token_99999';

    await configRepo.updateConfig({
      IG_ACCESS_TOKEN: 'EAAP••••••••cbs5'
    });

    expect(process.env.IG_ACCESS_TOKEN).toBe('secret_instagram_token_99999');
  });

  test('Empty string for sensitive key does not overwrite active configuration', async () => {
    process.env.X_BEARER_TOKEN = 'valid_bearer_token_abc';

    await configRepo.updateConfig({
      X_BEARER_TOKEN: ''
    });

    expect(process.env.X_BEARER_TOKEN).toBe('valid_bearer_token_abc');
  });

  test('Genuinely new credential correctly updates the configuration', async () => {
    process.env.YOUTUBE_API_KEY = 'old_key_111';

    await configRepo.updateConfig({
      YOUTUBE_API_KEY: 'new_fresh_youtube_key_222'
    });

    expect(process.env.YOUTUBE_API_KEY).toBe('new_fresh_youtube_key_222');
  });
});
