import { startContinuousSimulation } from './simulate_movement.core.js';

startContinuousSimulation().catch((err) => {
    console.error('Simulation crashed:', err);
    process.exit(1);
});