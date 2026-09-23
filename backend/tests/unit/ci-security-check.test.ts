import fs from 'fs';
import path from 'path';

describe('Security Audit Automation & CI Pipeline (Item 21, T-02, T-03)', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  it('declares reproducible CI security gate workflow in GitHub Actions', () => {
    const ciPath = path.join(rootDir, '.github/workflows/ci-security-gate.yml');
    expect(fs.existsSync(ciPath)).toBe(true);

    const ciContent = fs.readFileSync(ciPath, 'utf8');
    expect(ciContent).toContain('npm audit');
    expect(ciContent).toContain('npm test');
    expect(ciContent).toContain('requirements-e2e.txt');
  });

  it('provides automated static audit reproducer script', () => {
    const scriptPath = path.join(__dirname, '../../scripts/security-audit-check.js');
    expect(fs.existsSync(scriptPath)).toBe(true);

    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    expect(scriptContent).toContain('EAAPXGWOK');
    expect(scriptContent).toContain('unsafe-inline');
  });
});
