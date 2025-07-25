const WebSocket = require('ws');

class WebSocketServer {
    constructor(port, cTraderSession) {
        this.wss = new WebSocket.Server({ port });
        this.cTraderSession = cTraderSession;
        this.clientSubscriptions = new Map(); // Map: WebSocket -> Set<symbolName>
        this.backendSubscriptions = new Map(); // Map: symbolName -> count of clients

        // Unified backend status representing both WS and cTrader session state
        // States: 'disconnected', 'ws-connecting', 'ws-open', 'ctrader-connecting', 'connected', 'error'
        this.currentBackendStatus = 'disconnected';
        this.currentAvailableSymbols = [];

        this.wss.on('connection', (ws) => this.handleConnection(ws));
        
        this.wss.on('listening', () => { // Added listening event for initial WS server start
             this.updateBackendStatus('ws-open');
             console.log(`WebSocket server listening on port ${port}`);
         });

         this.wss.on('error', (error) => { // Added error event for WS server itself
             console.error('WebSocket Server error:', error);
             this.updateBackendStatus('error', error.message);
         });

        this.cTraderSession.on('tick', (tick) => this.broadcastTick(tick));
        
        this.cTraderSession.on('connected', (availableSymbols) => { 
             console.log('CTraderSession emitted connected with symbols.', availableSymbols.length, 'symbols');
             this.currentAvailableSymbols = availableSymbols;
             this.updateBackendStatus('connected', null, this.currentAvailableSymbols);
         });

        this.cTraderSession.on('disconnected', () => { 
             console.log('CTraderSession emitted disconnected.');
             this.currentAvailableSymbols = [];
             this.updateBackendStatus('disconnected');
         });

        this.cTraderSession.on('error', (error) => { 
             console.error('CTraderSession emitted error.', error); // Debug log
             this.currentAvailableSymbols = [];
             this.updateBackendStatus('error', error.message);
         });

        // Initial status update when the server starts trying to listen
        this.updateBackendStatus('ws-connecting');
    }

    updateBackendStatus(status, message = null, availableSymbols = []) {
        this.currentBackendStatus = status;
        this.currentAvailableSymbols = availableSymbols;
        const statusData = { type: 'status', status: this.currentBackendStatus, availableSymbols: this.currentAvailableSymbols };
        if (message) statusData.message = message;
        console.log('Backend Status Updated and Broadcasting:', statusData); // Debug log
        this.broadcastStatus(statusData);
    }

    handleConnection(ws) {
        console.log('Client connected');
        this.clientSubscriptions.set(ws, new Set());

        // Handle messages from clients
        ws.on('message', (message) => this.handleMessage(ws, message));

        // Handle client disconnect
        ws.on('close', () => this.handleClose(ws));

        // Handle client errors
        ws.on('error', (error) => this.handleError(ws, error));

        // *Do NOT* send immediate status here. Status will be sent when client sends 'connect'.
    }

    handleMessage(ws, message) {
        const data = JSON.parse(message);
        console.log(`Received message from client: ${data.type}`);

        switch (data.type) {
            case 'connect':
                console.log('Client sent connect message. Sending latest known status.');
                // Client is signaling readiness. Send the *latest known unified status*.
                 this.broadcastStatusToClient(ws, { 
                     type: 'status', 
                     status: this.currentBackendStatus,
                     availableSymbols: this.currentAvailableSymbols 
                 });
                break;
            case 'subscribe':
                if (data.symbols && Array.isArray(data.symbols)) {
                    this.subscribeClientToSymbols(ws, data.symbols);
                } else {
                     console.warn('Received subscribe message without symbols.', data);
                }
                break;
            case 'unsubscribe':
                if (data.symbols && Array.isArray(data.symbols)) {
                    this.unsubscribeClientFromSymbols(ws, data.symbols);
                } else {
                     console.warn('Received unsubscribe message without symbols.', data);
                }
                break;
            default:
                console.warn(`Unknown message type: ${data.type}`);
        }
    }

     broadcastStatusToClient(ws, statusData) {
         console.log('Broadcasting status to single client:', statusData); // Debug log
         if (ws.readyState === WebSocket.OPEN) {
             ws.send(JSON.stringify(statusData));
         }
     }

