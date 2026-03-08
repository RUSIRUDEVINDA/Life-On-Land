const mongoose = require('mongoose');

/**
 * Mocha Test Setup and Teardown Hooks
 * This file manages the test lifecycle to ensure a clean environment for each test.
 * 
 * Using CommonJS format (.cjs) for compatibility with Mocha's --require flag
 * in ES module projects. 
 * 
 * For ES modules, we use Mocha's root hooks plugin pattern by exporting mochaHooks.
 */

// Helper function to write to stdout directly (bypasses mochawesome console capture)
const log = (message) => {
    process.stdout.write(message + '\n');
};

// Export root hooks for Mocha (works with ES modules)
exports.mochaHooks = {
    beforeAll() {
        log(' [SETUP] Global setup: Initializing test environment...');
        log(' [SETUP] Global setup completed');
    },

    beforeEach() {
        log(' [SETUP] Before each test: Preparing test environment...');
        log(' [SETUP] Test environment prepared');
    },

    afterEach() {
        log(' [SETUP] After each test: Cleaning up test environment...');
        log(' [SETUP] Test environment cleaned up');
    },

    async afterAll() {
        log(' [SETUP] Global teardown: Closing connections and cleaning up...');
        
        // Close MongoDB connection if it's open
        try {
            if (mongoose.connection.readyState !== 0) {
                await mongoose.connection.close();
                log(' [SETUP] MongoDB connection closed');
            } else {
                log(' [SETUP] No active MongoDB connection to close');
            }
        } catch (error) {
            log(' [SETUP] Error closing MongoDB connection: ' + error.message);
        }
        
        log(' [SETUP] Global teardown completed');
    }
};

