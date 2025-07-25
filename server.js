console.log('Executing backend server.js');
const { CTraderSession } = require('./CTraderSession');
const { WebSocketServer } = require('./WebSocketServer');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const port = process.env.WS_PORT || 8080;

const session = new CTraderSession();
const wsServer = new WebSocketServer(port, session);

// Initiate the cTrader session connection when the backend starts
session.connect();

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down backend...');
    session.disconnect();
    wsServer.wss.close(() => {
        console.log('WebSocket server closed.');
        process.exit(0);
    });
});
