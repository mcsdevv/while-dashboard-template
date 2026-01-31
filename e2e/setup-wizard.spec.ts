import { expect, test } from "@playwright/test";

test.describe("Setup Wizard", () => {
  test.beforeEach(async ({ page }) => {
    // Mock the setup status API to start fresh
    await page.route("**/api/setup/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          setupComplete: false,
          google: {
            configured: false,
            connected: false,
            calendarSelected: false,
          },
          notion: {
            configured: false,
            databaseSelected: false,
            databaseName: null,
          },
          fieldMapping: {
            configured: false,
          },
        }),
      });
    });
  });

  test("redirects /setup to /setup/1", async ({ page }) => {
    await page.goto("/setup");
    await expect(page).toHaveURL(/\/setup\/1/);
  });

  test("displays welcome step on initial load", async ({ page }) => {
    await page.goto("/setup/1");

    // Check welcome step is visible
    await expect(page.getByRole("heading", { name: "Welcome" })).toBeVisible();
    await expect(page.getByText("Get started")).toBeVisible();

    // Check progress indicator shows step 1 as active
    const progressButtons = page.locator("nav ol li button");
    await expect(progressButtons.first()).toHaveClass(/bg-primary/);
  });

  test("navigates through wizard steps with URL changes", async ({ page }) => {
    await page.goto("/setup/1");

    // Step 1: Welcome - click Get Started
    await expect(page.getByRole("heading", { name: "Welcome" })).toBeVisible();
    await page.getByRole("button", { name: "Get Started" }).click();

    // Step 2: Google - URL should change
    await expect(page).toHaveURL(/\/setup\/2/);
    await expect(page.getByRole("heading", { name: "Google" })).toBeVisible();

    // Go back to Welcome
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page).toHaveURL(/\/setup\/1/);
    await expect(page.getByRole("heading", { name: "Welcome" })).toBeVisible();
  });

  test("browser back button works with URL-based navigation", async ({ page }) => {
    await page.goto("/setup/1");
    await page.getByRole("button", { name: "Get Started" }).click();
    await expect(page).toHaveURL(/\/setup\/2/);

    // Use browser back
    await page.goBack();
    await expect(page).toHaveURL(/\/setup\/1/);
    await expect(page.getByRole("heading", { name: "Welcome" })).toBeVisible();
  });

  test("direct navigation to step via URL", async ({ page }) => {
    // Direct navigation to step 2 should redirect to step 1 (can't skip steps)
    await page.goto("/setup/2");
    // Server-side validation redirects to max allowed step (1 for fresh start)
    await expect(page).toHaveURL(/\/setup\/1/);
  });

  test("shows progress indicator correctly", async ({ page }) => {
    await page.goto("/setup");

    // Check all 6 steps are visible
    const stepNames = ["Welcome", "Google", "Notion", "Mapping", "Sync", "Test"];
    for (const name of stepNames) {
      await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
    }

    // Check step numbers are displayed
    for (let i = 1; i <= 6; i++) {
      await expect(page.locator(`nav button:has-text("${i}")`)).toBeVisible();
    }
  });

  test("disables future steps until current step is completed", async ({ page }) => {
    await page.goto("/setup");

    // Steps 3, 4, 5, 6 should be disabled (can't skip ahead more than 1 step)
    const step3Button = page.locator("nav ol li").nth(2).locator("button");
    const step4Button = page.locator("nav ol li").nth(3).locator("button");
    const step5Button = page.locator("nav ol li").nth(4).locator("button");
    const step6Button = page.locator("nav ol li").nth(5).locator("button");

    await expect(step3Button).toBeDisabled();
    await expect(step4Button).toBeDisabled();
    await expect(step5Button).toBeDisabled();
    await expect(step6Button).toBeDisabled();
  });

  test("shows loading skeleton while fetching status", async ({ page }) => {
    // Delay the API response
    await page.route("**/api/setup/status", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          setupComplete: false,
          google: { configured: false, connected: false, calendarSelected: false },
          notion: { configured: false, databaseSelected: false, databaseName: null },
          fieldMapping: { configured: false },
        }),
      });
    });

    await page.goto("/setup");

    // Should show skeleton while loading
    await expect(page.locator(".animate-pulse").first()).toBeVisible();
  });
});