    broadcastStatus(statusData) {
         console.log('Broadcasting status to all clients:', statusData); // Debug log
         if (statusData.status === 'connected' && Array.isArray(statusData.availableSymbols)) {
              console.log('Broadcasting CONNECTED status with symbols.'); // Debug log for connected status
         }
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(statusData));
            }
        });
    }

    broadcastTick(tick) {
        const subscribers = this.backendSubscriptions.get(tick.symbol);
        if (subscribers && subscribers > 0) {
             this.wss.clients.forEach(client => {
                const clientSubs = this.clientSubscriptions.get(client);
                if (client.readyState === WebSocket.OPEN && clientSubs && clientSubs.has(tick.symbol)) {
                    client.send(JSON.stringify({ type: 'tick', ...tick }));
                }
            });
        }
    }

    subscribeClientToSymbols(ws, symbols) {
        console.log('Subscribing client to symbols:', symbols); // Debug log
        const clientSubs = this.clientSubscriptions.get(ws);
        const results = [];

        if (!clientSubs) {
             symbols.forEach(symbol => results.push({ symbol, status: 'error', message: 'Client not initialized' }));
             this.broadcastSubscriptionResponse(ws, results);
             return;
        }

        symbols.forEach(symbol => {
            // Check if the symbol is available and cTrader session is connected
            if (this.currentBackendStatus === 'connected' && this.currentAvailableSymbols.includes(symbol)) {
                 if (!clientSubs.has(symbol)) {
                    clientSubs.add(symbol);
                    this.backendSubscriptions.set(symbol, (this.backendSubscriptions.get(symbol) || 0) + 1);
                    console.log(`Client subscribed to ${symbol}. Total subscribers: ${this.backendSubscriptions.get(symbol)}`); // Debug log

                    // If this is the first subscriber for this symbol, start backend subscription
                    if (this.backendSubscriptions.get(symbol) === 1) {
                        console.log(`First subscriber for ${symbol}. Starting backend subscription.`); // Debug log
                        this.cTraderSession.subscribeTicks(symbol);
                    }
                     results.push({ symbol, status: 'subscribed' });
                 } else {
                      results.push({ symbol, status: 'subscribed', message: 'Already subscribed' });
                 }
            } else {
                console.warn(`Client attempted to subscribe to unavailable symbol: ${symbol} or cTrader session not connected`); // Debug log
                 results.push({ symbol, status: 'error', message: 'Symbol not available or cTrader session not connected' });
            }
        });
        
        this.broadcastSubscriptionResponse(ws, results);
    }

    unsubscribeClientFromSymbols(ws, symbols) {
         console.log('Unsubscribing client from symbols:', symbols); // Debug log
         const clientSubs = this.clientSubscriptions.get(ws);
         const results = [];

         if (!clientSubs) {
             symbols.forEach(symbol => results.push({ symbol, status: 'error', message: 'Client not initialized' }));
             this.broadcastSubscriptionResponse(ws, results);
             return;
         }

        symbols.forEach(symbol => {
            if (clientSubs.has(symbol)) {
                clientSubs.delete(symbol);
                const currentSubscribers = (this.backendSubscriptions.get(symbol) || 1) - 1;
                this.backendSubscriptions.set(symbol, currentSubscribers);
                 console.log(`Client unsubscribed from ${symbol}. Total subscribers: ${currentSubscribers}`); // Debug log

                // If no more subscribers for this symbol, stop backend subscription
                if (currentSubscribers <= 0) {
                    console.log(`No more subscribers for ${symbol}. Stopping backend subscription.`); // Debug log
                    this.cTraderSession.unsubscribeTicks(symbol);
                    this.backendSubscriptions.delete(symbol); // Clean up map entry
                }
                 results.push({ symbol, status: 'unsubscribed' });
            } else {
                 results.push({ symbol, status: 'unsubscribed', message: 'Not subscribed' });
            }
        });
         this.broadcastSubscriptionResponse(ws, results); // Debug log
    }

     broadcastSubscriptionResponse(ws, results) {
         console.log('Broadcasting subscription response to client:', results); // Debug log
         if (ws.readyState === WebSocket.OPEN) {
             ws.send(JSON.stringify({ type: 'subscribeResponse', results }));
         }
     }

    handleClose(ws) {
        console.log('Client disconnected'); // Debug log
        this.clientSubscriptions.delete(ws);
        // We no longer need to manage backend subscriptions based on client disconnect
        // The cTraderSession will maintain its subscriptions until unsubscribeTicks is called.
        // The backendSubscriptions map is now purely for tracking active subscribers per symbol.
    }

     handleError(ws, error) {
         console.error('Client WebSocket error:', error); // Debug log
         // Close the connection if an error occurs
         if (ws.readyState !== WebSocket.CLOSING && ws.readyState !== WebSocket.CLOSED) {
             ws.close();
         }
     }
}

module.exports = { WebSocketServer };
