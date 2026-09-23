import * as fs from 'fs';
import * as path from 'path';
import { createApp } from '../../src/app';

describe('Frontend Hardening & Low-Severity Audit Verifications (L-01, L-02, L-03, L-07, L-08, L-09)', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const indexHtmlPath = path.join(rootDir, 'frontend/public/index.html');
  const distDir = path.join(rootDir, 'frontend/public/dist');

  describe('L-01 & L-07: Frontend Bundler and Source Protection', () => {
    it('should have compiled distribution artifacts in frontend/public/dist', () => {
      const bundlePath = path.join(distDir, 'bundle.js');
      const stylePath = path.join(distDir, 'style.css');
      const manifestPath = path.join(distDir, 'manifest.json');

      expect(fs.existsSync(bundlePath)).toBe(true);
      expect(fs.existsSync(stylePath)).toBe(true);
      expect(fs.existsSync(manifestPath)).toBe(true);

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      expect(manifest.assets['bundle.js']).toBeDefined();
      expect(manifest.assets['bundle.js'].sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(manifest.assets['style.css']).toBeDefined();
      expect(manifest.assets['style.css'].sha256).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should not expose /src directly as a static route in app.ts', () => {
      const app = createApp();
      const routes = (app as any)._router?.stack || [];
      const hasSrcStaticMount = routes.some(
        (layer: any) => layer.regexp && layer.regexp.source && layer.regexp.source.includes('\\/src')
      );
      expect(hasSrcStaticMount).toBe(false);
    });

    it('should reference /dist/bundle.js and /dist/style.css in index.html instead of /src', () => {
      const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
      expect(indexHtml).toContain('/dist/bundle.js');
      expect(indexHtml).toContain('/dist/style.css');
      expect(indexHtml).not.toContain('/src/js/main.js');
      expect(indexHtml).not.toContain('/src/css/style.css');
    });
  });

  describe('L-09: Self-Hosted Typography & CSP Hardening', () => {
    it('should have local Public Sans CSS and WOFF2 font files', () => {
      const fontsDir = path.join(rootDir, 'frontend/public/assets/vendor/fonts/public-sans');
      const fontCssPath = path.join(fontsDir, 'public-sans.css');
      expect(fs.existsSync(fontCssPath)).toBe(true);

      const fontFiles = fs.readdirSync(fontsDir).filter(f => f.endsWith('.woff2'));
      expect(fontFiles.length).toBeGreaterThanOrEqual(1);
    });

    it('should not load fonts from external Google CDN in index.html', () => {
      const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
      expect(indexHtml).not.toContain('https://fonts.googleapis.com');
      expect(indexHtml).not.toContain('https://fonts.gstatic.com');
      expect(indexHtml).toContain('/assets/vendor/fonts/public-sans/public-sans.css');
    });

    it('should enforce strict CSP without external Google Fonts domains in securityHeaders.ts', () => {
      const secHeadersPath = path.join(
        rootDir,
        'backend/src/interfaces/http/middlewares/securityHeaders.ts'
      );
      const content = fs.readFileSync(secHeadersPath, 'utf8');
      expect(content).not.toContain('https://fonts.googleapis.com');
      expect(content).not.toContain('https://fonts.gstatic.com');
      expect(content).toContain("font-src 'self' data:");
    });
  });

  describe('L-03: Neutral Initial KPI Loading Placeholders', () => {
    it('should not contain hardcoded static metrics in index.html', () => {
      const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
      // Should not contain stale fake metrics
      expect(indexHtml).not.toContain('id="kpiTotalFollowers">29,782</h3>');
      expect(indexHtml).not.toContain('id="kpiContentViews">1,864,561</h3>');
      expect(indexHtml).not.toContain('id="kpiEngagement">10,811</h3>');

      // Should contain neutral placeholders
      expect(indexHtml).toContain('id="kpiTotalFollowers">--</h3>');
      expect(indexHtml).toContain('id="kpiContentViews">--</h3>');
      expect(indexHtml).toContain('id="kpiEngagement">--</h3>');
    });
  });

  describe('L-02: Backend Source Map Prevention & .dockerignore', () => {
    it('should have sourceMap set to false in tsconfig.json', () => {
      const tsconfigPath = path.join(rootDir, 'backend/tsconfig.json');
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      expect(tsconfig.compilerOptions.sourceMap).toBe(false);
    });

    it('should have .dockerignore excluding source maps and git artifacts', () => {
      const dockerignorePath = path.join(rootDir, '.dockerignore');
      expect(fs.existsSync(dockerignorePath)).toBe(true);
      const dockerignore = fs.readFileSync(dockerignorePath, 'utf8');
      expect(dockerignore).toContain('*.map');
      expect(dockerignore).toContain('.git');
    });
  });
});