test.describe("Setup Wizard - Google Step", () => {
  test.beforeEach(async ({ page }) => {
    // Mock status API to show Google step (not yet connected)
    await page.route("**/api/setup/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          setupComplete: false,
          google: { configured: true, connected: false, calendarSelected: false },
          notion: { configured: false, databaseSelected: false, databaseName: null },
          fieldMapping: { configured: false },
        }),
      });
    });
  });

  test("shows Sign in with Google button on step 2", async ({ page }) => {
    await page.goto("/setup");

    // Navigate to Google step
    await page.getByRole("button", { name: "Get Started" }).click();

    // Check Google step is visible with sign-in button (no credential fields)
    await expect(page.getByRole("heading", { name: "Google" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign in with Google/i })).toBeVisible();
  });

  test("shows calendar selection after Google sign-in", async ({ page }) => {
    // Mock status API to show Google connected
    await page.route("**/api/setup/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          setupComplete: false,
          google: { configured: true, connected: true, calendarSelected: false },
          notion: { configured: false, databaseSelected: false, databaseName: null },
          fieldMapping: { configured: false },
        }),
      });
    });

    // Mock calendar list API
    await page.route("**/api/setup/google/calendars", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            calendars: [
              { id: "primary", name: "Personal", primary: true },
              { id: "work@group.calendar.google.com", name: "Work", primary: false },
            ],
            selectedCalendarId: null,
          }),
        });
      }
    });

    await page.goto("/setup");
    await page.getByRole("button", { name: "Get Started" }).click();

    // Check calendar selection is visible
    await expect(page.getByRole("heading", { name: "Google" })).toBeVisible();
    await expect(page.getByText(/Google Calendar connected/i)).toBeVisible();
    await expect(page.getByText(/Select Calendar to Sync/i)).toBeVisible();
  });
});

test.describe("Setup Wizard - Notion Step", () => {
  test.beforeEach(async ({ page }) => {
    // Mock status API to show Notion step
    await page.route("**/api/setup/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          setupComplete: false,
          google: { configured: true, connected: true, calendarSelected: true },
          notion: { configured: false, databaseSelected: false, databaseName: null },
          fieldMapping: { configured: false },
        }),
      });
    });
  });

  test("shows Notion token input on step 3", async ({ page }) => {
    await page.goto("/setup");

    // Should auto-advance to Notion step
    await expect(page.getByRole("heading", { name: "Notion" })).toBeVisible();
    await expect(page.getByLabel(/API Token/i)).toBeVisible();
  });

  test("shows error for invalid API token", async ({ page }) => {
    // Mock Notion validation to fail
    await page.route("**/api/setup/notion", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ error: "Invalid API token" }),
      });
    });

    await page.goto("/setup");

    // Fill in token
    await page.getByLabel(/API Token/i).fill("invalid-token");

    // Submit
    await page.getByRole("button", { name: /Validate/i }).click();

    // Check error is displayed
    await expect(page.getByText(/Invalid API token/i)).toBeVisible();
  });
});

test.describe("Setup Wizard - Field Mapping Step", () => {
  test.beforeEach(async ({ page }) => {
    // Mock status API to show Field Mapping step
    await page.route("**/api/setup/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          setupComplete: false,
          google: { configured: true, connected: true, calendarSelected: true },
          notion: { configured: true, databaseSelected: true, databaseName: "Test DB" },
          fieldMapping: { configured: false },
        }),
      });
    });

    // Mock field mapping API
    await page.route("**/api/setup/field-mapping", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            properties: ["Name", "Date", "Notes", "Location", "Event ID", "Remind"],
            currentMapping: {
              title: "Name",
              date: "Date",
              description: "",
              location: "",
              gcalEventId: "",
              reminders: "",
            },
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
      }
    });
  });

  test("shows field mapping interface on step 4", async ({ page }) => {
    await page.goto("/setup");

    // Should auto-advance to Field Mapping step
    await expect(page.getByRole("heading", { name: "Mapping" })).toBeVisible();
  });

  test("requires title and date fields", async ({ page }) => {
    await page.goto("/setup");

    // Check required labels
    await expect(page.getByText(/Title/i).first()).toBeVisible();
    await expect(page.getByText(/Date/i).first()).toBeVisible();
  });
});

test.describe("Setup Wizard - Test Step", () => {
  test.beforeEach(async ({ page }) => {
    // Mock status API to show Test step
    await page.route("**/api/setup/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          setupComplete: false,
          google: { configured: true, connected: true, calendarSelected: true },
          notion: { configured: true, databaseSelected: true, databaseName: "Test DB" },
          fieldMapping: { configured: true },
        }),
      });
    });
  });

  test("shows test connections button on step 6", async ({ page }) => {
    await page.goto("/setup/6");

    await expect(page.getByRole("heading", { name: "Test" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Test Connections/i })).toBeVisible();
  });

  test("shows success when all tests pass", async ({ page }) => {
    // Mock test API to succeed
    await page.route("**/api/setup/test", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          allPassed: true,
          results: [
            { service: "Google Calendar", success: true, message: "Connected" },
            { service: "Notion", success: true, message: "Connected" },
          ],
        }),
      });
    });

    await page.goto("/setup/6");

    // Tests run automatically on mount, wait for results
    await expect(page.getByText(/Google Calendar.*Connected/i)).toBeVisible();
    await expect(page.getByText(/Notion.*Connected/i)).toBeVisible();
  });

  test("shows failure when tests fail", async ({ page }) => {
    // Mock test API to fail
    await page.route("**/api/setup/test", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          allPassed: false,
          results: [
            { service: "Google Calendar", success: false, message: "Failed to connect" },
            { service: "Notion", success: true, message: "Connected" },
          ],
        }),
      });
    });

    await page.goto("/setup/6");

    // Tests run automatically on mount, wait for failure indicator
    await expect(page.getByText(/Failed to connect/i)).toBeVisible();
  });
});

