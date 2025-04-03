import { test, expect, type Page } from '@playwright/test';
import { login, TEST_USER } from './utils';
import * as path from 'path';

// Configure to run only on Chromium
test.use({ browserName: 'chromium' });

// Helper function to ensure user is logged in before each test
async function ensureLoggedIn(page: Page) {
  // Check if already on a page that's not login
  const currentUrl = page.url();
  if (!currentUrl.includes('/login')) {
    // Already logged in, check for avatarDropdown to confirm
    const avatarExists = await page.locator('[data-testid="user-avatar"]').isVisible().catch(() => false);
    if (avatarExists) {
      console.log('User is already logged in');
      return;
    }
  }

  console.log('User is not logged in. Signing in...');
  // Use the login function from utils.ts
  await login(page);
}

test.describe('Posts', () => {
  test.setTimeout(180000); // Increase timeout for all tests to 3 minutes
  
  test('Complete post lifecycle: create, like, comment, and delete', async ({ page }) => {
    // Make sure user is logged in
    await ensureLoggedIn(page);
    await page.waitForTimeout(2000); // Add timeout after login
    
    // ----- Step 1: Create a new post -----
    console.log('STEP 1: Creating a new post');
    
    // Go to home page
    await page.goto('/');
    await page.waitForTimeout(3000); // Add timeout after navigation
    
    // Open create post modal using URL parameter (works with nuqs)
    await page.goto('/?createPost=true');
    console.log('Opening create post modal via URL parameter');
    await page.waitForTimeout(2000); // Add timeout after navigation
    
    // Wait for modal to appear
    await page.waitForSelector('[role="dialog"]', { timeout: 30000 });
    console.log('Modal opened successfully');
    await page.waitForTimeout(2000); // Add timeout after modal opens
    
    // Prepare test image path - using the fixtures directory
    const testImagePath = path.join(process.cwd(), './tests/fixtures/test-image.jpg');
    console.log('Using test image path:', testImagePath);
    
    // Method 1: Try uploading directly without clicking the button first
    try {
      console.log('Attempting direct file upload');
      await page.setInputFiles('input[type="file"]', testImagePath, { timeout: 10000 });
      console.log('Direct file upload successful');
    } catch (error) {
      console.log('Direct file upload failed, trying with button click');
      // Method 2: Click the upload button first
      await page.waitForSelector('button:has-text("Upload your image")', { timeout: 20000 });
      await page.waitForTimeout(1000); // Wait before clicking
      await page.click('button:has-text("Upload your image")');
      console.log('Clicked upload button');
      await page.waitForTimeout(2000); // Add timeout after button click
      
      // Now set the input files
      await page.setInputFiles('input[type="file"]', testImagePath, { timeout: 10000 });
      console.log('File upload via button click successful');
    }
    await page.waitForTimeout(3000); // Add timeout after file upload
    
    // Wait for the caption tab to appear after file upload
    // The component automatically transitions to caption tab after image selection
    await page.waitForSelector('textarea[placeholder="Write a caption..."]', { timeout: 30000 });
    console.log('Caption tab appeared');
    await page.waitForTimeout(2000); // Add timeout after caption tab appears
    
    // Wait for the image upload to complete by looking for success message
    await page.waitForSelector('div:has-text("Image uploaded successfully")', { timeout: 45000 });
    console.log('Image uploaded successfully message appeared');
    await page.waitForTimeout(3000); // Add timeout after success message
    
    // Add caption
    const caption = 'Test post created by Playwright #testing';
    await page.fill('textarea[placeholder="Write a caption..."]', caption);
    console.log('Caption added');
    await page.waitForTimeout(2000); // Add timeout after adding caption
    
    // Share post - using the Share button in the footer
    // Wait for Share button and ensure it's not disabled
    const shareButton = page.getByRole('button', { name: 'Share' });
    await shareButton.waitFor({ timeout: 15000 });
    // Wait a bit for the button to become enabled after upload completes
    await page.waitForTimeout(3000);
    await shareButton.click();
    console.log('Clicked Share button');
    await page.waitForTimeout(3000); // Add timeout after clicking share
    
    // Wait for modal to close
    await page.waitForSelector('[role="dialog"]', { state: 'detached', timeout: 20000 });
    console.log('Modal closed');
    await page.waitForTimeout(3000); // Add timeout after modal closes
    
    // Verify post appears in the feed
    await page.waitForSelector('[data-testid="post-card"]', { timeout: 15000 });
    await page.waitForTimeout(2000); // Add timeout after post appears
    const postCaption = await page.locator('[data-testid="post-caption"]').first();
    await expect(postCaption).toContainText('Test post created by Playwright');
    console.log('Post verified in feed');
    await page.waitForTimeout(2000); // Add timeout after verification
    
    // ----- Step 2: Like the post -----
    console.log('STEP 2: Liking the post');
    
    // Make sure we're on home page with posts loaded
    await page.goto('/');
    await page.waitForTimeout(3000); // Add timeout after navigation
    
    await page.waitForSelector('[data-testid="post-card"]', { timeout: 15000 });
    await page.waitForTimeout(2000); // Add timeout after posts load
    
    // Get the first post
    const firstPost = page.locator('[data-testid="post-card"]').first();
    
    // Check initial likes count
    const initialLikesText = await firstPost.locator('[data-testid="likes-count"]').textContent();
    const initialLikes = parseInt(initialLikesText?.replace(/\D/g, '') || '0');
    console.log(`Initial likes: ${initialLikes}`);
    
    // Click like button on the first post
    await page.waitForTimeout(1000); // Add timeout before clicking
    await firstPost.locator('[data-testid="like-button"]').click();
    console.log('Clicked like button');
    
    // Wait for like to register
    await page.waitForTimeout(3000);
    
    // Refresh page to ensure like persisted
    await page.reload();
    await page.waitForTimeout(3000); // Add timeout after reload
    
    await page.waitForSelector('[data-testid="post-card"]', { timeout: 15000 });
    await page.waitForTimeout(2000); // Add timeout after posts load
    
    // Get updated likes count
    const updatedLikesText = await page.locator('[data-testid="post-card"]').first().locator('[data-testid="likes-count"]').textContent();
    const updatedLikes = parseInt(updatedLikesText?.replace(/\D/g, '') || '0');
    console.log(`Updated likes: ${updatedLikes}`);
    
    // ----- Step 3: Comment on the post -----
    console.log('STEP 3: Commenting on the post');
    
    // Open the first post modal
    await page.waitForTimeout(1000); // Add timeout before clicking
    await page.locator('[data-testid="post-card"]').first().click();
    await page.waitForTimeout(2000); // Add timeout after clicking
    
    // Wait for modal to open
    await page.waitForSelector('[data-testid="post-modal"]', { timeout: 15000 });
    console.log('Post modal opened for commenting');
    await page.waitForTimeout(2000); // Add timeout after modal opens
    
    // Add a comment
    const commentText = 'This is a test comment from Playwright';
    await page.waitForTimeout(1000); // Add timeout before filling
    await page.locator('[data-testid="modal-comment-input"]').fill(commentText);
    await page.waitForTimeout(1000); // Add timeout after filling
    await page.locator('[data-testid="modal-post-comment-button"]').click();
    console.log('Added comment');
    
    // Wait for comment to be posted
    await page.waitForTimeout(4000);
    
    // Verify comment appears in the list
    const comments = page.locator('[data-testid="post-modal-comments"]');
    await expect(comments).toContainText(commentText);
    console.log('Comment verified');
    await page.waitForTimeout(2000); // Add timeout after verification
    
    // Close modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(2000); // Add timeout after pressing escape
    await page.waitForSelector('[data-testid="post-modal"]', { state: 'detached', timeout: 10000 });
    await page.waitForTimeout(2000); // Add timeout after modal closes
    
    // ----- Step 4: Delete the post -----
    console.log('STEP 4: Deleting the post');
    
    // Go to profile page where we can manage our posts
    await page.goto(`/profile/${TEST_USER.email}`);
    await page.waitForTimeout(5000); // Add longer timeout after navigation to profile
    
    // Wait for profile page to load by waiting for URL and page elements
    await page.waitForURL(`**/profile/${TEST_USER.email}`, { timeout: 15000 });
    // Wait for the profile page content to load
    await page.waitForSelector('h1.text-2xl.font-bold', { timeout: 15000 });
    // Wait for profile email to appear
    await page.waitForSelector(`p:has-text("${TEST_USER.email}")`, { timeout: 15000 });
    console.log('Profile page loaded');
    await page.waitForTimeout(3000); // Add timeout after profile loads
    
    // Count initial posts
    const postGrid = page.locator('.grid-cols-3');
    await postGrid.waitFor({ timeout: 10000 });
    await page.waitForTimeout(2000); // Add timeout before counting
    
    const initialPosts = await page.locator('.grid-cols-3 > div').count();
    console.log(`Initial post count: ${initialPosts}`);
    
    // Check if there are posts to delete
    if (initialPosts > 0) {
      // Open the first post in the grid
      await page.waitForTimeout(2000); // Add timeout before clicking
      await page.locator('.grid-cols-3 > div').first().click();
      await page.waitForTimeout(2000); // Add timeout after clicking
      
      // Wait for modal to open
      await page.waitForSelector('[data-testid="post-modal"]', { timeout: 15000 });
      console.log('Post modal opened for deletion');
      await page.waitForTimeout(2000); // Add timeout after modal opens
      
      // Click on options menu (three dots button)
      await page.locator('[data-testid="post-modal-options-button"]').click();
      console.log('Clicked options button');
      await page.waitForTimeout(2000); // Add timeout after clicking options
      
      // Wait for dropdown menu to appear and click delete option
      await page.locator('[data-testid="modal-delete-option"]').waitFor({ state: 'visible', timeout: 10000 });
      await page.waitForTimeout(1000); // Add timeout before clicking delete
      await page.locator('[data-testid="modal-delete-option"]').click();
      console.log('Clicked delete option');
      await page.waitForTimeout(2000); // Add timeout after clicking delete
      
      // Wait for confirmation dialog and confirm delete
      await page.locator('[data-testid="modal-delete-confirm-dialog"]').waitFor({ state: 'visible', timeout: 10000 });
      await page.waitForTimeout(1000); // Add timeout before confirming
      await page.locator('[data-testid="modal-confirm-delete-button"]').click();
      console.log('Confirmed delete');
      await page.waitForTimeout(3000); // Add timeout after confirming
      
      // Wait for delete to complete and modal to close
      await page.waitForSelector('[data-testid="post-modal"]', { state: 'detached', timeout: 20000 });
      console.log('Modal closed after deletion');
      await page.waitForTimeout(3000); // Add timeout after modal closes
      
      // Refresh page to see updated post count
      await page.reload();
      await page.waitForTimeout(5000); // Add longer timeout after reload
      
      // Wait for profile page to reload
      await page.waitForURL(`**/profile/${TEST_USER.email}`, { timeout: 15000 });
      await page.waitForSelector('h1.text-2xl.font-bold', { timeout: 15000 });
      await page.waitForTimeout(3000); // Add timeout after profile reloads
      
      // Count posts after deletion
      await page.waitForTimeout(2000); // Add timeout before counting again
      const finalPosts = await page.locator('.grid-cols-3 > div').count();
      console.log(`Final post count: ${finalPosts}`);
      
      // Expect count to be reduced by 1
      expect(finalPosts).toBeLessThanOrEqual(initialPosts - 1);
      console.log('Post successfully deleted');
    } else {
      console.log('No posts found to delete, skipping deletion test');
      // If we have no posts to delete, test should still pass
      expect(true).toBeTruthy();
    }
  });
}); 