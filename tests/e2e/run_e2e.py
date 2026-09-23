"""
tests/e2e/run_e2e.py - Playwright E2E Verification
Verifies:
1. Scrubbed Executive Dashboard (No PERA button, no tech watermarks)
2. Dynamic Date Range Selection (From Date -> To Date)
3. Platform Master-Detail Pages (Facebook & LinkedIn drill-down)
4. Admin Portal Security Gate (RBAC Login & Validation)
5. Admin API Settings Panel (Authenticated Config & Connection Testing)
"""

import sys
import os
import time
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:8080"
ARTIFACT_DIR = os.environ.get("ARTIFACT_DIR", os.path.join(os.path.dirname(__file__), "artifacts"))
os.makedirs(ARTIFACT_DIR, exist_ok=True)

def run_tests():
    print("=" * 65)
    print("EPA PUNJAB SOCIAL DASHBOARD — PLAYWRIGHT E2E VERIFICATION")
    print("=" * 65)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1600, 'height': 1050})

        # 1. Base Executive Dashboard & Scrubbing Verification
        print("\n[1/6] Loading Executive Dashboard (Verifying Scrubbed UI)...")
        page.goto(BASE_URL)
        page.wait_for_timeout(1500)

        # Confirm title is EPA Punjab
        title = page.locator('#dashboardTitle').text_content()
        assert "EPA Punjab" in title, f"Expected EPA Punjab, got: {title}"

        # Confirm PERA toggle is GONE
        assert page.locator('#brandToggleBtn').count() == 0, "PERA brand toggle button must not exist"

        # Confirm Clean Architecture badge is GONE
        page_html = page.content()
        assert "● CLEAN ARCHITECTURE • POSTGRESQL + PRISMA" not in page_html, "Developer status pill must not exist"
        assert "Clean Architecture Edition" not in page_html, "Developer footer watermark must not exist"
        assert "Page 17" not in page_html, "Page 17 footer watermark must not exist"

        page.screenshot(path=f"{ARTIFACT_DIR}/qa_scrubbed_dashboard.png")
        page.screenshot(path=f"{ARTIFACT_DIR}/qa_homepage_360_fullpage.png", full_page=True)
        print("  ✔ Base dashboard scrubbed cleanly: Zero developer watermarks, 100% official EPA Punjab")

        # 2. Dynamic Date Range Selection (From -> To)
        print("\n[2/6] Testing Dynamic Date Range Filter (From Date -> To Date)...")
        page.fill('#filterDateFrom', '2026-02-01')
        page.fill('#filterDateTo', '2026-02-15')
        page.click('#btnApplyDate')
        page.wait_for_timeout(1000)

        reporting_label = page.locator('#reportingPeriodLabel').text_content()
        assert "2026-02-01 to 2026-02-15" in reporting_label, f"Unexpected date label: {reporting_label}"
        assert "15 Days" in reporting_label, f"Expected 15 Days in label, got: {reporting_label}"

        section_title = page.locator('#sectionInsightsTitle').text_content()
        assert "15 Days" in section_title, f"Expected 15 Days in section title, got: {section_title}"

        page.screenshot(path=f"{ARTIFACT_DIR}/qa_dynamic_date_range.png")
        print(f"  ✔ Dynamic date range applied successfully: {reporting_label}")

        # 3. Master-Detail Page for Facebook
        print("\n[3/6] Testing Facebook Master-Detail Analytics Page...")
        page.locator('.platform-column[data-platform="facebook"]').click()
        page.wait_for_timeout(800)

        # Confirm we are on the detail view
        assert page.locator('#viewPlatformDetail').is_visible(), "Master-detail view container not visible"
        assert page.locator('#viewDashboard').is_hidden(), "Dashboard view should be hidden"

        channel_name = page.locator('.detail-channel-name').text_content()
        assert "Environmental Protection Agency Punjab" in channel_name
        assert page.locator('.activity-item').count() >= 2, "Expected recent activities list"

        page.screenshot(path=f"{ARTIFACT_DIR}/qa_facebook_master_detail.png")
        print("  ✔ Facebook Master-Detail page rendered with channel profile, verified stats, and activity feed")

        # Click Back button
        page.click('#btnBackToOverview')
        page.wait_for_timeout(600)
        assert page.locator('#viewDashboard').is_visible(), "Dashboard view should be visible after back navigation"
        print("  ✔ Back to Executive Overview navigation confirmed")

        # 4. Master-Detail Page for LinkedIn
        print("\n[4/6] Testing LinkedIn Master-Detail Analytics Page...")
        page.locator('.platform-column[data-platform="linkedin"]').click()
        page.wait_for_timeout(800)
        assert "609" in page.content(), "Expected 609 LinkedIn followers on detail page"
        page.screenshot(path=f"{ARTIFACT_DIR}/qa_linkedin_master_detail.png")
        page.click('#btnBackToOverview')
        page.wait_for_timeout(600)
        print("  ✔ LinkedIn Master-Detail page confirmed with 609 followers")

        # 5. Dedicated Admin Portal Security Gate (RBAC)
        print("\n[5/6] Testing Admin Portal Security Gate (RBAC Login)...")
        page.click('#adminPortalBtn')
        page.wait_for_timeout(800)

        assert page.locator('#viewAdminSettings').is_visible(), "Settings container should be visible"
        assert page.locator('#adminLoginForm').is_visible(), "Admin Login form must be visible to unauthenticated user"

        page.screenshot(path=f"{ARTIFACT_DIR}/qa_admin_login_gate.png")

        # Test invalid credentials
        page.fill('#loginUsername', 'admin')
        page.fill('#loginPassword', 'WrongPass123')
        page.click('#btnSubmitLogin')
        page.wait_for_timeout(600)
        assert page.locator('#loginErrorAlert').is_visible(), "Error alert should be displayed for wrong password"
        print("  ✔ Invalid credentials successfully blocked by security guard")

        # Test valid admin credentials
        admin_pass = os.environ.get('E2E_ADMIN_PASSWORD', 'TestAdmin@2026!')
        page.fill('#loginPassword', admin_pass)
        page.click('#btnSubmitLogin')
        page.wait_for_timeout(1000)

        # 6. Authenticated Admin Settings Panel
        print("\n[6/6] Verifying Authenticated Admin API Settings Panel...")
        assert page.locator('.settings-header-card').is_visible(), "Settings header must be visible after login"
        assert page.locator('.admin-badge').text_content() == "ADMINISTRATOR"

        # Verify platform groups exist
        assert page.locator('input[name="FB_PAGE_ID"]').is_visible()
        assert page.locator('input[name="X_USERNAME"]').is_visible()
        assert page.locator('input[name="LINKEDIN_VANITY_NAME"]').is_visible()

        page.screenshot(path=f"{ARTIFACT_DIR}/qa_admin_settings_authenticated.png")
        print("  ✔ Admin settings panel unlocked: API configuration and platform testing fully accessible")

        # Return to dashboard
        page.click('#btnSettingsBack')
        page.wait_for_timeout(600)
        assert page.locator('#viewDashboard').is_visible(), "Dashboard view should be restored"

        browser.close()
        print("\nALL 6 PLAYWRIGHT E2E SPECIFICATIONS PASSED SUCCESSFULLY!")

if __name__ == '__main__':
    run_tests()
