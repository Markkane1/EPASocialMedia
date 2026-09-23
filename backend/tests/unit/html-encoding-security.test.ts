describe('HTML Output Encoding & Anti-XSS (Item 19, L-04, L-05, L-06)', () => {
  let escapeHtml: any;

  beforeAll(async () => {
    const mod = await import('../../../frontend/src/js/utils/formatters.js');
    escapeHtml = mod.escapeHtml;
  });

  it('correctly escapes HTML special characters into safe entities', () => {
    const raw = '<script>alert("XSS & attack")</script>';
    const escaped = escapeHtml(raw);

    expect(escaped).toBe('&lt;script&gt;alert(&quot;XSS &amp; attack&quot;)&lt;/script&gt;');
    expect(escaped).not.toContain('<');
    expect(escaped).not.toContain('>');
  });

  it('escapes single and double quotes to prevent attribute breakout', () => {
    const breakout = '"><img src=x onerror=alert(1)>';
    const escaped = escapeHtml(breakout);

    expect(escaped).toBe('&quot;&gt;&lt;img src=x onerror=alert(1)&gt;');
    expect(escaped).not.toContain('<img');
  });

  it('handles null, undefined, and non-string types safely', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml(12345)).toBe('12345');
  });
});