test.describe("Setup Wizard - Welcome Step UX", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/setup/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          setupComplete: false,
          google: { configured: false, connected: false, calendarSelected: false },
          notion: { configured: false, databaseSelected: false, databaseName: null },
          fieldMapping: { configured: false },
        }),
      });
    });
  });

  test("displays 7-day token expiration warning", async ({ page }) => {
    await page.goto("/setup");

    await expect(page.getByText("Token expiration notice")).toBeVisible();
    await expect(page.getByText(/OAuth tokens expire every 7 days/)).toBeVisible();
  });

  test("warning contains link to publish docs", async ({ page }) => {
    await page.goto("/setup");

    const publishLink = page.getByRole("link", { name: /publish your OAuth app/ });
    await expect(publishLink).toBeVisible();
    await expect(publishLink).toHaveAttribute(
      "href",
      "https://while.so/docs/setup/google#step-5-publish-app-optional",
    );
  });

  test("setup helper section is collapsed by default", async ({ page }) => {
    await page.goto("/setup");

    // The helper button should be visible
    await expect(
      page.getByRole("button", { name: /Google OAuth Configuration Values/i }),
    ).toBeVisible();

    // But the redirect URI label should not be visible (collapsed)
    await expect(page.getByText("Authorized Redirect URI")).not.toBeVisible();
  });

  test("clicking setup helper expands it", async ({ page }) => {
    await page.goto("/setup");

    // Click to expand
    await page.getByRole("button", { name: /Google OAuth Configuration Values/i }).click();

    // Now the content should be visible
    await expect(page.getByText("Authorized Redirect URI")).toBeVisible();
    await expect(page.getByText("OAuth Scopes (for consent screen)")).toBeVisible();
  });

  test("redirect URI displays current origin", async ({ page }) => {
    await page.goto("/setup");

    // Expand helper
    await page.getByRole("button", { name: /Google OAuth Configuration Values/i }).click();

    // Check redirect URI contains the expected path
    await expect(page.getByText(/\/api\/auth\/callback\/google/)).toBeVisible();
  });

  test("OAuth scopes display correctly", async ({ page }) => {
    await page.goto("/setup");

    // Expand helper
    await page.getByRole("button", { name: /Google OAuth Configuration Values/i }).click();

    // Check scopes are present
    await expect(page.getByText(/openid/)).toBeVisible();
    await expect(page.getByText(/googleapis\.com\/auth\/calendar/)).toBeVisible();
  });

  test("setup helper has external links when expanded", async ({ page }) => {
    await page.goto("/setup");

    // Expand helper
    await page.getByRole("button", { name: /Google OAuth Configuration Values/i }).click();

    // Check links
    const credentialsLink = page.getByRole("link", { name: /Create an OAuth 2\.0 Client ID/i });
    await expect(credentialsLink).toBeVisible();
    await expect(credentialsLink).toHaveAttribute(
      "href",
      "https://console.cloud.google.com/auth/clients/create",
    );

    const guideLink = page.getByRole("link", { name: /Full Setup Guide/i });
    await expect(guideLink).toBeVisible();
    await expect(guideLink).toHaveAttribute("href", "https://while.so/docs/setup/google");
  });

  test("clicking setup helper again collapses it", async ({ page }) => {
    await page.goto("/setup");

    const helperButton = page.getByRole("button", { name: /Google OAuth Configuration Values/i });

    // Expand
    await helperButton.click();
    await expect(page.getByText("Authorized Redirect URI")).toBeVisible();

    // Collapse
    await helperButton.click();
    await expect(page.getByText("Authorized Redirect URI")).not.toBeVisible();
  });
});

test.describe("Setup Wizard - Mobile Responsive", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("displays correctly on mobile viewport", async ({ page }) => {
    await page.route("**/api/setup/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          setupComplete: false,
          google: { configured: false, connected: false, calendarSelected: false },
          notion: { configured: false, databaseSelected: false, databaseName: null },
          fieldMapping: { configured: false },
        }),
      });
    });

    await page.goto("/setup");

    // Check page loads without horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1); // Allow 1px tolerance

    // Check welcome step is visible
    await expect(page.getByRole("heading", { name: "Welcome" })).toBeVisible();
  });

  test("warning and helper display correctly on mobile", async ({ page }) => {
    await page.route("**/api/setup/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          setupComplete: false,
          google: { configured: false, connected: false, calendarSelected: false },
          notion: { configured: false, databaseSelected: false, databaseName: null },
          fieldMapping: { configured: false },
        }),
      });
    });

    await page.goto("/setup");

    // Token warning should be visible
    await expect(page.getByText("Token expiration notice")).toBeVisible();

    // Setup helper should be expandable
    await page.getByRole("button", { name: /Google OAuth Configuration Values/i }).click();
    await expect(page.getByText("Authorized Redirect URI")).toBeVisible();

    // Content should not overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
  });
});
