class LivePriceTicker {
    constructor() {
        this.ws = null;
        this.symbols = new Set();
        this.priceData = new Map();
        this.reconnectInterval = 5000;
        this.maxReconnectAttempts = 10;
        this.reconnectAttempts = 0;
        
        this.initializeElements();
        this.bindEvents();
        this.connect();
    }

    initializeElements() {
        this.elements = {
            connectionStatus: document.getElementById('connection-status'),
            clientCount: document.getElementById('client-count'),
            symbolInput: document.getElementById('symbol-input'),
            addSymbolBtn: document.getElementById('add-symbol-btn'),
            symbolCount: document.getElementById('symbol-count'),
            symbolTags: document.getElementById('symbol-tags'),
            priceGrid: document.getElementById('price-grid'),
            wsStatus: document.getElementById('ws-status'),
            lastUpdate: document.getElementById('last-update')
        };
    }

    bindEvents() {
        this.elements.addSymbolBtn.addEventListener('click', () => this.addSymbol());
        this.elements.symbolInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addSymbol();
        });
    }

    connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}:3001`;
        
        try {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.updateConnectionStatus('connected');
                this.reconnectAttempts = 0;
                this.subscribeToSymbols();
            };
            
            this.ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
            };
            
            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.updateConnectionStatus('disconnected');
                this.attemptReconnect();
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateConnectionStatus('error');
            };
            
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            this.attemptReconnect();
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => this.connect(), this.reconnectInterval);
        } else {
            console.error('Max reconnection attempts reached');
            this.updateConnectionStatus('failed');
        }
    }

    updateConnectionStatus(status) {
        const statusMap = {
            connected: { text: 'Connected', class: 'connected' },
            disconnected: { text: 'Disconnected', class: 'disconnected' },
            connecting: { text: 'Connecting...', class: 'connecting' },
            error: { text: 'Error', class: 'disconnected' },
            failed: { text: 'Connection Failed', class: 'disconnected' }
        };
        
        const statusInfo = statusMap[status] || statusMap.disconnected;
        this.elements.connectionStatus.textContent = statusInfo.text;
        this.elements.connectionStatus.className = `status-indicator ${statusInfo.class}`;
        this.elements.wsStatus.textContent = statusInfo.text;
    }

    handleMessage(message) {
        switch (message.type) {
            case 'initial':
                this.handleInitialData(message.data);
                break;
            case 'tick':
                this.handleTickUpdate(message.data);
                break;
            default:
                console.warn('Unknown message type:', message.type);
        }
    }

    handleInitialData(data) {
        Object.entries(data).forEach(([symbol, tickData]) => {
            this.priceData.set(symbol, tickData);
            this.updatePriceDisplay(symbol, tickData);
        });
    }

    handleTickUpdate(data) {
        Object.entries(data).forEach(([symbol, tickData]) => {
            const oldPrice = this.priceData.get(symbol)?.price;
            this.priceData.set(symbol, tickData);
            this.updatePriceDisplay(symbol, tickData, oldPrice);
        });
        
        this.elements.lastUpdate.textContent = new Date().toLocaleTimeString();
    }

    addSymbol() {
        const symbol = this.elements.symbolInput.value.trim().toUpperCase();
        
        if (!symbol) return;
        
        if (this.symbols.has(symbol)) {
            alert('Symbol already added');
            return;
        }
        
        if (this.symbols.size >= 24) {
            alert('Maximum 24 symbols allowed');
            return;
        }
        
        this.symbols.add(symbol);
        this.elements.symbolInput.value = '';
        this.updateSymbolDisplay();
        this.subscribeToSymbols();
    }

    removeSymbol(symbol) {
        this.symbols.delete(symbol);
        this.priceData.delete(symbol);
        this.updateSymbolDisplay();
        this.subscribeToSymbols();
        this.removePriceCard(symbol);
    }

    updateSymbolDisplay() {
        this.elements.symbolCount.textContent = this.symbols.size;
        
        this.elements.symbolTags.innerHTML = '';
        this.symbols.forEach(symbol => {
            const tag = document.createElement('div');
            tag.className = 'symbol-tag';
            tag.innerHTML = `
                ${symbol}
                <span class="remove" data-symbol="${symbol}">×</span>
            `;
            
            tag.querySelector('.remove').addEventListener('click', () => {
                this.removeSymbol(symbol);
            });
            
            this.elements.symbolTags.appendChild(tag);
        });
    }

    subscribeToSymbols() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'subscribe',
                symbols: Array.from(this.symbols)
            }));
        }
    }

    updatePriceDisplay(symbol, tickData, oldPrice = null) {
        let card = document.getElementById(`card-${symbol}`);
        
        if (!card) {
            if (!this.symbols.has(symbol)) return;
            
            card = this.createPriceCard(symbol);
            this.elements.priceGrid.appendChild(card);
        }
        
        const priceElement = card.querySelector('.price-value');
        const changeElement = card.querySelector('.price-change');
        const timestampElement = card.querySelector('.price-timestamp');
        
        priceElement.textContent = tickData.price.toFixed(5);
        
        if (oldPrice !== null) {
            const change = tickData.price - oldPrice;
            const changePercent = (change / oldPrice) * 100;
            
            changeElement.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(5)} (${changePercent.toFixed(2)}%)`;
            changeElement.className = `price-change ${change >= 0 ? 'positive' : 'negative'}`;
        }
        
        timestampElement.textContent = new Date(tickData.timestamp).toLocaleTimeString();
        
        // Remove empty state
        const emptyState = this.elements.priceGrid.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }
    }

    createPriceCard(symbol) {
        const card = document.createElement('div');
        card.className = 'price-card';
        card.id = `card-${symbol}`;
        
        card.innerHTML = `
            <h3>${symbol}</h3>
            <div class="price-value">-</div>
            <div class="price-change">-</div>
            <div class="price-timestamp">-</div>
        `;
        
        return card;
    }

    removePriceCard(symbol) {
        const card = document.getElementById(`card-${symbol}`);
        if (card) {
            card.remove();
        }
        
        if (this.symbols.size === 0) {
            this.showEmptyState();
        }
    }

    showEmptyState() {
        this.elements.priceGrid.innerHTML = `
            <div class="empty-state">
                <h3>No symbols selected</h3>
                <p>Add symbols above to start receiving live price updates</p>
            </div>
        `;
    }

    updateClientCount(count) {
        this.elements.clientCount.textContent = `${count} client${count !== 1 ? 's' : ''}`;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new LivePriceTicker();
});