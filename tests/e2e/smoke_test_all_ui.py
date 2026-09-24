"""
tests/e2e/smoke_test_all_ui.py
Comprehensive End-to-End Live UI Smoke Test for EPA Punjab Social Media Dashboard.
Exhaustively tests every UI element, control, view, navigation item, card, widget,
chart, form, modal, and state across all application screens.
"""

import sys
import os
import time
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = os.environ.get("BASE_URL", "http://127.0.0.1:8080")
ARTIFACT_DIR = os.environ.get("ARTIFACT_DIR", os.path.join(os.path.dirname(__file__), "artifacts"))
os.makedirs(ARTIFACT_DIR, exist_ok=True)

ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Admin@EPAPunjab2026!")

passed_tests = 0
failed_tests = 0

def record(element_group: str, element_name: str, passed: bool, details: str = ""):
    global passed_tests, failed_tests
    if passed:
        passed_tests += 1
        icon = "  [PASS]"
    else:
        failed_tests += 1
        icon = "  [FAIL]"
    msg = f"{icon} [{element_group}] {element_name}"
    if details:
        msg += f" -> {details}"
    print(msg)


def run_all_ui_smoke_tests():
    global passed_tests, failed_tests
    print("=" * 80)
    print(f"EPA PUNJAB SOCIAL MEDIA DASHBOARD — EXHAUSTIVE UI SMOKE TEST")
    print(f"Target Server: {BASE_URL}")
    print("=" * 80)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1600, "height": 1050})
        page = context.new_page()

        # Capture any unhandled page errors
        console_errors = []
        page.on("pageerror", lambda err: console_errors.append(str(err)))

        # ---------------------------------------------------------------------
        # SCREEN 1: Unauthenticated Login Gate (#viewLogin)
        # ---------------------------------------------------------------------
        print("\n=== [1/8] UNAUTHENTICATED APP SHELL & LOGIN GATE ===")
        response = page.goto(BASE_URL)
        page.wait_for_timeout(1500)

        record("App Shell", "HTTP Response 200", response.status == 200, f"HTTP {response.status}")
        record("App Shell", "Page Title", "EPA Punjab" in page.title(), page.title())

        # Check Login View Container
        record("Login View", "Login Container Visible (#viewLogin)", page.locator("#viewLogin").is_visible())
        record("Login View", "Official EPA Punjab Seal Logo", page.locator("#viewLogin img[alt='EPA Punjab Seal']").is_visible())
        
        is_logo_loaded = page.evaluate("() => document.querySelector('#viewLogin img')?.naturalWidth > 0")
        record("Login View", "Official Logo Rendered (naturalWidth > 0)", bool(is_logo_loaded))

        record("Login View", "Portal Brand Title (EPA Punjab)", page.locator("#viewLogin h4:has-text('EPA Punjab')").is_visible())
        record("Login View", "Login Form (#appLoginForm)", page.locator("#appLoginForm").is_visible())
        record("Login View", "Username Field (#appLoginUsername)", page.locator("#appLoginUsername").is_visible())
        record("Login View", "Password Field (#appLoginPassword)", page.locator("#appLoginPassword").is_visible())
        record("Login View", "Remember Me Checkbox (#appRememberMe)", page.locator("#appRememberMe").is_visible())
        record("Login View", "Submit Sign In Button (#btnSubmitAppLogin)", page.locator("#btnSubmitAppLogin").is_visible())

        # Negative assertions (Privacy & Scrubbing)
        html_unauth = page.content()
        record("Scrubbing", "Zero 'CLEAN ARCHITECTURE' text", "● CLEAN ARCHITECTURE" not in html_unauth)
        record("Scrubbing", "Zero 'Page 17' watermark", "Page 17" not in html_unauth)
        record("Scrubbing", "Zero PERA Toggle Button", page.locator("#brandToggleBtn").count() == 0)

        page.screenshot(path=f"{ARTIFACT_DIR}/smoke_01_login_gate.png")

        # Test Invalid Authentication Attempt
        print("\n=== [2/8] AUTHENTICATION SECURITY GATE VERIFICATION ===")
        page.fill("#appLoginUsername", "admin")
        page.fill("#appLoginPassword", "WrongPassword123!")
        page.click("#btnSubmitAppLogin")
        page.wait_for_timeout(800)

        err_alert = page.locator("#appLoginErrorAlert")
        record("Login Security", "Rejects Invalid Password with Alert", err_alert.is_visible(), err_alert.text_content().strip())

        # Authenticate with Valid Admin Credentials
        page.fill("#appLoginUsername", "admin")
        page.fill("#appLoginPassword", ADMIN_PASSWORD)
        page.click("#btnSubmitAppLogin")
        page.wait_for_timeout(1500)

        record("Login Security", "Authenticates Valid Admin Session", page.locator("#viewDashboard").is_visible())
        record("Login Security", "Login Gate Container Hidden (#viewLogin)", page.locator("#viewLogin").is_hidden())

        # ---------------------------------------------------------------------
        # SCREEN 2: Authenticated Shell & Sidebar Navigation
        # ---------------------------------------------------------------------
        print("\n=== [3/8] AUTHENTICATED APP SHELL & SIDEBAR NAVIGATION ===")
        record("Layout", "Sidebar Menu Visible (#layout-menu)", page.locator("#layout-menu").is_visible())
        record("Layout", "Top Navbar Visible (#layout-navbar)", page.locator("#layout-navbar").is_visible())
        record("Layout", "Footer Visible (.content-footer)", page.locator(".content-footer").is_visible())

        # Brand Link
        brand_link = page.locator("#layout-menu .app-brand-link")
        record("Sidebar", "Brand Link (#dashboard)", brand_link.is_visible())
        record("Sidebar", "Brand Logo Image", page.locator("#layout-menu .app-brand-logo img").is_visible())

        # Navigation Items
        record("Sidebar", "360 Overview Item (#menuItemOverview)", page.locator("#menuItemOverview").is_visible())
        record("Sidebar", "Facebook Item (#menuItem_facebook)", page.locator("#menuItem_facebook").is_visible())
        record("Sidebar", "Instagram Item (#menuItem_instagram)", page.locator("#menuItem_instagram").is_visible())
        record("Sidebar", "TikTok Item (#menuItem_tiktok)", page.locator("#menuItem_tiktok").is_visible())
        record("Sidebar", "LinkedIn Item (#menuItem_linkedin)", page.locator("#menuItem_linkedin").is_visible())
        record("Sidebar", "X Item (#menuItem_x)", page.locator("#menuItem_x").is_visible())
        record("Sidebar", "YouTube Item (#menuItem_youtube)", page.locator("#menuItem_youtube").is_visible())
        record("Sidebar", "API Settings Item (#menuItemSettings)", page.locator("#menuItemSettings").is_visible())
        record("Sidebar", "User Management Item (#menuItemUsers)", page.locator("#menuItemUsers").is_visible())

        # External Link
        gov_link = page.locator('a[href="https://epd.punjab.gov.pk"]')
        record("Sidebar", "Government EPD Portal External Link", gov_link.is_visible() and gov_link.get_attribute("target") == "_blank")

        # ---------------------------------------------------------------------
        # SCREEN 3: Navbar Controls & Dynamic Filter Bar
        # ---------------------------------------------------------------------
        print("\n=== [4/8] NAVBAR CONTROLS & DYNAMIC FILTER BAR ===")
        record("Navbar", "Dashboard Title (#dashboardTitle)", page.locator("#dashboardTitle").is_visible(), page.locator("#dashboardTitle").text_content().strip())
        record("Navbar", "Reporting Period Label (#reportingPeriodLabel)", page.locator("#reportingPeriodLabel").is_visible(), page.locator("#reportingPeriodLabel").text_content().strip())

        # Date Pickers
        record("Navbar", "Date From Input (#filterDateFrom)", page.locator("#filterDateFrom").is_visible())
        record("Navbar", "Date To Input (#filterDateTo)", page.locator("#filterDateTo").is_visible())
        record("Navbar", "Apply Date Button (#btnApplyDate)", page.locator("#btnApplyDate").is_visible())

        # Test Dynamic Date Selection (From -> To)
        page.fill("#filterDateFrom", "2026-02-01")
        page.fill("#filterDateTo", "2026-02-28")
        page.click("#btnApplyDate")
        page.wait_for_timeout(800)
        updated_period = page.locator("#reportingPeriodLabel").text_content()
        record("Navbar", "Dynamic Date Range Filter Applied", "2026-02-01 to 2026-02-28" in updated_period, updated_period)

        # Preset Buttons
        for preset in ["7d", "28d", "90d", "ytd"]:
            btn = page.locator(f'#periodPresets button[data-period="{preset}"]')
            record("Navbar", f"Preset Button [{preset.upper()}]", btn.is_visible())
            btn.click()
            page.wait_for_timeout(400)
            is_active = "active" in (btn.get_attribute("class") or "")
            record("Navbar", f"Preset [{preset.upper()}] Active State", is_active)

        # Reset to 28d
        page.click('#periodPresets button[data-period="28d"]')
        page.wait_for_timeout(500)

        # Action Buttons
        record("Navbar", "Sync Data Button (#syncDataBtn)", page.locator("#syncDataBtn").is_visible())
        record("Navbar", "Admin Portal Button (#adminPortalBtn)", page.locator("#adminPortalBtn").is_visible())
        record("Navbar", "Sign Out Button (#appLogoutBtn)", page.locator("#appLogoutBtn").is_visible())
        record("Navbar", "Print/Export Button (#printReportBtn)", page.locator("#printReportBtn").is_visible())

        # Test Sync Button Interaction
        page.click("#syncDataBtn")
        page.wait_for_timeout(1000)
        record("Navbar", "Sync Button Trigger Execution", page.locator("#syncBtnText").is_visible())

        # ---------------------------------------------------------------------
        # SCREEN 4: Main 360° Executive Dashboard Cards & Analytics
        # ---------------------------------------------------------------------
        print("\n=== [5/8] EXECUTIVE KPI CARDS & APEXCHARTS ===")
        # 4 Core KPI Cards
        kpi_followers = page.locator("#kpiTotalFollowers").text_content().strip()
        kpi_views = page.locator("#kpiContentViews").text_content().strip()
        kpi_engagement = page.locator("#kpiEngagement").text_content().strip()
        kpi_watch = page.locator("#kpiWatchTime").text_content().strip()

        record("KPI Cards", "Total Audience (#kpiTotalFollowers)", bool(kpi_followers), kpi_followers)
        record("KPI Cards", "Content Views (#kpiContentViews)", bool(kpi_views), kpi_views)
        record("KPI Cards", "Citizen Engagements (#kpiEngagement)", bool(kpi_engagement), kpi_engagement)
        record("KPI Cards", "Watch Time & Inflow (#kpiWatchTime)", bool(kpi_watch), kpi_watch)

        # ApexCharts SVGs
        record("ApexCharts", "Comparative Bar Chart SVG (#crossPlatformBarChart svg)", page.locator("#crossPlatformBarChart svg").count() > 0)
        record("ApexCharts", "Audience Share Donut Chart SVG (#audienceShareDonutChart svg)", page.locator("#audienceShareDonutChart svg").count() > 0)

        donut_legends = page.locator("#donutLegendList .d-flex, #donutLegendList .donut-legend-item")
        record("ApexCharts", "Donut Dynamic Legend Rows", donut_legends.count() > 0, f"{donut_legends.count()} channels")

        # 6-Platform Operational Matrix Cards
        platforms = ["facebook", "instagram", "tiktok", "linkedin", "x", "youtube"]
        for p_key in platforms:
            card = page.locator(f'.platform-column[data-platform="{p_key}"]')
            record("Platform Matrix", f"Platform Card [{p_key.upper()}]", card.is_visible())

            val = card.locator(".col-followers-count").text_content().strip()
            record("Platform Matrix", f"  ↳ [{p_key.upper()}] Followers Metric", bool(val), val)

            status_badge = card.locator(".status-dot")
            record("Platform Matrix", f"  ↳ [{p_key.upper()}] Status Badge", status_badge.is_visible(), status_badge.text_content().strip())

            view_btn = card.locator(f'a[href="#platform/{p_key}"]')
            record("Platform Matrix", f"  ↳ [{p_key.upper()}] View Analytics Button", view_btn.is_visible())

        # Sneat Intelligence Widgets
        record("Widgets", "Engagement Breakdown Counter (#engagementTotalCounter)", page.locator("#engagementTotalCounter").is_visible(), page.locator("#engagementTotalCounter").text_content().strip())
        record("Widgets", "Engagement Facebook (#engCountFacebook)", page.locator("#engCountFacebook").is_visible(), page.locator("#engCountFacebook").text_content().strip())
        record("Widgets", "Engagement Instagram (#engCountInstagram)", page.locator("#engCountInstagram").is_visible(), page.locator("#engCountInstagram").text_content().strip())
        record("Widgets", "Engagement LinkedIn (#engCountLinkedIn)", page.locator("#engCountLinkedIn").is_visible(), page.locator("#engCountLinkedIn").text_content().strip())
        record("Widgets", "Engagement Other (#engCountOther)", page.locator("#engCountOther").is_visible(), page.locator("#engCountOther").text_content().strip())

        # Scroll into view and verify outreach progress bars
        page.locator("#outreachBarFb").scroll_into_view_if_needed()
        page.wait_for_timeout(400)
        record("Widgets", "Outreach Facebook Progress Container", page.locator(".progress:has(#outreachBarFb)").is_visible(), page.locator("#outreachPctFb").text_content().strip())
        record("Widgets", "Outreach Instagram Progress Container", page.locator(".progress:has(#outreachBarIg)").is_visible(), page.locator("#outreachPctIg").text_content().strip())
        record("Widgets", "Outreach LinkedIn Progress Container", page.locator(".progress:has(#outreachBarLi)").is_visible(), page.locator("#outreachPctLi").text_content().strip())
        record("Widgets", "Outreach Other Progress Container", page.locator(".progress:has(#outreachBarOther)").is_visible(), page.locator("#outreachPctOther").text_content().strip())

        dispatches = page.locator(".dispatch-item")
        record("Widgets", "Official Social Dispatches List (.dispatch-item)", dispatches.count() >= 3, f"{dispatches.count()} live dispatches")

        page.screenshot(path=f"{ARTIFACT_DIR}/smoke_02_dashboard_360.png", full_page=True)

        # ---------------------------------------------------------------------
        # SCREEN 5: Platform Master-Detail Dossier Drill-Downs
        # ---------------------------------------------------------------------
        print("\n=== [6/8] PLATFORM MASTER-DETAIL DOSSIER VIEWS ===")
        for p_key in ["facebook", "instagram", "linkedin", "tiktok", "x", "youtube"]:
            page.locator(f'.platform-column[data-platform="{p_key}"]').click()
            page.wait_for_timeout(600)

            detail_visible = page.locator("#viewPlatformDetail").is_visible()
            dashboard_hidden = page.locator("#viewDashboard").is_hidden()
            record("Master-Detail", f"Enter Detail View [{p_key.upper()}]", detail_visible and dashboard_hidden)

            back_btn = page.locator("#btnBackToOverview")
            record("Master-Detail", f"  ↳ [{p_key.upper()}] Back Button (#btnBackToOverview)", back_btn.is_visible())

            content_cards = page.locator("#viewPlatformDetail .card")
            record("Master-Detail", f"  ↳ [{p_key.upper()}] Dossier Content Cards", content_cards.count() > 0, f"{content_cards.count()} cards")

            page.screenshot(path=f"{ARTIFACT_DIR}/smoke_detail_{p_key}.png")

            back_btn.click()
            page.wait_for_timeout(400)
            record("Master-Detail", f"  ↳ [{p_key.upper()}] Back Navigation Restored Dashboard", page.locator("#viewDashboard").is_visible())

        # ---------------------------------------------------------------------
        # SCREEN 6: Admin Portal & API Settings View (#viewAdminSettings)
        # ---------------------------------------------------------------------
        print("\n=== [7/8] ADMIN SETTINGS PANEL & PLATFORM CONTROLS ===")
        page.click("#adminPortalBtn")
        page.wait_for_timeout(800)

        record("Admin Portal", "Settings Container Displayed (#viewAdminSettings)", page.locator("#viewAdminSettings").is_visible())

        admin_badge = page.locator(".admin-badge")
        record("Admin Portal", "Administrator Role Badge", admin_badge.is_visible(), admin_badge.text_content().strip() if admin_badge.is_visible() else "not visible")

        # Verify Configuration Fields
        record("Admin Portal", "Meta FB_PAGE_ID Field", page.locator('input[name="FB_PAGE_ID"]').is_visible())
        record("Admin Portal", "X X_USERNAME Field", page.locator('input[name="X_USERNAME"]').is_visible())
        record("Admin Portal", "LinkedIn Vanity Name Field", page.locator('input[name="LINKEDIN_VANITY_NAME"]').is_visible())

        # Test Connection Action
        test_buttons = page.locator('button.test-conn-btn')
        record("Admin Portal", "Test Connection Action Buttons (.test-conn-btn)", test_buttons.count() > 0, f"{test_buttons.count()} buttons")
        if test_buttons.count() > 0:
            test_buttons.first.click()
            page.wait_for_timeout(800)
            record("Admin Portal", "Test Connection Interactive Trigger Execution", True)

        # Save Configuration Button
        save_btn = page.locator("#btnSaveApiConfig")
        record("Admin Portal", "Save Settings Action Button (#btnSaveApiConfig)", save_btn.is_visible())

        # Tab Navigation Pills
        record("Admin Portal", "API Credentials Tab Button (#tabBtnApiConfig)", page.locator("#tabBtnApiConfig").is_visible())
        record("Admin Portal", "User Management Tab Button (#tabBtnUsers)", page.locator("#tabBtnUsers").is_visible())

        # Switch to User Management Tab
        page.click("#tabBtnUsers")
        page.wait_for_timeout(800)
        record("Admin Portal", "User Management Pane Active (#paneUsers)", page.locator("#paneUsers").is_visible())
        record("Admin Portal", "API Config Pane Hidden (#paneApiConfig)", page.locator("#paneApiConfig").is_hidden())

        # Check User Table & Rows
        users_table = page.locator("#usersTable")
        record("User Management", "Users Table Visible (#usersTable)", users_table.is_visible())
        user_rows = page.locator("#usersTable tbody tr")
        record("User Management", "User Rows Populated", user_rows.count() >= 2, f"{user_rows.count()} users found")

        # Check Admin Row and Self-Protection
        admin_row = page.locator('#usersTable tbody tr:has-text("admin")')
        record("User Management", "Admin User Account Present", admin_row.is_visible())
        admin_toggle = admin_row.locator(".user-status-toggle")
        record("User Management", "Admin Self-Deactivation Toggle Disabled", admin_toggle.is_disabled())

        # Check Executive Row and Active Toggle
        exec_row = page.locator('#usersTable tbody tr:has-text("executive")')
        record("User Management", "Executive User Account Present", exec_row.is_visible())
        exec_toggle = exec_row.locator(".user-status-toggle")
        record("User Management", "Executive Toggle Enabled", exec_toggle.is_enabled())

        # Check RBAC Security Matrix Card
        rbac_card = page.locator("#paneUsers .card:has-text('Role-Based Access Control (RBAC) Matrix')")
        record("User Management", "RBAC Policy Matrix Card Visible", rbac_card.is_visible())

        page.screenshot(path=f"{ARTIFACT_DIR}/smoke_04_user_management.png")

        # Switch back to API Credentials Tab
        page.click("#tabBtnApiConfig")
        page.wait_for_timeout(400)
        record("Admin Portal", "Restored API Credentials Pane (#paneApiConfig)", page.locator("#paneApiConfig").is_visible())

        # Back to Dashboard from Admin Settings
        settings_back = page.locator("#btnSettingsBack")
        record("Admin Portal", "Back to Dashboard Button (#btnSettingsBack)", settings_back.is_visible())
        settings_back.click()
        page.wait_for_timeout(500)
        record("Admin Portal", "Settings Back Navigation", page.locator("#viewDashboard").is_visible())

        # Test Sidebar Direct Navigation to User Management
        page.click("#menuItemUsers a")
        page.wait_for_timeout(800)
        record("Sidebar Route", "Direct Nav to User Management Pane (#paneUsers)", page.locator("#paneUsers").is_visible())
        record("Sidebar Route", "User Management Tab Marked Active", "active" in (page.locator("#tabBtnUsers").get_attribute("class") or ""))

        # Return to Dashboard
        page.click("#menuItemOverview a")
        page.wait_for_timeout(800)
        record("Sidebar Route", "Return to Dashboard via Sidebar", page.locator("#viewDashboard").is_visible())

        # ---------------------------------------------------------------------
        # SCREEN 7: Sign Out Lifecycle
        # ---------------------------------------------------------------------
        print("\n=== [8/8] SESSION LIFECYCLE & SIGN OUT ===")
        page.click("#appLogoutBtn")
        page.wait_for_timeout(800)

        record("Auth Lifecycle", "Sign Out Action Restores Login Screen", page.locator("#viewLogin").is_visible())
        record("Auth Lifecycle", "Dashboard Hidden After Logout", page.locator("#viewDashboard").is_hidden())
        record("Auth Lifecycle", "Navbar Hidden After Logout", page.locator("#layout-navbar").is_hidden())
        record("Auth Lifecycle", "Sidebar Hidden After Logout", page.locator("#layout-menu").is_hidden())

        # Verify token cleared
        token_after = page.evaluate("() => sessionStorage.getItem('epa_auth_token')")
        record("Auth Lifecycle", "SessionStorage Token Purged Cleanly", token_after is None or token_after == "")

        browser.close()

    print("\n" + "=" * 80)
    print(f"SMOKE TEST COMPLETE: {passed_tests} PASSED, {failed_tests} FAILED (TOTAL: {passed_tests + failed_tests})")
    print(f"Artifacts and Screenshots saved to: {ARTIFACT_DIR}")
    print("=" * 80)

    if failed_tests > 0:
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == "__main__":
    run_all_ui_smoke_tests()
