"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _CTraderSocket_host, _CTraderSocket_port, _CTraderSocket_socket;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CTraderSocket = void 0;
const tls = require("tls");
class CTraderSocket {
    constructor({ host, port, }) {
        _CTraderSocket_host.set(this, void 0);
        _CTraderSocket_port.set(this, void 0);
        _CTraderSocket_socket.set(this, void 0);
        __classPrivateFieldSet(this, _CTraderSocket_host, host, "f");
        __classPrivateFieldSet(this, _CTraderSocket_port, port, "f");
        __classPrivateFieldSet(this, _CTraderSocket_socket, undefined, "f");
    }
    get host() {
        return __classPrivateFieldGet(this, _CTraderSocket_host, "f");
    }
    get port() {
        return __classPrivateFieldGet(this, _CTraderSocket_port, "f");
    }
    connect() {
        const socket = tls.connect(__classPrivateFieldGet(this, _CTraderSocket_port, "f"), __classPrivateFieldGet(this, _CTraderSocket_host, "f"), this.onOpen);
        socket.on("data", this.onData);
        socket.on("end", this.onClose);
        socket.on("error", this.onError);
        __classPrivateFieldSet(this, _CTraderSocket_socket, socket, "f");
    }
    send(buffer) {
        var _a;
        (_a = __classPrivateFieldGet(this, _CTraderSocket_socket, "f")) === null || _a === void 0 ? void 0 : _a.write(buffer);
    }
    onOpen() {
    }
    onData(...parameters) {
    }
    onClose() {
    }
    onError() {
    }
}
exports.CTraderSocket = CTraderSocket;
_CTraderSocket_host = new WeakMap(), _CTraderSocket_port = new WeakMap(), _CTraderSocket_socket = new WeakMap();
//# sourceMappingURL=CTraderSocket.js.map