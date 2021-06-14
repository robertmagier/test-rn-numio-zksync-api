"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("@ethersproject/shims");
const ethers = __importStar(require("ethers"));
const zksync = __importStar(require("./zksync-config"));
const basewallet_js_1 = __importDefault(require("./basewallet.js"));
const axios_1 = __importDefault(require("axios"));
class FeesWallet extends basewallet_js_1.default {
    constructor(opts) {
        super(opts);
    }
    verifyFee(fee, amount, token, signingFee) {
        return __awaiter(this, void 0, void 0, function* () {
            let balance = yield this.zkWallet.getBalance(token);
            balance = ethers.BigNumber.from(balance);
            signingFee = signingFee ? signingFee : '0';
            let expected = ethers.BigNumber.from(amount);
            expected = expected.add(fee).add(signingFee);
            if ((yield balance).lt(expected)) {
                console.log(`Not enough balance.Expected:${expected.toString()}`);
                console.log('Fee:', fee);
                console.log('Signing Fee: ', signingFee.toString());
                console.log(`Got Balance:                        ${balance.toString()}`);
                console.log(`Missing:                    ${expected.sub(balance).toString()}`);
                throw `Not enough balance`;
            }
        });
    }
    _getGasNowGasPrice() {
        return __awaiter(this, void 0, void 0, function* () {
            const url = 'https://www.gasnow.org/api/v3/gas/price?utm_source=:Numio';
            try {
                const result = yield axios_1.default.get(url, { timeout: 5000 });
                return result.data.data.fast;
            }
            catch (e) {
                console.log('_getGasNowGasPrice() url: ', url, ' error:', e.message);
                return ethers.BigNumber.from(4 * Math.pow(10, 10));
            }
        });
    }
    getGasPrice() {
        return __awaiter(this, void 0, void 0, function* () {
            const url = 'https://www.gasnow.org/api/v3/gas/price?utm_source=:Numio';
            try {
                const result = yield axios_1.default.get(url, { timeout: 5000 });
                const prices = result.data.data;
                Object.assign(prices, {
                    time: {
                        rapid: 15,
                        fast: 60,
                        standard: 180,
                        slow: 600,
                    },
                });
                return prices;
            }
            catch (e) {
                throw 'nowGasPrice() url: ' + url + ' error: ' + e.message;
            }
        });
    }
    _establishGasPrice(_requiredGasPrice) {
        return __awaiter(this, void 0, void 0, function* () {
            if (_requiredGasPrice === undefined) {
                throw 'Gas Price undefined';
            }
            if (parseInt(_requiredGasPrice.toString()) == 0) {
                throw 'Gas price is 0';
            }
            return _requiredGasPrice.toString();
        });
    }
    // public async _establishGasPrice(_requiredGasPrice?: ethers.BigNumberish) {
    //     let minGasPrice = await this._getGasNowGasPrice();
    //     minGasPrice = ethers.BigNumber.from(minGasPrice);
    //     if (minGasPrice.lt((10 ** 10).toString())) {
    //         console.log('Warning: Gas price returned by provider is less than 10 gwei. Using 10 gwei.');
    //         minGasPrice = ethers.BigNumber.from(10 ** 10);
    //     }
    //     if (_requiredGasPrice === undefined) {
    //         return minGasPrice.toString();
    //     }
    //     let requiredGasPrice;
    //     try {
    //         requiredGasPrice = ethers.BigNumber.from(_requiredGasPrice || 0);
    //     } catch (e) {
    //         throw `Can't convert required gas price ${_requiredGasPrice} to BigNumber`;
    //     }
    //     if (minGasPrice.gt(requiredGasPrice)) {
    //         console.warn(
    //             `Provided gas price: ${requiredGasPrice.toString()} is lower than minimum allowed gas price: ${minGasPrice.toString()}. Using minimum allowed gas price.`,
    //         );
    //         return minGasPrice.toString();
    //     } else {
    //         return ethers.BigNumber.from(requiredGasPrice);
    //     }
    // }
    /**
     * Calculates closest packable to 5 bytes value
     * @param  fee fee to calculate packable value for
     * @returns fee:string packable to 5 bytes
     */
    checkFee(fee) {
        if (fee === undefined)
            throw 'Fee value is undefined';
        const feeBN = ethers.BigNumber.from(fee);
        const packableAmount = zksync.utils.closestPackableTransactionFee(feeBN);
        return packableAmount.toString();
    }
    /**
     * Calculates closest packable to 5 bytes value
     * @param  amount fee to calculate packable value for. Must  be a string or BigNumber
     * @returns amount:string packable to 5 bytes
     */
    checkAmount(amount) {
        if (amount === undefined)
            throw 'Amount value is undefined';
        const value = amount;
        let amountBN;
        if (value._isBigNumber || typeof value == 'string') {
            amountBN = ethers.BigNumber.from(amount);
        }
        else
            throw 'Amount must be a string or a BigNumber';
        const packableAmount = zksync.utils.closestPackableTransactionAmount(amountBN);
        return packableAmount.toString();
    }
    /**
     * Returns fee amount required to make a transfer from L2 to L2
     * @param to L2 address for which transfer will be executed
     * @param token token for which transfer will be executed
     * @returns Promise resolved to ethers.BigNumber or throws an error
     */
    getTransferFee(to, token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fee = yield this.zkProvider.getTransactionFee('Transfer', to, token);
                return fee.totalFee;
            }
            catch (e) {
                throw e;
            }
        });
    }
    /**
     * Returns fee amount required to make a transfer from L2 to L2
     * @param to L2 address for which transfer will be executed
     * @param token token for which transfer will be executed
     * @returns Promise resolved to ethers.BigNumber or throws an error
     */
    getETHFee(to, type) {
        return __awaiter(this, void 0, void 0, function* () {
            const feeToken = 'ETH';
            try {
                const txTypes = [type, 'Transfer'];
                const toArray = [to, to];
                const fee = yield this.zkProvider.getTransactionsBatchFee(txTypes, toArray, feeToken);
                return fee;
            }
            catch (e) {
                throw e;
            }
        });
    }
    /**
     * Returns fee amount required to make a transfer from L2 to L2
     * @param to L2 address for which transfer will be executed
     * @param token token for which transfer will be executed
     * @returns Promise resolved to ethers.BigNumber or throws an error
     */
    getSigningFee(token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const txType = {};
                txType.ChangePubKey = 'ECDSA';
                // const txType: any = 'ChangePubKey';
                // const fee = await this.zkProvider.getTransactionFee(txType, this.address, token);
                const fee = yield this.zkProvider.getTransactionFee(txType, this.address, token);
                return fee.totalFee;
            }
            catch (e) {
                throw e;
            }
        });
    }
    /**
     * Returns fee amount required to make a withdrawal from L2 to L1
     * @param to L1 address to which withdrawal will be executed.
     * @param token token for which withdrawal will be executed
     * @returns Promise resolved to ethers.BigNumber or throws an error
     */
    getWithdrawFee(to, token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fee = yield this.zkProvider.getTransactionFee('Withdraw', to, token);
                console.log(fee);
                for (let i = 0; i < Object.keys(fee).length; i++) {
                    console.log(Object.keys(fee)[i], fee[Object.keys(fee)[i]].toString());
                }
                return fee.totalFee;
            }
            catch (e) {
                throw e;
            }
        });
    }
}
exports.default = FeesWallet;
