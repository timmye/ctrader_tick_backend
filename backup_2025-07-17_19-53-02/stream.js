const { CTraderConnection } = require('@reiryoku/ctrader-layer');
require('dotenv').config();

class TickStreamer {
    constructor() {
        this.connection = null;
        this.isConnected = false;
        this.isAuthenticated = false;
        this.symbols = (process.env.SYMBOLS || '1').split(',').map(Number);
    }

    async connect() {
        try {
            console.log('Connecting to cTrader API...');
            this.connection = new CTraderConnection({
                host: process.env.HOST || 'live.ctraderapi.com',
                port: parseInt(process.env.PORT) || 5035
            });

            await this.connection.open();
            this.isConnected = true;
            console.log('✓ Connection established');
        } catch (error) {
            console.error('✗ Connection failed:', error.message);
            throw error;
        }
    }

    async authenticate() {
        try {
            console.log('Authenticating application...');
            
            // Application authentication
            const appAuth = await this.connection.sendCommand(2100, {
                clientId: process.env.CTRADER_CLIENT_ID,
                clientSecret: process.env.CTRADER_CLIENT_SECRET
            });
            console.log('✓ Application authenticated');

            // Account authentication
            console.log('Authenticating account...');
            const accountAuth = await this.connection.sendCommand(2102, {
                accessToken: process.env.CTRADER_ACCESS_TOKEN,
                ctidTraderAccountId: parseInt(process.env.CTRADER_ACCOUNT_ID)
            });
            console.log('✓ Account authenticated');
            this.isAuthenticated = true;
        } catch (error) {
            console.error('✗ Authentication failed:', error.message || error);
            throw error;
        }
    }

    async subscribeToTicks() {
        try {
            console.log(`Subscribing to symbols: ${this.symbols.join(', ')}...`);
            
            await this.connection.sendCommand(2127, {
                ctidTraderAccountId: parseInt(process.env.CTRADER_ACCOUNT_ID),
                symbolId: this.symbols
            });
            console.log('✓ Subscribed to tick data');

            // Listen for tick events
            this.connection.on(2131, (data) => {
                this.handleTick(data);
            });
        } catch (error) {
            console.error('✗ Subscription failed:', error.message);
            throw error;
        }
    }

    handleTick(tick) {
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 23);
        const bid = (tick.bid / 100000).toFixed(5);
        const ask = (tick.ask / 100000).toFixed(5);
        const symbol = this.getSymbolName(tick.symbolId);
        
        console.log(`[${timestamp}] ${symbol} ${bid}/${ask}`);
    }

    getSymbolName(symbolId) {
        const symbols = {
            1: 'EURUSD',
            2: 'GBPUSD',
            3: 'USDJPY',
            4: 'USDCHF',
            5: 'AUDUSD',
            6: 'USDCAD',
            7: 'NZDUSD',
            8: 'EURGBP',
            9: 'EURJPY',
            10: 'GBPJPY'
        };
        return symbols[symbolId] || `SYMBOL_${symbolId}`;
    }

    async start() {
        try {
            await this.connect();
            await this.authenticate();
            await this.subscribeToTicks();
            
            console.log('\n🚀 Tick streaming started. Press Ctrl+C to stop.\n');
            
            // Keep the process alive
            process.stdin.resume();
        } catch (error) {
            console.error('Failed to start tick streaming:', error.message);
            process.exit(1);
        }
    }

    async stop() {
        console.log('\n🛑 Stopping tick streaming...');
        if (this.connection && this.isConnected) {
            try {
                await this.connection.close();
                console.log('✓ Connection closed');
            } catch (error) {
                console.error('Error closing connection:', error.message);
            }
        }
        process.exit(0);
    }

    validateEnvironment() {
        const required = ['CTRADER_CLIENT_ID', 'CTRADER_CLIENT_SECRET', 'CTRADER_ACCESS_TOKEN', 'CTRADER_ACCOUNT_ID'];
        const missing = required.filter(key => !process.env[key]);
        
        if (missing.length > 0) {
            console.error('Missing required environment variables:', missing.join(', '));
            console.error('Please check your .env file');
            process.exit(1);
        }
    }
}

// Main execution
const streamer = new TickStreamer();

// Validate environment before starting
streamer.validateEnvironment();

// Handle graceful shutdown
process.on('SIGINT', () => streamer.stop());
process.on('SIGTERM', () => streamer.stop());

// Start the application
streamer.start().catch(error => {
    console.error('Application failed to start:', error.message);
    process.exit(1);
});