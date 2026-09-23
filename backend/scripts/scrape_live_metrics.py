import asyncio
import sys
import json
import re
from playwright.async_api import async_playwright

sys.stdout.reconfigure(encoding='utf-8')

async def scrape_all():
    results = {
        'facebook': {'followers': 26409, 'reach': 185000, 'engagement': 1872, 'posts': 45, 'status': 'unverified', 'verified': False},
        'instagram': {'followers': 2756, 'reach': 32000, 'engagement': 1306, 'posts': 1306, 'status': 'unverified', 'verified': False},
        'tiktok': {'followers': 0, 'reach': 500, 'engagement': 4, 'posts': 5, 'status': 'unverified', 'verified': False},
        'linkedin': {'followers': 609, 'reach': 8500, 'engagement': 142, 'posts': 24, 'status': 'unverified', 'verified': False},
        'x': {'followers': 1, 'reach': 120, 'engagement': 5, 'posts': 5, 'status': 'unverified', 'verified': False},
        'youtube': {'followers': 0, 'reach': 0, 'engagement': 0, 'posts': 0, 'status': 'unconfigured', 'verified': False}
    }

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                locale="en-US"
            )

            # 1. LinkedIn
            try:
                page = await context.new_page()
                await page.goto("https://pk.linkedin.com/company/environment-protection-agency-punjab", wait_until="domcontentloaded", timeout=15000)
                await page.wait_for_timeout(2000)
                text = await page.evaluate("() => document.body.innerText")
                m = re.search(r'(\d[\d,]*)\s+followers', text, re.I)
                if m:
                    results['linkedin']['followers'] = int(m.group(1).replace(',', ''))
                    results['linkedin']['status'] = 'live_scraped'
                    results['linkedin']['verified'] = True
                await page.close()
            except Exception:
                results['linkedin']['status'] = 'failed'
                results['linkedin']['verified'] = False

            # 2. Instagram
            try:
                page = await context.new_page()
                await page.goto("https://www.instagram.com/epapunjablive/", wait_until="domcontentloaded", timeout=15000)
                await page.wait_for_timeout(2000)
                meta_desc = await page.evaluate('''() => {
                    const m = document.querySelector('meta[name="description"]') || document.querySelector('meta[property="og:description"]');
                    return m ? m.content : '';
                }''')
                m_f = re.search(r'([\d,]+)\s+Followers', meta_desc, re.I)
                m_p = re.search(r'([\d,]+)\s+Posts', meta_desc, re.I)
                if m_f:
                    results['instagram']['followers'] = int(m_f.group(1).replace(',', ''))
                    results['instagram']['status'] = 'live_scraped'
                    results['instagram']['verified'] = True
                if m_p:
                    results['instagram']['posts'] = int(m_p.group(1).replace(',', ''))
                await page.close()
            except Exception:
                results['instagram']['status'] = 'failed'
                results['instagram']['verified'] = False

            # 3. Facebook
            try:
                page = await context.new_page()
                await page.goto("https://www.facebook.com/EnvironmentProtectionAgencyPunjab/", wait_until="domcontentloaded", timeout=15000)
                await page.wait_for_timeout(2000)
                meta_desc = await page.evaluate('''() => {
                    const m = document.querySelector('meta[name="description"]') || document.querySelector('meta[property="og:description"]');
                    return m ? m.content : '';
                }''')
                m_f = re.search(r'([\d,]+)\s+followers', meta_desc, re.I)
                m_t = re.search(r'([\d,]+)\s+talking about this', meta_desc, re.I)
                if m_f:
                    results['facebook']['followers'] = int(m_f.group(1).replace(',', ''))
                    results['facebook']['status'] = 'live_scraped'
                    results['facebook']['verified'] = True
                if m_t:
                    results['facebook']['engagement'] = int(m_t.group(1).replace(',', ''))
                await page.close()
            except Exception:
                results['facebook']['status'] = 'failed'
                results['facebook']['verified'] = False

            # 4. TikTok
            try:
                page = await context.new_page()
                await page.goto("https://www.tiktok.com/@epapunjab", wait_until="networkidle", timeout=20000)
                await page.wait_for_timeout(2000)
                univ = await page.evaluate('''() => {
                    const s = document.getElementById('__UNIVERSAL_DATA_FOR_REHYDRATION__');
                    return s ? s.innerText : '';
                }''')
                if univ:
                    m_f = re.search(r'"followerCount":\s*(\d+)', univ)
                    m_l = re.search(r'"heartCount":\s*(\d+)', univ)
                    m_v = re.search(r'"videoCount":\s*(\d+)', univ)
                    if m_f:
                        results['tiktok']['followers'] = int(m_f.group(1))
                        results['tiktok']['status'] = 'live_scraped'
                        results['tiktok']['verified'] = True
                    if m_l: results['tiktok']['engagement'] = int(m_l.group(1))
                    if m_v: results['tiktok']['posts'] = int(m_v.group(1))
                await page.close()
            except Exception:
                results['tiktok']['status'] = 'failed'
                results['tiktok']['verified'] = False

            # 5. X
            try:
                page = await context.new_page()
                await page.goto("https://x.com/epapunjab", wait_until="domcontentloaded", timeout=15000)
                await page.wait_for_timeout(2000)
                text = await page.evaluate("() => document.body.innerText")
                m_f = re.search(r'"followers":\s*(\d+)', text)
                if m_f:
                    results['x']['followers'] = int(m_f.group(1))
                    results['x']['status'] = 'live_scraped'
                    results['x']['verified'] = True
                await page.close()
            except Exception:
                results['x']['status'] = 'failed'
                results['x']['verified'] = False

            await browser.close()
    except Exception:
        pass

    # Print pure JSON output
    print("---JSON_START---")
    print(json.dumps(results))
    print("---JSON_END---")

if __name__ == '__main__':
    asyncio.run(scrape_all())
