import { Page, expect } from '@playwright/test';

// Test user credentials - using static credentials to avoid "User not found" errors
export const TEST_USER = {
  email: 'test_user_fixed@example.com',
  password: 'Password123!',
  name: 'Test User Fixed'
};

/**
 * Helper function to sign up a new user
 */
export async function signUp(page: Page, user = TEST_USER) {
  // Navigate to login page
  await page.goto('/login');
  
  // Switch to signup tab
  await page.getByRole('tab', { name: 'Sign Up' }).click();
  
  // Fill out signup form
  await page.getByLabel('Name').fill(user.name);
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  
  // Submit form
  await page.getByRole('button', { name: 'Sign Up' }).click();
  
  // Wait for success message or redirection
  await page.waitForURL('/', { timeout: 10000 });
}

/**
 * Helper function to log in a user
 */
export async function login(page: Page, credentials = TEST_USER) {
  // Navigate to login page
  await page.goto('/login');
  
  // Fill out login form
  await page.getByLabel('Email').fill(credentials.email);
  await page.getByLabel('Password').fill(credentials.password);
  
  // Submit form
  await page.getByRole('button', { name: 'Log In' }).click();
  
  // Wait for successful login (redirect to home page)
  await page.waitForURL('/', { timeout: 10000 });
}

/**
 * Helper function to create a new post
 */
export async function createPost(page: Page, caption: string, imageFilePath: string) {
  // Open create post modal (assuming there's a "Create Post" button)
  await page.getByRole('button', { name: /Create Post/i }).click();
  
  // Upload image
  await page.setInputFiles('input[type="file"]', imageFilePath);
  
  // Wait for image upload to complete
  await page.waitForSelector('text=Image uploaded successfully');
  
  // Add caption
  await page.getByRole('textbox').fill(caption);
  
  // Submit post
  await page.getByRole('button', { name: 'Post' }).click();
  
  // Wait for success message
  await page.waitForSelector('text=Post created successfully');
}

/**
 * Helper function to log out
 */
export async function logout(page: Page) {
  // Click on user menu or profile button
  await page.getByRole('button', { name: /profile/i }).click();
  
  // Click logout option
  await page.getByRole('menuitem', { name: /log out/i }).click();
  
  // Wait for redirection to login page
  await expect(page).toHaveURL('/login');
} 