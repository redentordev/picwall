# Playwright Tests for Picwall Application

This directory contains end-to-end tests for the Picwall application using Playwright.

## Test Structure

- `utils.ts` - Utility functions for common test operations
- `auth.spec.ts` - Tests for authentication flows (login, signup, logout)
- `posts.spec.ts` - Tests for post-related functionality (creating, viewing, liking)
- `navigation.spec.ts` - Tests for navigation and UI elements
- `e2e.spec.ts` - End-to-end user journey tests

## Setup Requirements

Before running the tests, make sure you have:

1. Installed dependencies: `npm install`
2. Set up Playwright: `npx playwright install`

## Running Tests

You can run the tests using the following npm scripts:

```bash
# Run all tests
npm test

# Run tests with UI mode
npm run test:ui

# Run tests with debug mode
npm run test:debug

# Run specific test files
npm run test:e2e
npm run test:auth
npm run test:posts
npm run test:nav
```

## Test User

The tests use a test user account with the following credentials:

- Email: `test_user@example.com`
- Password: `Password123!`
- Name: `Test User`

Make sure this user exists in your development database, or the tests will create one when necessary.

## Test Fixtures

- `fixtures/test-image.jpg` - Sample image used for testing post creation

## Customizing Tests

You can modify the test user credentials in `utils.ts` if needed.

## Troubleshooting

If tests are failing, check:

1. That the application is running on port 3000
2. That you have installed all Playwright browsers
3. That selectors in the tests match your actual UI components
