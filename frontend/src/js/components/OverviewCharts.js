/**
 * OverviewCharts.js - Sneat Interactive ApexCharts for EPA Punjab 360° Overview
 * Polish Pass: Dramatic chart entrance animations, easing, hover effects.
 */

import { formatCompact, formatNumber } from '../utils/formatters.js';

export class OverviewChartsComponent {
  constructor() {
    this.barChart = null;
    this.donutChart = null;
  }

  render(metricsData) {
    if (typeof ApexCharts === 'undefined') {
      console.warn('[CHARTS] ApexCharts not yet loaded.');
      return;
    }
    this.renderComparativeBarChart(metricsData);
    this.renderAudienceShareDonut(metricsData);
  }

  renderComparativeBarChart(metricsData) {
    const el = document.querySelector('#crossPlatformBarChart');
    if (!el) return;

    if (this.barChart) { this.barChart.destroy(); }

    const rawPlatforms = metricsData?.platforms || {};
    const platforms = Array.isArray(rawPlatforms) ? rawPlatforms : Object.values(rawPlatforms);
    const active = platforms.filter(p => (p.platform || p.slug) !== 'youtube');

    const nameMap = {
      facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok',
      linkedin: 'LinkedIn', x: 'X (Twitter)', youtube: 'YouTube'
    };

    const categories   = active.map(p => nameMap[(p.platform || p.slug || '').toLowerCase()] || p.name);
    const followersData  = active.map(p => p.followers  || 0);
    const reachData      = active.map(p => p.reach || p.views || 0);
    const engagementData = active.map(p => p.engagement || 0);

    this.barChart = new ApexCharts(el, {
      series: [
        { name: 'Total Followers',        data: followersData   },
        { name: 'Reach / Content Views',  data: reachData       },
        { name: 'Citizen Engagements',    data: engagementData  }
      ],
      chart: {
        type: 'bar',
        height: 300,
        toolbar: { show: false },
        fontFamily: 'Public Sans, sans-serif',
        animations: {
          enabled: true,
          easing: 'easeOutBounce',
          speed: 900,
          animateGradually: { enabled: true, delay: 120 },
          dynamicAnimation: { enabled: true, speed: 400 }
        },
        dropShadow: {
          enabled: true,
          blur: 6,
          opacity: 0.06
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '42%',
          borderRadius: 6,
          borderRadiusApplication: 'end',
          dataLabels: { position: 'top' }
        }
      },
      dataLabels: { enabled: false },
      stroke: { show: true, width: 2, colors: ['transparent'] },
      colors: ['#696cff', '#03c3ec', '#71dd37'],
      xaxis: {
        categories,
        labels: {
          style: { colors: '#646e78', fontSize: '13px', fontWeight: 500 }
        },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        labels: {
          formatter: (val) => formatCompact(val),
          style: { colors: '#646e78', fontSize: '12px' }
        }
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: 'vertical',
          shadeIntensity: 0.15,
          opacityFrom: 1,
          opacityTo: 0.88,
          stops: [0, 100]
        }
      },
      tooltip: {
        y: { formatter: (val) => formatNumber(val) },
        style: { fontSize: '13px' }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        fontSize: '13px',
        fontWeight: 500,
        markers: { radius: 12, offsetX: -2 }
      },
      grid: {
        borderColor: '#e9eaec',
        strokeDashArray: 5,
        padding: { top: -4, right: 8, bottom: 0, left: 8 }
      },
      states: {
        hover: { filter: { type: 'darken', value: 0.88 } },
        active: { filter: { type: 'darken', value: 0.75 } }
      }
    });

    this.barChart.render();
  }

  renderAudienceShareDonut(metricsData) {
    const el = document.querySelector('#audienceShareDonutChart');
    if (!el) return;

    if (this.donutChart) { this.donutChart.destroy(); }

    const rawPlatforms = metricsData?.platforms || {};
    const platforms = Array.isArray(rawPlatforms) ? rawPlatforms : Object.values(rawPlatforms);
    const active = platforms.filter(p => (p.followers || 0) > 0);

    const nameMap = {
      facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok',
      linkedin: 'LinkedIn', x: 'X (Twitter)', youtube: 'YouTube'
    };

    const labels = active.map(p => nameMap[(p.platform || p.slug || '').toLowerCase()] || p.name);
    const series = active.map(p => p.followers || 0);

    // Update static legend text dynamically
    this._updateDonutLegend(active, series);

    this.donutChart = new ApexCharts(el, {
      series:  series.length ? series : [26409, 2754, 609, 5],
      labels:  labels.length ? labels : ['Facebook', 'Instagram', 'LinkedIn', 'TikTok & X'],
      chart: {
        type: 'donut',
        height: 240,
        fontFamily: 'Public Sans, sans-serif',
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 1000,
          animateGradually: { enabled: true, delay: 150 },
          dynamicAnimation: { enabled: true, speed: 500 }
        }
      },
      colors: ['#1877f2', '#e1306c', '#0077b5', '#696cff'],
      stroke: { width: 4, colors: ['#ffffff'] },
      dataLabels: { enabled: false },
      legend: { show: false },
      plotOptions: {
        pie: {
          expandOnClick: true,
          donut: {
            size: '74%',
            labels: {
              show: true,
              value: {
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#22303e',
                offsetY: -14,
                formatter: (val) => formatCompact(val)
              },
              name: {
                offsetY: 18,
                color: '#646e78',
                fontSize: '0.75rem'
              },
              total: {
                show: true,
                label: 'Total Audience',
                color: '#646e78',
                fontSize: '11px',
                fontWeight: 500,
                formatter: (w) => {
                  const total = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                  return formatCompact(total);
                }
              }
            }
          }
        }
      }
    });

    this.donutChart.render();
  }

  _updateDonutLegend(platforms, series) {
    const nameMap = {
      facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok',
      linkedin: 'LinkedIn', x: 'X (Twitter)', youtube: 'YouTube'
    };
    const colorMap = {
      facebook: '#1877f2', instagram: '#e1306c', linkedin: '#0077b5',
      tiktok: '#111827', x: '#696cff', youtube: '#ef4444'
    };

    const total = series.reduce((a, b) => a + b, 0);
    const legendEl = document.querySelector('#donutLegendList');
    if (!legendEl || !platforms.length) return;

    legendEl.innerHTML = platforms.map((p, i) => {
      const key = (p.platform || p.slug || '').toLowerCase();
      const name = nameMap[key] || p.name || key;
      const color = colorMap[key] || '#696cff';
      const pct = total > 0 ? ((series[i] / total) * 100).toFixed(1) : '0';
      return `
        <div class="d-flex justify-content-between align-items-center py-1">
          <span class="d-flex align-items-center small">
            <span class="badge rounded-circle p-1 me-2" style="background-color:${color};"> </span>
            ${name}
          </span>
          <span class="fw-semibold small">${series[i].toLocaleString('en-US')} (${pct}%)</span>
        </div>`;
    }).join('');
  }
}
