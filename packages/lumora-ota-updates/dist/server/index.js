#!/usr/bin/env node
/**
 * Lumora OTA Update Server Entry Point
 */
import { createUpdateServer } from './update-server';
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3002;
const DATA_DIR = process.env.DATA_DIR || './ota-data';
async function main() {
    try {
        const server = createUpdateServer(PORT, DATA_DIR);
        await server.start();
    }
    catch (error) {
        console.error('Failed to start update server:', error);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=index.js.map