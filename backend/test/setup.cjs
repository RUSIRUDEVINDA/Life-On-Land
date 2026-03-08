const mongoose = require('mongoose');

// Helper logger
const log = (message) => {
    process.stdout.write(message + '\n');
};
// Export root hooks for Mocha (works with ES modules when using --require flag)
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


