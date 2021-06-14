"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zkWalletConstructor = exports.apiConstructor = void 0;
function apiConstructor(request) {
    /**
     *
     */
    const name = 'numio-zksync-api constructor';
    let result = true;
    if (request.zkWsAddress === undefined && request.zkHttpAddress === undefined) {
        result = false;
        console.error(name, 'ZKSync server address is not defined:', request.zkWsAddress, ' ', request.zkHttpAddress);
    }
    return result;
}
exports.apiConstructor = apiConstructor;
function zkWalletConstructor(request) {
    const name = 'Wallet Constructor';
    let result = true;
    if (request.zkHttpAddress === undefined) {
        result = false;
        console.error(name, 'ZKSync server address is not defined:', request.zkHttpAddress);
    }
    if (request.zkEthNetwork === undefined || request.zkEthAccessKey == undefined) {
        result = false;
        console.error(name, 'ZKSync Eth Provider connection data is undefined:', request.zkEthNetwork, request.zkEthAccessKey);
    }
    return result;
}
exports.zkWalletConstructor = zkWalletConstructor;
