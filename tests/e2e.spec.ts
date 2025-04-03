import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('End-to-End User Flow', () => {
  test('should complete full user journey from signup to posting', async ({ page }) => {
    // 1. User navigates to the website
    await page.goto('/');
    
    // User should be redirected to login page since not authenticated
    await expect(page).toHaveURL('/login');
    
    // 2. Create a new user account with unique email
    const uniqueEmail = `test_user_${Date.now()}@example.com`;
    const password = 'Password123!';
    const name = 'Test User';
    
    // Switch to signup tab
    await page.getByRole('tab', { name: 'Sign Up' }).click();
    
    // Fill out signup form
    await page.getByLabel('Name').fill(name);
    await page.getByLabel('Email').fill(uniqueEmail);
    await page.getByLabel('Password').fill(password);
    
    // Submit form
    await page.getByRole('button', { name: 'Sign Up' }).click();
    
    // Wait for redirection to home page after successful signup
    await page.waitForURL('/', { timeout: 10000 });
    
    // 3. Verify successful login
    await expect(page).toHaveURL('/');
    
    // 4. Browse posts
    // Verify posts are displayed
    await expect(page.locator('.post-card')).toBeVisible();
    
    // 5. Create a new post
    const testCaption = `Test post created by ${uniqueEmail} at ${new Date().toISOString()}`;
    const testImagePath = path.join(process.cwd(), './tests/fixtures/test-image.jpg');
    
    // Click create post button
    await page.getByRole('button', { name: /Create Post/i }).click();
    
    // Wait for modal to open
    await expect(page.locator('dialog')).toBeVisible();
    
    // Upload image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);
    
    // Wait for image to upload
    await expect(page.getByText('Image uploaded successfully', { exact: false })).toBeVisible();
    
    // Add caption
    await page.getByRole('textbox').fill(testCaption);
    
    // Submit post
    await page.getByRole('button', { name: 'Post' }).click();
    
    // Verify post created successfully
    await expect(page.getByText('Post created successfully', { exact: false })).toBeVisible();
    
    // 6. View the newly created post in the feed
    await expect(page.getByText(testCaption)).toBeVisible();
    
    // 7. Click on the post to view details
    await page.getByText(testCaption).click();
    
    // Verify post details view
    await expect(page.locator('.post-detail')).toBeVisible();
    
    // 8. Add a comment to the post
    const testComment = `Test comment by ${name} at ${new Date().toISOString()}`;
    await page.locator('.comment-input').fill(testComment);
    await page.locator('.comment-submit').click();
    
    // Verify comment was added
    await expect(page.getByText(testComment)).toBeVisible();
    
    // 9. Like the post
    await page.locator('.like-button').click();
    
    // Verify like was registered
    await expect(page.locator('.like-button.liked')).toBeVisible();
    
    // 10. Navigate to profile page
    await page.getByRole('link', { name: /profile/i }).click();
    await expect(page).toHaveURL('/profile');
    
    // Verify profile page elements
    await expect(page.getByText(name)).toBeVisible();
    
    // 11. Verify the created post appears in user's profile
    await expect(page.getByText(testCaption)).toBeVisible();
    
    // 12. Navigate to explore page
    await page.getByRole('link', { name: /explore/i }).click();
    await expect(page).toHaveURL('/explore');
    
    // 13. Verify explore page shows content
    await expect(page.locator('.post-grid')).toBeVisible();
    
    // 14. Log out
    await page.getByRole('button', { name: /profile/i }).click();
    await page.getByRole('menuitem', { name: /log out/i }).click();
    
    // 15. Verify user is logged out and redirected to login page
    await expect(page).toHaveURL('/login');
  });
}); 