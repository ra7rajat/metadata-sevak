import { test, expect } from '@playwright/test';

test.describe('Chat Interface', () => {
  test('should load the chat page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h2:has-text("Welcome to MataData")')).toBeVisible();
  });

  test('should send a message and receive response', async ({ page }) => {
    await page.goto('/');
    
    const input = page.locator('#chat-input');
    await input.fill('How do I register to vote?');
    await input.press('Enter');
    
    // Wait for response
    await expect(page.locator('[role="listitem"]:has-text("MataData")')).toBeVisible({ timeout: 10000 });
  });

  test('should switch language to Hindi', async ({ page }) => {
    await page.goto('/');
    
    // Click Hindi button
    await page.click('button:has-text("हिं")');
    
    // Verify UI updates to Hindi
    await expect(page.locator('text=चैट')).toBeVisible();
  });

  test('should use suggestion buttons', async ({ page }) => {
    await page.goto('/');
    
    // Click a suggestion button
    await page.click('button:has-text("How do I register to vote?")');
    
    // Verify input is populated
    await expect(page.locator('#chat-input')).toHaveValue('How do I register to vote?');
  });

  test('should open quick action links', async ({ page }) => {
    await page.goto('/');
    
    // Send a message that triggers a quick action
    const input = page.locator('#chat-input');
    await input.fill('Find my polling booth');
    await input.press('Enter');
    
    // Wait for response with quick action
    await page.waitForSelector('text=Open Booth Finder', { timeout: 10000 });
    
    // Click the link
    await page.click('text=Open Booth Finder');
    
    // Verify navigation
    await expect(page).toHaveURL('/booth');
  });
});

test.describe('Booth Finder', () => {
  test('should load booth finder page', async ({ page }) => {
    await page.goto('/booth');
    await expect(page.locator('text=Find Your Polling Booth')).toBeVisible();
  });

  test('should show validation for empty EPIC', async ({ page }) => {
    await page.goto('/booth');
    
    await page.click('button:has-text("Find Booth")');
    
    await expect(page.locator('text=EPIC number is required')).toBeVisible();
  });

  test('should validate EPIC format', async ({ page }) => {
    await page.goto('/booth');
    
    await page.fill('#epic-input', 'INVALID');
    await page.click('button:has-text("Find Booth")');
    
    await expect(page.locator('text=Invalid EPIC format')).toBeVisible();
  });
});

test.describe('Voter Check', () => {
  test('should load voter check page', async ({ page }) => {
    await page.goto('/voter-check');
    await expect(page.locator('text=Check Voter Registration')).toBeVisible();
  });

  test('should show form validation', async ({ page }) => {
    await page.goto('/voter-check');
    
    await page.click('button:has-text("Search")');
    
    await expect(page.locator('text=Name is required')).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('should navigate between all sections', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to Voter Check
    await page.click('a[href="/voter-check"]');
    await expect(page).toHaveURL('/voter-check');
    
    // Navigate to News
    await page.click('a[href="/news"]');
    await expect(page).toHaveURL('/news');
    
    // Navigate to Booth
    await page.click('a[href="/booth"]');
    await expect(page).toHaveURL('/booth');
    
    // Navigate to Guide
    await page.click('a[href="/guide"]');
    await expect(page).toHaveURL('/guide');
  });
});

test.describe('Accessibility', () => {
  test('should have skip link for keyboard users', async ({ page }) => {
    await page.goto('/');
    
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeVisible();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    
    // Check chat region has aria-label
    const chatRegion = page.locator('[role="log"]');
    await expect(chatRegion).toHaveAttribute('aria-label');
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    
    // Tab through navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to navigate without mouse
    const focusedElement = await page.locator(':focus').getAttribute('href');
    expect(focusedElement).toBeTruthy();
  });
});

test.describe('News Page', () => {
  test('should load news page with articles', async ({ page }) => {
    await page.goto('/news');
    await expect(page.locator('text=Election News')).toBeVisible();
  });

  test('should show more sources expanded by default', async ({ page }) => {
    await page.goto('/news');
    // Wait for content to load
    await page.waitForTimeout(2000);
    // More sources should be visible (expanded by default)
    const moreSources = page.locator('text=More sources');
    await expect(moreSources).toBeVisible();
  });

  test('should have language toggle buttons', async ({ page }) => {
    await page.goto('/news');
    await expect(page.locator('button:has-text("EN")')).toBeVisible();
    await expect(page.locator('button:has-text("हिं")')).toBeVisible();
  });
});

test.describe('Bookmarks', () => {
  test('should load bookmarks page', async ({ page }) => {
    await page.goto('/bookmarks');
    await expect(page.locator('text=Bookmarks')).toBeVisible();
  });

  test('should show empty state when no bookmarks', async ({ page }) => {
    await page.goto('/bookmarks');
    await expect(page.locator('text=No bookmarks yet')).toBeVisible();
  });
});

test.describe('Guide Page', () => {
  test('should load guide page', async ({ page }) => {
    await page.goto('/guide');
    await expect(page.locator('text=Voting Guide')).toBeVisible();
  });

  test('should display voting steps', async ({ page }) => {
    await page.goto('/guide');
    await expect(page.locator('text=How to Vote')).toBeVisible();
  });
});