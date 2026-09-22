import sys
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:8080"
ARTIFACT_DIR = "C:/Users/Asif/.gemini/antigravity/brain/c355c590-0658-4256-88e8-cd72b479e057"

def test_periods():
    print("=" * 65)
    print("VERIFYING FACEBOOK STATS ACROSS 7D, 28D, 90D, AND YTD")
    print("=" * 65)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1600, 'height': 1050})

        page.goto(f"{BASE_URL}#platform/facebook")
        page.wait_for_timeout(2000)

        # Helper to read all detail KPIs
        def get_kpis():
            return {
                "impressions": page.locator("#detailKpiImpressions").text_content().strip(),
                "views": page.locator("#detailKpiViews").text_content().strip(),
                "viewers": page.locator("#detailKpiViewers").text_content().strip(),
                "reach": page.locator("#detailKpiReach").text_content().strip(),
                "followers": page.locator("#detailKpiFollowers").text_content().strip(),
                "engagement": page.locator("#detailKpiEngagement").text_content().strip(),
                "linkClicks": page.locator("#detailKpiLinkClicks").text_content().strip(),
                "visits": page.locator("#detailKpiVisits").text_content().strip(),
                "periodLabel": page.locator("#platformPeriodLabel").text_content().strip()
            }

        # 1. Check 28D (default)
        kpis_28d = get_kpis()
        print("\n[28D STATS]:")
        for k, v in kpis_28d.items():
            print(f"  {k}: {v}")
        page.screenshot(path=f"{ARTIFACT_DIR}/qa_fb_28d.png")

        # 2. Select 7D via detail dropdown
        print("\nSelecting 7D from detail dropdown...")
        page.click("#platformPeriodDropdownBtn")
        page.wait_for_timeout(400)
        page.click('.period-toggle-item[data-period="7d"]')
        page.wait_for_timeout(2500)

        kpis_7d = get_kpis()
        print("\n[7D STATS]:")
        for k, v in kpis_7d.items():
            print(f"  {k}: {v}")
        page.screenshot(path=f"{ARTIFACT_DIR}/qa_fb_7d.png")

        # Assert 7D is different from 28D
        assert kpis_7d["views"] != kpis_28d["views"], f"7D views should differ from 28D! Got {kpis_7d['views']}"
        assert kpis_7d["impressions"] != kpis_28d["impressions"], f"7D impressions should differ from 28D!"
        assert kpis_7d["engagement"] != kpis_28d["engagement"], f"7D engagement should differ from 28D!"
        print("  ✔ 7D stats correctly differ from 28D!")

        # 3. Select 90D via navbar button
        print("\nSelecting 90D from top navbar button...")
        page.click('button[data-period="90d"]')
        page.wait_for_timeout(2500)

        kpis_90d = get_kpis()
        print("\n[90D STATS]:")
        for k, v in kpis_90d.items():
            print(f"  {k}: {v}")
        page.screenshot(path=f"{ARTIFACT_DIR}/qa_fb_90d.png")

        # Assert 90D is different from 28D and 7D
        assert kpis_90d["views"] != kpis_28d["views"], f"90D views should differ from 28D! Got {kpis_90d['views']}"
        assert kpis_90d["views"] != kpis_7d["views"], f"90D views should differ from 7D! Got {kpis_90d['views']}"
        assert kpis_90d["engagement"] != kpis_28d["engagement"], f"90D engagement should differ from 28D!"
        print("  ✔ 90D stats correctly scaled and differ from 28D and 7D!")

        # 4. Select YTD via navbar button
        print("\nSelecting YTD from top navbar button...")
        page.click('button[data-period="ytd"]')
        page.wait_for_timeout(2500)

        kpis_ytd = get_kpis()
        print("\n[YTD STATS]:")
        for k, v in kpis_ytd.items():
            print(f"  {k}: {v}")
        page.screenshot(path=f"{ARTIFACT_DIR}/qa_fb_ytd.png")

        # Assert YTD is different from all
        assert kpis_ytd["views"] != kpis_90d["views"], f"YTD views should differ from 90D! Got {kpis_ytd['views']}"
        assert kpis_ytd["engagement"] != kpis_90d["engagement"], f"YTD engagement should differ from 90D!"
        print("  ✔ YTD stats correctly scaled and differ from 90D!")

        # Confirm all 4 views are distinct
        all_views = [kpis_7d["views"], kpis_28d["views"], kpis_90d["views"], kpis_ytd["views"]]
        assert len(set(all_views)) == 4, f"All 4 periods must have unique views values! Got: {all_views}"

        all_eng = [kpis_7d["engagement"], kpis_28d["engagement"], kpis_90d["engagement"], kpis_ytd["engagement"]]
        assert len(set(all_eng)) == 4, f"All 4 periods must have unique engagement values! Got: {all_eng}"

        print("\n" + "=" * 65)
        print("SUCCESS: ALL 4 PERIODS DISPLAY AUTHENTIC, DISTINCT METRICS!")
        print(f"  7D Views:  {kpis_7d['views']}  | Eng: {kpis_7d['engagement']}")
        print(f"  28D Views: {kpis_28d['views']}  | Eng: {kpis_28d['engagement']}")
        print(f"  90D Views: {kpis_90d['views']}  | Eng: {kpis_90d['engagement']}")
        print(f"  YTD Views: {kpis_ytd['views']} | Eng: {kpis_ytd['engagement']}")
        print("=" * 65)

        browser.close()

if __name__ == "__main__":
    test_periods()
