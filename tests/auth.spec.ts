import { test, expect } from '@playwright/test';
import { login } from './utils';

// Create a consistent test user for this test suite
const TEST_USER = {
  email: `test_user_${Date.now()}@example.com`,
  password: 'Password123!',
  name: 'Test User'
};

// Use serial to ensure tests run in sequence - important for our auth flow
test.describe.serial('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page before each test
    await page.goto('/login');
  });

  test('should show login page', async ({ page }) => {
    // Verify login page elements are present
    await expect(page.getByRole('tab', { name: 'Log In' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Sign Up' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible();
  });

  test('should allow user to sign up', async ({ page }) => {
    // Switch to signup tab
    await page.getByRole('tab', { name: 'Sign Up' }).click();
    
    // Fill out signup form using our test user
    await page.getByLabel('Name').fill(TEST_USER.name);
    await page.getByLabel('Email').fill(TEST_USER.email);
    await page.getByLabel('Password').fill(TEST_USER.password);
    
    // Submit form
    await page.getByRole('button', { name: 'Sign Up' }).click();
    
    // Wait for success message or redirection to home page
    await page.waitForURL('/', { timeout: 10000 });
    
    // Navigate to profile page to verify user info - using full email in the profile URL
    await page.goto(`/profile/${TEST_USER.email}`);
    
    // Verify user's name is visible on the profile page
    await expect(page.getByText(TEST_USER.name, { exact: false })).toBeVisible({ timeout: 10000 });
  });

  test('should allow user to log in', async ({ page }) => {
    // Fill out login form with the same test user we signed up with
    await page.getByLabel('Email').fill(TEST_USER.email);
    await page.getByLabel('Password').fill(TEST_USER.password);
    
    // Submit form
    await page.getByRole('button', { name: 'Log In' }).click();
    
    // Wait for successful login (redirect to home page)
    await page.waitForURL('/', { timeout: 10000 });
    
    // Verify user is logged in
    await expect(page).toHaveURL('/');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill out login form with invalid credentials
    await page.getByLabel('Email').fill('invalid@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    
    // Submit form
    await page.getByRole('button', { name: 'Log In' }).click();
    
    // Wait for the button state to change (becomes not disabled)
    await expect(page.getByRole('button', { name: 'Log In' })).not.toBeDisabled({ timeout: 5000 });
    
    // Check for toast notification which appears with login errors
    // App uses sonner toast library which adds elements to the body
    await expect(
      page.locator('[data-sonner-toast]')
    ).toBeVisible({ timeout: 5000 });
    
    // Verify we're still on the login page (not redirected)
    await expect(page).toHaveURL('/login');
  });

  test('should allow user to log out', async ({ page }) => {
    // Login first using our test user
    await page.getByLabel('Email').fill(TEST_USER.email);
    await page.getByLabel('Password').fill(TEST_USER.password);
    await page.getByRole('button', { name: 'Log In' }).click();
    await page.waitForURL('/', { timeout: 10000 });
    
    // Check that we're on the home page
    await expect(page).toHaveURL('/');
    
    // Find and click logout in the sidebar
    await page.getByRole('button', { name: 'Log out' }).click();
    
    // Wait for the confirmation dialog to appear
    await expect(page.getByRole('alertdialog')).toBeVisible();
    
    // Click the "Log out" confirmation button in the dialog
    await page.getByRole('button', { name: 'Log out', exact: true }).click();
    
    // Wait for the logout process to complete
    await page.waitForTimeout(1000);
    
    // Verify user is logged out by manually navigating to a protected route
    // This approach works even if the app doesn't automatically redirect
    await page.goto('/profile');
    
    // Verify we're redirected to login page 
    // (should happen due to middleware redirecting unauthenticated users)
    await expect(page).toHaveURL('/login', { timeout: 10000 });
    
    // Additional verification - check login page elements are visible
    await expect(page.getByRole('tab', { name: 'Log In' })).toBeVisible();
  });
}); 