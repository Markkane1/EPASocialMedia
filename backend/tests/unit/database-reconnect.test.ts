import { PrismaClientSingleton } from '../../src/infrastructure/database/PrismaClientSingleton';

describe('Resilient Database Reconnection (Item 11, H-33, T-09)', () => {
  let mockQueryRaw: jest.Mock;

  beforeEach(() => {
    PrismaClientSingleton.reset();
    mockQueryRaw = jest.fn();
    (PrismaClientSingleton as any).instance = {
      $queryRaw: mockQueryRaw
    };
  });

  afterEach(() => {
    PrismaClientSingleton.reset();
  });

  it('marks connection true when $queryRaw succeeds', async () => {
    mockQueryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);

    const connected = await PrismaClientSingleton.checkConnection();
    expect(connected).toBe(true);
    expect(mockQueryRaw).toHaveBeenCalledTimes(1);

    // Subsequent call uses cached true
    const cachedConnected = await PrismaClientSingleton.checkConnection();
    expect(cachedConnected).toBe(true);
    expect(mockQueryRaw).toHaveBeenCalledTimes(1);
  });

  it('marks connection false when $queryRaw fails and respects backoff window', async () => {
    mockQueryRaw.mockRejectedValueOnce(new Error('Connection refused'));

    const connected = await PrismaClientSingleton.checkConnection();
    expect(connected).toBe(false);
    expect(mockQueryRaw).toHaveBeenCalledTimes(1);

    // Immediate second call should be throttled by backoff without extra query calls
    const throttledCall = await PrismaClientSingleton.checkConnection();
    expect(throttledCall).toBe(false);
    expect(mockQueryRaw).toHaveBeenCalledTimes(1);
  });

  it('forceReconnect bypasses backoff to retry immediately', async () => {
    mockQueryRaw.mockRejectedValueOnce(new Error('Connection refused'));
    await PrismaClientSingleton.checkConnection();
    expect(mockQueryRaw).toHaveBeenCalledTimes(1);

    // Now mock database recovered
    mockQueryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);

    const recovered = await PrismaClientSingleton.forceReconnect();
    expect(recovered).toBe(true);
    expect(mockQueryRaw).toHaveBeenCalledTimes(2);
  });
});
