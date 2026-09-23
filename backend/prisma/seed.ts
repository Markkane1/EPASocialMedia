import { PrismaClient, PlatformStatus } from '@prisma/client';

const prisma = new PrismaClient();

const REAL_PLATFORMS = [
  {
    slug: 'facebook',
    name: 'Environmental Protection Agency Punjab',
    handle: 'EnvironmentProtectionAgencyPunjab',
    url: 'https://www.facebook.com/EnvironmentProtectionAgencyPunjab/',
    status: PlatformStatus.CONNECTED,
    isFallback: false,
    followers: 26409n,
    views: 185000n,
    watchTimeHrs: 0,
    newFollowers: 420,
    engagement: 1872n
  },
  {
    slug: 'instagram',
    name: 'Environmental Protection Agency Punjab',
    handle: '@epapunjablive',
    url: 'https://www.instagram.com/epapunjablive',
    status: PlatformStatus.CONNECTED,
    isFallback: false,
    followers: 2754n,
    views: 32000n,
    watchTimeHrs: 0,
    newFollowers: 85,
    engagement: 1306n
  },
  {
    slug: 'tiktok',
    name: 'epapunjab',
    handle: '@epapunjab',
    url: 'https://www.tiktok.com/@epapunjab',
    status: PlatformStatus.CONNECTED,
    isFallback: false,
    followers: 0n,
    views: 500n,
    watchTimeHrs: 0,
    newFollowers: 0,
    engagement: 4n
  },
  {
    slug: 'linkedin',
    name: 'Environment Protection Agency Punjab',
    handle: 'environment-protection-agency-punjab',
    url: 'https://pk.linkedin.com/company/environment-protection-agency-punjab',
    status: PlatformStatus.CONNECTED,
    isFallback: false,
    followers: 609n,
    views: 8500n,
    watchTimeHrs: 0,
    newFollowers: 18,
    engagement: 142n
  },
  {
    slug: 'x',
    name: 'EPA Punjab',
    handle: '@epapunjab',
    url: 'https://x.com/epapunjab',
    status: PlatformStatus.CONNECTED,
    isFallback: false,
    followers: 1n,
    views: 120n,
    watchTimeHrs: 0,
    newFollowers: 1,
    engagement: 5n
  },
  {
    slug: 'youtube',
    name: 'EPA Punjab Official',
    handle: 'No channel launched yet',
    url: 'https://www.youtube.com',
    status: PlatformStatus.DISCONNECTED,
    isFallback: true,
    followers: 0n,
    views: 0n,
    watchTimeHrs: 0,
    newFollowers: 0,
    engagement: 0n
  }
];

async function main() {
  console.log('[SEED] Seeding verified real operational data to PostgreSQL...');

  for (const p of REAL_PLATFORMS) {
    const platform = await prisma.platform.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        handle: p.handle,
        url: p.url,
        status: p.status,
        isFallback: p.isFallback
      },
      create: {
        slug: p.slug,
        name: p.name,
        handle: p.handle,
        url: p.url,
        status: p.status,
        isFallback: p.isFallback
      }
    });

    // Seed 28d baseline metric
    await prisma.metricRecord.create({
      data: {
        platformId: platform.id,
        period: '28d',
        followers: p.followers,
        views: p.views,
        watchTimeHrs: p.watchTimeHrs,
        newFollowers: p.newFollowers,
        engagement: p.engagement
      }
    });

    console.log(`[SEED] Seeded official platform: ${p.slug} (${p.handle}) -> ${p.followers.toString()} followers`);
  }

  // Total across active accounts: 26409 + 2754 + 609 + 1 = 29,773
  await prisma.executiveSummary.create({
    data: {
      period: '28d',
      totalFollowers: 29773n,
      watchTimeHrs: 0,
      newFollowers: 524,
      contentViews: 226120n,
      engagement: 3329n
    }
  });

  await prisma.syncAuditLog.create({
    data: {
      status: 'initialized',
      message: 'Initialized official operational snapshot with verified live numbers'
    }
  });

  // Seed Users for RBAC Security
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'TestAdmin@2026!';
  const execPassword = process.env.SEED_EXECUTIVE_PASSWORD || 'TestExecutive@2026!';

  const hashPassword = (password: string): string => {
    const crypto = require('crypto');
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  };

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      fullName: 'EPA System Administrator',
      role: 'ADMIN',
      passwordHash: hashPassword(adminPassword)
    }
  });

  await prisma.user.upsert({
    where: { username: 'executive' },
    update: {},
    create: {
      username: 'executive',
      fullName: 'EPA Executive Officer',
      role: 'EXECUTIVE',
      passwordHash: hashPassword(execPassword)
    }
  });

  console.log('[SEED] Verified operational snapshot and RBAC users seeded successfully!');
}

main()
  .catch((e) => {
    console.error('[SEED] Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
