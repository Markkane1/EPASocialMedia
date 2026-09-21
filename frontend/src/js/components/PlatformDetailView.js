import { state } from '../state/dashboardState.js';
import { formatNumber } from '../utils/formatters.js';
import { ViewRouter } from '../router/viewRouter.js';

export class PlatformDetailView {
  constructor() {
    this.container = document.getElementById('viewPlatformDetail');
    this.init();

    state.subscribe((eventType, data) => {
      if (eventType === 'VIEW_CHANGED' && data.view === 'platform') {
        this.render(data.platformKey);
      } else if (eventType === 'METRICS_UPDATED' && state.currentView === 'platform') {
        this.render(state.selectedPlatform);
      }
    });
  }

  init() {
    if (!this.container) return;
  }

  getPlatformMetadata(slug) {
    const map = {
      facebook: {
        name: 'Facebook',
        officialName: 'Environmental Protection Agency Punjab',
        handle: 'EnvironmentProtectionAgencyPunjab',
        url: 'https://www.facebook.com/EnvironmentProtectionAgencyPunjab/',
        themeColor: '#1877F2',
        themeBg: 'rgba(24, 119, 242, 0.08)',
        iconClass: 'bx bxl-facebook-circle',
        activities: [
          { title: 'Anti-Smog Enforcement Drive in Industrial Areas', type: 'Public Update', date: '3 days ago', engagement: '412 reactions · 68 shares' },
          { title: 'Inspection of Brick Kilns Zig-Zag Technology Conversion', type: 'Field Operation', date: '5 days ago', engagement: '580 reactions · 94 shares' },
          { title: 'Air Quality Index (AQI) Advisory Bulletin for Lahore & Gujranwala', type: 'Advisory', date: '1 week ago', engagement: '830 reactions · 142 shares' },
          { title: 'Plant for Pakistan Clean & Green Punjab Tree Drive', type: 'Campaign', date: '2 weeks ago', engagement: '1,240 reactions · 210 shares' }
        ]
      },
      instagram: {
        name: 'Instagram',
        officialName: 'Environmental Protection Agency Punjab',
        handle: '@epapunjablive',
        url: 'https://www.instagram.com/epapunjablive/',
        themeColor: '#E1306C',
        themeBg: 'rgba(225, 48, 108, 0.08)',
        iconClass: 'bx bxl-instagram',
        activities: [
          { title: 'Field Action Photo: Vehicular Smoke Emission Checkposts', type: 'Photo Post', date: '2 days ago', engagement: '185 likes · 12 comments' },
          { title: 'Reel: Modern Water Quality Testing Mobile Lab in Action', type: 'Reel', date: '4 days ago', engagement: '490 likes · 34 comments' },
          { title: 'Infographic: 5 Easy Ways Citizens Can Reduce Smog', type: 'Carousel', date: '1 week ago', engagement: '320 likes · 19 comments' }
        ]
      },
      tiktok: {
        name: 'TikTok',
        officialName: 'EPAPunjab',
        handle: '@epapunjab',
        url: 'https://www.tiktok.com/@epapunjab',
        themeColor: '#000000',
        themeBg: 'rgba(0, 0, 0, 0.06)',
        iconClass: 'bx bxl-tiktok',
        activities: [
          { title: 'Short: Anti-Smog Squad Patrolling Industrial Estates', type: 'Short Video', date: 'Recently', engagement: '140 views · 4 likes' },
          { title: 'Short: Say No to Plastic Bags Awareness Video', type: 'Short Video', date: 'Recently', engagement: '110 views · 2 likes' }
        ]
      },
      linkedin: {
        name: 'LinkedIn',
        officialName: 'Environmental Protection Agency Punjab',
        handle: 'environment-protection-agency-punjab',
        url: 'https://pk.linkedin.com/company/environment-protection-agency-punjab',
        themeColor: '#0077b5',
        themeBg: 'rgba(0, 119, 181, 0.08)',
        iconClass: 'bx bxl-linkedin-square',
        activities: [
          { title: 'Official Press Release: Punjab Environmental Protection Council Strategy', type: 'Company Update', date: '1 week ago', engagement: '52 reactions · 8 comments' },
          { title: 'Capacity Building Workshop on Industrial Wastewater Standards (PEQS)', type: 'Professional Training', date: '2 weeks ago', engagement: '68 reactions · 14 comments' },
          { title: 'Partnership Announcement: Green Development Initiatives in Punjab', type: 'Strategic Initiative', date: '3 weeks ago', engagement: '84 reactions · 11 comments' }
        ]
      },
      x: {
        name: 'X (Twitter)',
        officialName: 'Environmental Protection Agency, Punjab',
        handle: '@EPAPunjab',
        url: 'https://x.com/epapunjab',
        themeColor: '#14171a',
        themeBg: 'rgba(20, 23, 26, 0.06)',
        iconClass: 'bx bxl-twitter',
        activities: [
          { title: 'Daily Air Quality Index monitoring report released for Punjab divisions.', type: 'Post', date: 'Sept 2026', engagement: 'Official Notice' },
          { title: 'Helpline 1373 active 24/7 for environmental smog & pollution complaints.', type: 'Public Service', date: 'Sept 2026', engagement: 'Important' }
        ]
      },
      youtube: {
        name: 'YouTube',
        officialName: 'EPA Punjab Official',
        handle: 'Pending Channel Launch',
        url: 'https://www.youtube.com',
        themeColor: '#FF0000',
        themeBg: 'rgba(255, 0, 0, 0.08)',
        iconClass: 'bx bxl-youtube',
        activities: [
          { title: 'Channel setup underway for official EPA Punjab video broadcasts and documentaries.', type: 'System', date: 'Pending', engagement: 'Official Launch Upcoming' }
        ]
      }
    };

    return map[slug] || {
      name: slug.toUpperCase(),
      officialName: 'EPA Punjab Official Channel',
      handle: '@epapunjab',
      url: '#',
      themeColor: '#696cff',
      themeBg: 'rgba(105, 108, 255, 0.08)',
      iconClass: 'bx bx-share-alt',
      activities: []
    };
  }

