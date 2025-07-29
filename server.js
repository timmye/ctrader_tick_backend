console.log('[DEBUG] 1. Executing backend server.js');

console.log('[DEBUG] 2. Requiring CTraderSession...');
const { CTraderSession } = require('./CTraderSession');
console.log('[DEBUG] 3. CTraderSession required successfully.');

console.log('[DEBUG] 4. Requiring WebSocketServer...');
const { WebSocketServer } = require('./WebSocketServer');
console.log('[DEBUG] 5. WebSocketServer required successfully.');

const path = require('path');

const port = process.env.WS_PORT || 8080;

console.log('[DEBUG] 6. Instantiating CTraderSession...');
const session = new CTraderSession();
console.log('[DEBUG] 7. CTraderSession instantiated successfully.');

console.log('[DEBUG] 8. Instantiating WebSocketServer...');
const wsServer = new WebSocketServer(port, session);
console.log('[DEBUG] 9. WebSocketServer instantiated successfully.');

// Initiate the cTrader session connection when the backend starts
console.log('[DEBUG] 10. Calling session.connect()...');
session.connect();
console.log('[DEBUG] 11. session.connect() called. Script execution continuing.');

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down backend...');
    session.disconnect();
    wsServer.wss.close(() => {
        console.log('WebSocket server closed.');
        process.exit(0);
    });
});
