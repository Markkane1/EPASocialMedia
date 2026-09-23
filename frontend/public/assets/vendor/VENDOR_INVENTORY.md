# Third-Party Vendor Asset Inventory & Management (Audit L-08)

This directory houses third-party vendor assets used for the EPA Punjab Social Media Dashboard client. These files are pinned, version-controlled, and audited to support 100% offline, air-gapped, and government network deployments without runtime third-party CDN reliance.

## Asset Roster & Version Mapping

| Asset / Library | Directory | Version | License | Upstream Origin | Purpose |
|---|---|---|---|---|---|
| **Bootstrap 5** | `vendor/js/bootstrap.js`, `vendor/css/core.css` | 5.3.x | MIT | [getbootstrap.com](https://getbootstrap.com) | Responsive grid, utilities, modals, dropdowns |
| **Sneat Admin Template** | `vendor/js/`, `vendor/css/` | 1.0.x | Theme License | [themeselection.com](https://themeselection.com) | Core administrative dashboard layout & theme |
| **ApexCharts** | `vendor/libs/apex-charts/` | 3.45.x | MIT | [apexcharts.com](https://apexcharts.com) | Multi-series comparative reach & audience share charts |
| **jQuery** | `vendor/libs/jquery/` | 3.7.x | MIT | [jquery.com](https://jquery.com) | Legacy DOM adapter for Sneat menu animations |
| **Popper.js** | `vendor/libs/popper/` | 2.11.x | MIT | [popper.js.org](https://popper.js.org) | Tooltip and dropdown positioning engine |
| **Perfect Scrollbar** | `vendor/libs/perfect-scrollbar/` | 1.5.x | MIT | [github.com/mdbootstrap/perfect-scrollbar](https://github.com/mdbootstrap/perfect-scrollbar) | Smooth custom container scrolling |
| **Public Sans Font** | `vendor/fonts/public-sans/` | 2.1.x | SIL Open Font License | [uswds/public-sans](https://github.com/uswds/public-sans) | Self-hosted government design system typography (L-09) |
| **Iconify / Boxicons** | `vendor/fonts/iconify-icons.css` | 2.1.x | MIT | [boxicons.com](https://boxicons.com) | System & platform interface icons |

## Maintenance & Upgrade Protocol

1. **Vulnerability Sweeps:** Review vendor dependencies during scheduled quarterly security audits.
2. **Patching:** When a vendor patch or security update is published, replace the corresponding minified artifact under its designated vendor subfolder and verify SRI hash integrity against upstream release tags.
3. **No Unaudited Injections:** No external `<script src="https://...">` or `<link href="https://...">` may be added to `index.html`. All vendor dependencies must be self-hosted within this directory and whitelisted via Content Security Policy `'self'`.
