#!/usr/bin/env node
/**
 * Local Security & Integrity Static Audit Scanner
 * Reproduces verification checks for dependencies, exposed secrets, and security gates (T-02, T-03).
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../..');
const findings = [];

function checkFileForPatterns(filePath, patterns) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  patterns.forEach(({ name, regex, severity }) => {
    if (regex.test(content)) {
      findings.push({ file: path.relative(rootDir, filePath), name, severity });
    }
  });
}

console.log('=' .repeat(65));
console.log('EPA PUNJAB DASHBOARD — SECURITY AUDIT REPRODUCER CHECK');
console.log('='.repeat(65));

// 1. Scan for raw live Meta access tokens (EAAPXGWOK...)
checkFileForPatterns(path.join(rootDir, '.env'), [
  { name: 'Live Meta Access Token', regex: /EAAPXGWOK[A-Za-z0-9]+/i, severity: 'CRITICAL' }
]);
checkFileForPatterns(path.join(rootDir, 'backend/.env'), [
  { name: 'Live Meta Access Token', regex: /EAAPXGWOK[A-Za-z0-9]+/i, severity: 'CRITICAL' }
]);

// 2. Scan for hard-coded default passwords in seed code
checkFileForPatterns(path.join(rootDir, 'backend/prisma/seed.ts'), [
  { name: 'Unparameterized Static Hash', regex: /DEFAULT_STATIC_HASH/i, severity: 'HIGH' }
]);

// 3. Scan for unsafe-inline in backend securityHeaders
checkFileForPatterns(path.join(rootDir, 'backend/src/interfaces/http/middlewares/securityHeaders.ts'), [
  { name: 'unsafe-inline in script-src', regex: /script-src[^;]*'unsafe-inline'/i, severity: 'MEDIUM' }
]);

// 4. Scan frontend for javascript:void(0)
const frontendHtml = path.join(rootDir, 'frontend/public/index.html');
checkFileForPatterns(frontendHtml, [
  { name: 'Inline JavaScript URL', regex: /javascript:void\(0\)/i, severity: 'LOW' }
]);

if (findings.length === 0) {
  console.log('\n[PASS] No critical, high, or medium security violations detected in scanned source files.');
  process.exit(0);
} else {
  console.error(`\n[FAIL] Found ${findings.length} security violation(s):`);
  findings.forEach(f => console.error(` - [${f.severity}] ${f.name} in ${f.file}`));
  process.exit(1);
}
