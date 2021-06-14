"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareHash = void 0;
function isHex(num) {
    return Boolean(num.match(/^0x[0-9a-f]+$/i));
}
function prepareHash(txHash) {
    const length = txHash.length;
    let result;
    if (length == 72 || length == 64 || length == 66 || length == 74) {
        const indexSyncTx = txHash.indexOf('sync-tx:');
        if (indexSyncTx == 0) {
            txHash = txHash.replace('sync-tx:', '');
        }
        if (indexSyncTx > 0) {
            throw 'Wrong Tx Hash Format:' + txHash;
        }
        const index0x = txHash.indexOf('0x');
        if (index0x == -1) {
            result = '0x' + txHash;
        }
        else if (index0x == 0) {
            result = txHash;
        }
    }
    if (result.length != 66 || isHex(result) == false) {
        throw 'Wrong Tx Hash Format:' + txHash;
    }
    else {
        return result;
    }
}
exports.prepareHash = prepareHash;
