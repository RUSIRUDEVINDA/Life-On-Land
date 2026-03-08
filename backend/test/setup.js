import mongoose from "mongoose";

/**
 * Mocha Test Setup and Teardown Hooks
 * This file manages the test lifecycle to ensure a clean environment for each test.
 * 
 * NOTE: This file uses CommonJS syntax (require) for compatibility with Mocha's --require flag.
 * Even though the project uses ES modules, Mocha's --require works with CommonJS files.
 * The file is named .js but contains CommonJS code, which Mocha handles correctly.
 */

/**
 * Global setup - runs once before all tests
 * Use this for one-time initialization like loading environment variables
 */
before(function () {
    console.log(' [SETUP] Global setup: Initializing test environment...');

    // Load environment variables if needed
    // const dotenv = require('dotenv');
    // dotenv.config({ path: '.env.test' });

    console.log(' [SETUP] Global setup completed');
});

/**
 * Setup before each test - runs before every test case
 * Use this to reset the test environment, clear databases, etc.
 */
beforeEach(function () {
    console.log(' [SETUP] Before each test: Preparing test environment...');

    // Example: Clear test data, reset mocks, etc.
    // This is where you would:
    // - Clear database collections
    // - Reset test fixtures
    // - Initialize test data
    // - Reset mocks/stubs

    console.log(' [SETUP] Test environment prepared');
});

/**
 * Cleanup after each test - runs after every test case
 * Use this to clean up test data, reset state, etc.
 */
afterEach(function () {
    console.log(' [SETUP] After each test: Cleaning up test environment...');

    // Example: Clean up test data
    // This is where you would:
    // - Remove test records
    // - Clear caches
    // - Reset global state
    // - Clean up temporary files

    console.log(' [SETUP] Test environment cleaned up');
});

/**
 * Global teardown - runs once after all tests
 * Use this for final cleanup like closing database connections
 */
after(async function () {
    console.log(' [SETUP] Global teardown: Closing connections and cleaning up...');

    // Close MongoDB connection
    try {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            console.log(' [SETUP] MongoDB connection closed');
        }
    } catch (error) {
        console.error(' [SETUP] Error closing MongoDB connection:', error.message);
    }

    // Add any other cleanup tasks here:
    // - Close other database connections
    // - Clean up temporary files
    // - Close server connections
    // - Clear global state

    console.log(' [SETUP] Global teardown completed');
});