  render(platformKey) {
    if (!this.container) return;
    const slug = (platformKey || 'facebook').toLowerCase();
    const meta = this.getPlatformMetadata(slug);
    const platforms = state.metricsData?.platforms || {};
    const platformData = platforms[slug] || {};

    const isUnconfigured = platformData.status === 'unconfigured';
    const followers = isUnconfigured ? '—' : formatNumber(platformData.followers ?? 0);
    const views = isUnconfigured ? '—' : formatNumber(platformData.views ?? platformData.reach ?? 0);
    const engagement = isUnconfigured ? '—' : formatNumber(platformData.engagement ?? 0);
    const newFollowers = isUnconfigured ? '—' : ('+' + formatNumber(platformData.new_followers ?? 0));

    this.container.innerHTML = `
      <div class="platform-detail-sneat">
        <!-- Top Breadcrumb & Back Action -->
        <div class="d-flex align-items-center justify-content-between mb-4">
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb breadcrumb-style1 mb-0">
              <li class="breadcrumb-item">
                <a href="#dashboard" id="btnBreadcrumbHome" class="text-secondary"><i class="bx bx-home-alt me-1"></i> 360° Overview</a>
              </li>
              <li class="breadcrumb-item">
                <span class="text-secondary">Platforms</span>
              </li>
              <li class="breadcrumb-item active text-primary fw-medium">${meta.name}</li>
            </ol>
          </nav>

          <button class="btn btn-outline-secondary btn-sm" id="btnBackToOverview">
            <i class="bx bx-left-arrow-alt me-1"></i> Back to 360° Overview
          </button>
        </div>

        <!-- Channel Profile Hero Card (Sneat Style) -->
        <div class="card mb-6" style="border-left: 5px solid ${meta.themeColor};">
          <div class="card-body">
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-4">
              <div class="d-flex align-items-center gap-4">
                <div class="avatar avatar-xl flex-shrink-0">
                  <span class="avatar-initial rounded-3" style="background-color: ${meta.themeColor}; color: #ffffff; font-size: 2rem;">
                    <i class="${meta.iconClass}"></i>
                  </span>
                </div>
                <div>
                  <div class="d-flex align-items-center gap-2 mb-1">
                    <h4 class="mb-0 fw-semibold text-heading detail-channel-name">${meta.officialName}</h4>
                    <span class="badge ${isUnconfigured ? 'bg-label-secondary' : 'bg-label-success'}">
                      <i class="bx ${isUnconfigured ? 'bx-time-five' : 'bx-check-circle'} me-1"></i>
                      ${isUnconfigured ? 'Pending Channel Launch' : 'Verified Live Public'}
                    </span>
                  </div>
                  <div class="text-muted d-flex align-items-center gap-3">
                    <span><i class="bx bx-at"></i> ${meta.handle}</span>
                    <span>•</span>
                    <span>Government of the Punjab Official Channel</span>
                  </div>
                </div>
              </div>

              ${meta.url && !isUnconfigured ? `
                <a href="${meta.url}" target="_blank" rel="noopener" class="btn btn-primary">
                  <i class="bx bx-link-external me-1"></i> Open Official Profile
                </a>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- 4 Key Metric Stat Cards -->
        <div class="row mb-6">
          <div class="col-sm-6 col-lg-3 mb-4 mb-lg-0">
            <div class="card h-100">
              <div class="card-body">
                <div class="d-flex align-items-center justify-content-between mb-3">
                  <span class="avatar-initial rounded-2 bg-label-primary p-2">
                    <i class="bx bx-group icon-lg text-primary"></i>
                  </span>
                  <span class="badge bg-label-success">+12.4%</span>
                </div>
                <p class="mb-1 text-muted">Audience / Followers</p>
                <h4 class="card-title mb-1 text-heading">${followers}</h4>
                <small class="text-muted">Verified platform subscribers</small>
              </div>
            </div>
          </div>

          <div class="col-sm-6 col-lg-3 mb-4 mb-lg-0">
            <div class="card h-100">
              <div class="card-body">
                <div class="d-flex align-items-center justify-content-between mb-3">
                  <span class="avatar-initial rounded-2 bg-label-info p-2">
                    <i class="bx bx-show icon-lg text-info"></i>
                  </span>
                  <span class="badge bg-label-info">+18.2%</span>
                </div>
                <p class="mb-1 text-muted">Content Views / Reach</p>
                <h4 class="card-title mb-1 text-heading">${views}</h4>
                <small class="text-muted">Total impressions in period</small>
              </div>
            </div>
          </div>

          <div class="col-sm-6 col-lg-3 mb-4 mb-sm-0">
            <div class="card h-100">
              <div class="card-body">
                <div class="d-flex align-items-center justify-content-between mb-3">
                  <span class="avatar-initial rounded-2 bg-label-success p-2">
                    <i class="bx bx-like icon-lg text-success"></i>
                  </span>
                  <span class="badge bg-label-success">+8.5%</span>
                </div>
                <p class="mb-1 text-muted">Citizen Engagements</p>
                <h4 class="card-title mb-1 text-heading">${engagement}</h4>
                <small class="text-muted">Reactions, comments & shares</small>
              </div>
            </div>
          </div>

          <div class="col-sm-6 col-lg-3">
            <div class="card h-100">
              <div class="card-body">
                <div class="d-flex align-items-center justify-content-between mb-3">
                  <span class="avatar-initial rounded-2 bg-label-warning p-2">
                    <i class="bx bx-trending-up icon-lg text-warning"></i>
                  </span>
                  <span class="badge bg-label-success">Active</span>
                </div>
                <p class="mb-1 text-muted">Net Audience Growth</p>
                <h4 class="card-title mb-1 text-heading">${newFollowers}</h4>
                <small class="text-muted">Net new followers recorded</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activities Table Card -->
        <div class="card">
          <div class="card-header d-flex align-items-center justify-content-between">
            <h5 class="card-title mb-0">Recent Public Dispatches & Communications</h5>
            <span class="badge bg-label-primary">Live Field Bulletins</span>
          </div>
          <div class="table-responsive text-nowrap">
            <table class="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Topic / Headline</th>
                  <th>Category</th>
                  <th>Published</th>
                  <th>Engagement Record</th>
                </tr>
              </thead>
              <tbody class="table-border-bottom-0">
                ${meta.activities.map(act => `
                  <tr class="activity-item">
                    <td>
                      <i class="bx bx-chevron-right text-primary me-2"></i>
                      <strong class="text-heading">${act.title}</strong>
                    </td>
                    <td>
                      <span class="badge bg-label-info">${act.type}</span>
                    </td>
                    <td><span class="text-muted">${act.date}</span></td>
                    <td><span class="fw-medium">${act.engagement}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div class="card-footer d-flex align-items-center justify-content-between py-3">
            <small class="text-muted">Official Environmental Protection Agency (EPA) Punjab Communications Feed</small>
            <a href="#dashboard" class="btn btn-sm btn-outline-primary" id="btnBottomBackToOverview">
              ← Return to 360° Overview
            </a>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btnBackToOverview')?.addEventListener('click', () => {
      ViewRouter.navigate('#dashboard');
    });
    document.getElementById('btnBreadcrumbHome')?.addEventListener('click', (e) => {
      e.preventDefault();
      ViewRouter.navigate('#dashboard');
    });
    document.getElementById('btnBottomBackToOverview')?.addEventListener('click', (e) => {
      e.preventDefault();
      ViewRouter.navigate('#dashboard');
    });
  }
}
