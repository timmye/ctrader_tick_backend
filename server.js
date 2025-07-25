const { CTraderSession } = require('./CTraderSession');
const { WebSocketServer } = require('./WebSocketServer');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const port = process.env.WS_PORT || 8080;

const session = new CTraderSession();
const server = new WebSocketServer(port, session);

// The session is no longer connected automatically.
// Connection is now initiated by a 'connect' message from a WebSocket client.

session.on('connected', () => {
    console.log('CTrader session connected and symbols loaded.');
});

session.on('disconnected', () => {
    console.log('CTrader session disconnected.');
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down backend...');
    if (session.connection) {
        session.disconnect();
    }
    if (server.wss) {
        server.wss.close();
    }
    process.exit(0);
});
