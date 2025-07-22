const { spawn } = require('child_process');
const path = require('path');
const WebSocketBridge = require('./WebSocketBridge');

class TickBridge {
    constructor(config = {}) {
        this.config = {
            port: config.port || 3001,
            tickBatchInterval: config.tickBatchInterval || 100,
            maxTicksPerSymbol: config.maxTicksPerSymbol || 100,
            ...config
        };
        
        this.wsBridge = new WebSocketBridge(this.config.port);
        this.subscriberProcess = null;
        this.isRunning = false;
        this.symbolSubscriptions = new Set();
    }

    start() {
        if (this.isRunning) {
            console.log('TickBridge already running');
            return;
        }

        console.log('Starting TickBridge...');
        
        // Start WebSocket server
        this.wsBridge.createBridge();
        
        // Start subscriber process
        this.startSubscriber();
        
        this.isRunning = true;
        console.log('TickBridge started successfully');
    }

    startSubscriber() {
        const subscriberPath = path.join(__dirname, '../../bin/subscribe.js');
        
        this.subscriberProcess = spawn('node', [subscriberPath], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        this.subscriberProcess.stdout.on('data', (data) => {
            const lines = data.toString().split('\n');
            lines.forEach(line => {
                if (line.trim()) {
                    this.processTick(line);
                }
            });
        });

        this.subscriberProcess.stderr.on('data', (data) => {
            console.error('Subscriber error:', data.toString());
        });

        this.subscriberProcess.on('close', (code) => {
            console.log(`Subscriber process exited with code ${code}`);
            if (this.isRunning) {
                setTimeout(() => this.startSubscriber(), 5000); // Restart after 5s
            }
        });

        this.subscriberProcess.on('error', (error) => {
            console.error('Failed to start subscriber:', error);
        });
    }

    processTick(line) {
        try {
            // Parse tick data from subscriber output
            // Expected format: "SYMBOL:PRICE"
            const [symbol, priceStr] = line.split(':');
            if (!symbol || !priceStr) return;

            const price = parseFloat(priceStr.trim());
            if (isNaN(price)) return;

            const tickData = {
                price,
                timestamp: Date.now()
            };

            // Broadcast to WebSocket clients
            this.wsBridge.broadcastTick(symbol.trim(), tickData);
            
        } catch (error) {
            console.error('Error processing tick:', error);
        }
    }

    stop() {
        console.log('Stopping TickBridge...');
        this.isRunning = false;
        
        if (this.subscriberProcess) {
            this.subscriberProcess.kill();
            this.subscriberProcess = null;
        }
        
        console.log('TickBridge stopped');
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            connectedClients: this.wsBridge.getConnectedClients(),
            subscribedSymbols: this.wsBridge.getSubscribedSymbols()
        };
    }
}

module.exports = TickBridge;