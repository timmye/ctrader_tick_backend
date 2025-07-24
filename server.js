const { CTraderSession } = require('./CTraderSession');
const { WebSocketServer } = require('./WebSocketServer');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const port = process.env.WS_PORT || 8080;

const session = new CTraderSession();
const server = new WebSocketServer(port, session);

session.on('connected', async () => {
    console.log('CTrader session connected and symbols loaded.');
    // Subscriptions are now handled by WebSocketServer based on client requests
});

session.on('disconnected', () => {
    console.log('CTrader session disconnected.');
});

session.connect();

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down backend...');
    if (session.connection) {
        session.connection.close();
    }
    if (server.wss) {
        server.wss.close();
    }
    process.exit(0);
});
