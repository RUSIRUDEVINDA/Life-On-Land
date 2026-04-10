
import { runSingleSimulationTick } from './simulate_movement.core.js';

runSingleSimulationTick().catch((err) => {
    console.error('Simulation crashed:', err);
    process.exit(1);
});