const express = require('express');
const path = require('path');
const cors = require('cors');
const TickBridge = require('./src/TickBridge');

// Load configuration
const config = {
    port: process.env.PORT || 3002,
    websocketPort: process.env.WEBSOCKET_PORT || 3003,
    tickBatchInterval: parseInt(process.env.TICK_BATCH_INTERVAL) || 100,
    maxTicksPerSymbol: parseInt(process.env.MAX_TICKS_PER_SYMBOL) || 100
};

// Create Express app
const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Create TickBridge instance
const tickBridge = new TickBridge(config);

// API Routes
app.get('/api/status', (req, res) => {
    res.json(tickBridge.getStatus());
});

app.get('/api/symbols', (req, res) => {
    res.json({
        symbols: tickBridge.wsBridge.getSubscribedSymbols()
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

// Start server
const server = app.listen(config.port, () => {
    console.log(`Web server running on http://localhost:${config.port}`);
    console.log(`WebSocket server will run on ws://localhost:${config.websocketPort}`);
    
    // Start the tick bridge
    tickBridge.start();
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    tickBridge.stop();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    tickBridge.stop();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

module.exports = { app, tickBridge };