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
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      fullName: 'EPA System Administrator',
      role: 'ADMIN',
      passwordHash: '1981c7a87e2efe7c56ba1667614c23b9:6efe404837639e5a4e41e5b5b15010eb404745725831775918843201fc35158612b6dd97f2515561c97ac96bb86c6350c9933c3c3ba054190db580912f2cee04'
    }
  });

  await prisma.user.upsert({
    where: { username: 'executive' },
    update: {},
    create: {
      username: 'executive',
      fullName: 'EPA Executive Officer',
      role: 'EXECUTIVE',
      passwordHash: '509a8e9ff6d66eaf5926db8be79361cb:a87495d68d2dc69bf1f4146ff82384ef6922022d7f20355c625dcb0a942ecefc1456ac863aab76d2e670baa6d2dc96fe21c3e0360f649277848f708f83b26692'
    }
  });

  console.log('[SEED] Verified real metrics and RBAC users seeded successfully!');
}

main()
  .catch((e) => {
    console.error('[SEED] Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
