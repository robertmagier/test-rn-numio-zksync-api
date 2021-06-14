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
const axios_1 = __importDefault(require("axios"));
const initwallet_1 = __importDefault(require("./initwallet"));
// const tokenListAll = require('./tokens');
const tokenListAll = { rinkeby: [], main: [] };
class BaseWallet extends initwallet_1.default {
    constructor(opts) {
        super(opts);
    }
    /**
     * Checks signingKey is set for an account. It must be to execute transfer and withdrawal.
     * @returns Promise resolved to boolean. True if key is already set and false if it is not set.
     */
    isSigningKeySet() {
        return __awaiter(this, void 0, void 0, function* () {
            // await this.initZkSyncCrypto();
            const keySet = yield this.zkWallet.isSigningKeySet();
            return keySet;
        });
    }
    /**
     * Sets signing key for the zksync account. It will throw an error if account doesn't exist.
     * To create an account you have to first make a deposit or transfer from another account.
     * @returns Returns Promise resolved to boolean. False if it was not possible to set signing key or it was already set and true if signing key was set.
     */
    setSigningKey(feeToken) {
        return __awaiter(this, void 0, void 0, function* () {
            // await this.initZkSyncCrypto();
            const keySet = yield this.isSigningKeySet();
            if (keySet) {
                console.error('Siging Key is already set for account:', this.address);
                return null;
            }
            else {
                const inputData = {
                    feeToken,
                    ethAuthType: 'ECDSA',
                };
                const changePubkey = yield this.zkWallet.setSigningKey(inputData);
                const receipt = yield changePubkey.awaitReceipt();
                return receipt;
            }
        });
    }
    supportedTokens() {
        return __awaiter(this, void 0, void 0, function* () {
            const network = this.options.zkEthNetwork;
            const tokenList = network == 'rinkeby' ? tokenListAll.rinkeby : tokenListAll.main;
            const tokens = this.zkProvider.tokenSet;
            const list = Object.assign({}, tokens.tokenBySymbol);
            // console.log(tokens.tokensBySymbol);
            for (let i = 0; i < tokenList.length; i++) {
                list[tokenList[i].symbol] = {};
            }
            const symbols = Object.keys(list);
            return symbols;
        });
    }
    /**
     * Returns erc20 contract address of a token
     * @param tokenSymbol - symbol of a token to find an address for.
     */
    _tokenAddress(tokenSymbol) {
        return __awaiter(this, void 0, void 0, function* () {
            const ethNetwork = this.options.zkEthNetwork;
            if (tokenSymbol == 'MIA' || tokenSymbol == '0xf598497B8067964F469c33A3bEF2d5Efe96F8750') {
                return '0xf598497B8067964F469c33A3bEF2d5Efe96F8750';
            }
            else {
                try {
                    const adr = this.zkProvider.tokenSet.resolveTokenAddress(tokenSymbol);
                    return adr;
                }
                catch (e) {
                    console.log(tokenSymbol + ' token not supported on L2');
                    const tokenList = ethNetwork == 'rinkeby' ? tokenListAll.rinkeby : tokenListAll.main;
                    const el = tokenList.find(e => e.symbol == tokenSymbol);
                    if (el) {
                        return el.address;
                    }
                    else {
                        throw tokenSymbol + ' not supported on L1 and L2';
                    }
                }
            }
        });
    }
    getL1Balances(tokens, account) {
        return __awaiter(this, void 0, void 0, function* () {
            if (tokens.length == 0)
                throw 'Expecting array of tokenSymbols';
            const result = {};
            for (let i = 0; i < tokens.length; i++) {
                const symbol = tokens[i];
                try {
                    const balance = yield this.getEthereumBalance(symbol, account);
                    result[symbol] = balance.toString();
                }
                catch (e) {
                    result[symbol] = null;
                }
            }
            return result;
        });
    }
    getL2Balances(tokens, account) {
        return __awaiter(this, void 0, void 0, function* () {
            if (tokens.length == 0)
                throw 'Expecting array of tokenSymbols';
            const result = {};
            for (let i = 0; i < tokens.length; i++) {
                const symbol = tokens[i];
                try {
                    const balance = yield this.getZkSyncBalance(symbol, account);
                    result[symbol] = balance.toString();
                }
                catch (e) {
                    result[symbol] = null;
                }
            }
            return result;
        });
    }
    /**
     * Returns balance on Ethereum network (L1). Will throw an error when token parameter is undefined or null.
     * @param token token to check balance for
     * @returns Promise resolved to ethers.BigNumber or throws an error
     */
    getEthereumBalance(token, account) {
        return __awaiter(this, void 0, void 0, function* () {
            let tokenAddress;
            if (token === undefined || token === null) {
                throw 'getEthereumBalance: token undefined or null';
            }
            if (account === undefined) {
                account = this.address;
            }
            if (token == 'ETH') {
                const balance = yield this.zkEthProvider.getBalance(account);
                return balance;
            }
            else {
                tokenAddress = yield this._tokenAddress(token);
                console.log(tokenAddress);
            }
            try {
                const code = yield this.zkEthProvider.getCode(tokenAddress);
                if (code == '0x') {
                    throw 'Wrong Smart Contract for ' +
                        token +
                        ' for address: ' +
                        tokenAddress +
                        ' Wrong blokchain network ?';
                }
                const erc20contract = new ethers.Contract(tokenAddress, zksync.utils.IERC20_INTERFACE, this.ethersWallet);
                const balance = yield erc20contract.balanceOf(account);
                return balance;
            }
            catch (e) {
                throw e;
            }
        });
    }
    /**
     * Returns balance on Ethereum network (L1). Will throw an error when token parameter is undefined or null.
     * @param token token to check balance for
     * @returns Promise resolved to ethers.BigNumber or throws an error
     */
    getTokenDecimals(token) {
        return __awaiter(this, void 0, void 0, function* () {
            let tokenAddress;
            if (token === undefined || token === null) {
                throw 'getTokenDecimals: token undefined or null';
            }
            if (token == 'ETH') {
                return 18;
            }
            else if (token == 'MIA') {
                tokenAddress = '0xf598497B8067964F469c33A3bEF2d5Efe96F8750';
            }
            else {
                tokenAddress = this.zkProvider.tokenSet.resolveTokenAddress(token);
            }
            try {
                const erc20contract = new ethers.Contract(tokenAddress, zksync.utils.IERC20_INTERFACE, this.ethersWallet);
                const decimals = yield erc20contract.decimals();
                return decimals.toString();
            }
            catch (e) {
                throw e;
            }
        });
    }
    /**
     * Returns balance on ZKSync network (L2). Will throw an error when token parameter is undefined or null.
     * @param token token to check balance for
     * @param account? account address to check balance for. Optional. If not used then this wallet balance will be returned.
     * @returns Promise resolved to ethers.BigNumber or throws an error
     */
    // TODO: I think we should create another function to check balance of another account. This is a bit misleading. Maybe it should be moved to zksyncapi.
    getZkSyncBalance(token, account = null) {
        return __awaiter(this, void 0, void 0, function* () {
            if (token === undefined || token === null) {
                throw 'getZkSyncBalance: token undefined or null';
            }
            if (account != null) {
                const state = yield this.zkWallet.provider.getState(account);
                const balance = state.committed.balances[token];
                if (balance === undefined) {
                    throw token + ' not supported on L2. No balance';
                }
                else {
                    return balance;
                }
            }
            else {
                try {
                    const balance = yield this.zkWallet.getBalance(token);
                    return balance;
                }
                catch (e) {
                    throw e;
                }
            }
        });
    }
    /**
     * Function checks if an account exists on ZK Sync Network(L2). If account doesn't exist then it is not possible to make a transfer and withdrawal
     * @returns Returns Promise resolved to boolean. true if an account exist. false if it doesn't
     */
    exists() {
        return __awaiter(this, void 0, void 0, function* () {
            const id = yield this.zkWallet.getAccountId();
            return id !== null;
        });
    }
    /**
     * Returns transactions history of an account within specified range. Will throw an error if account doesn't exist
     * @param start offset value. Specifies first transaction which should be retrieved. The newest transaction is 0.
     * @param range number of transactions to retrieve
     * @returns Array of transactions as type: Numio.ZkWallet.HistoryEntry
     */
    getTxHistory(start, range) {
        return __awaiter(this, void 0, void 0, function* () {
            if (start === undefined || start === null || typeof start === 'string')
                throw 'getTxHistory: start undefined or null or string. Must be a number';
            if (range === undefined || range === null || range === 0 || typeof range === 'string')
                throw 'getTxHistory: range undefined or null or string or zero. Must be a number';
            if (range > 100 || range < 0)
                throw 'getTxHistory: range out of range. 0>range<=100';
            const exists = yield this.exists();
            if (!exists)
                throw 'getTxHistory: Account does not exist in ZK SYNC Node';
            try {
                const account = this.address;
                const url = `${this.options.zkApi}/account/${account}/history/${start}/${range}`;
                const result = yield axios_1.default.get(url);
                const data = result.data;
                const history = {
                    Withdraw: new Array(0),
                    Transfer: new Array(0),
                    Deposit: new Array(0),
                    ChangePubKey: new Array(0),
                    all: new Array(0),
                };
                data.forEach(entry => {
                    if (entry.tx.type == 'Withdraw' || entry.tx.type == 'Transfer' || entry.tx.type == 'Deposit') {
                        const newItem = this._parseHistoryTx(entry);
                        history[entry.tx.type].push(newItem);
                        history.all.push(newItem);
                    }
                });
                return history;
            }
            catch (e) {
                throw e;
            }
        });
    }
    _parseHistoryTx(entry) {
        let historyEntry = null;
        if (entry.tx.type == 'Deposit') {
            historyEntry = {
                hash: entry.hash,
                nonce: null,
                tx_id: entry.tx_id,
                accountId: entry.tx.account_id,
                eth_block: entry.eth_block,
                from: entry.tx.priority_op.from,
                to: entry.tx.priority_op.to,
                amount: entry.tx.priority_op.amount,
                fee: null,
                token: entry.tx.priority_op.token,
                success: entry.success,
                fail_reason: entry.fail_reason,
                verified: entry.verified,
                commited: entry.commited,
                type: entry.tx.type,
                created_at: entry.created_at,
            };
        }
        if (entry.tx.type == 'Transfer' || entry.tx.type == 'Withdraw') {
            historyEntry = {
                hash: entry.hash,
                nonce: entry.tx.nonce,
                tx_id: entry.tx_id,
                accountId: entry.tx.accountId,
                eth_block: entry.eth_block,
                from: entry.tx.from,
                to: entry.tx.to,
                amount: entry.tx.amount,
                fee: entry.tx.fee,
                token: entry.tx.token,
                success: entry.success,
                fail_reason: entry.fail_reason,
                verified: entry.verified,
                commited: entry.commited,
                type: entry.tx.type,
                created_at: entry.created_at,
            };
        }
        return historyEntry;
    }
    /**
     * Returns transactions status and  additional information
     * @param txHash transaction hash. Must be internal zksync hash.
     * @returns Transaction Information.
     */
    getTxL2Status(txHash) {
        return __awaiter(this, void 0, void 0, function* () {
            const receipt = yield this.zkProvider.getTxReceipt(txHash);
            console.log('Receipt: ', receipt);
            return receipt;
        });
    }
    /**
     * Returns transactions status and  additional information
     * @param txHash transaction hash. Must be L1 hash.
     * @returns Transaction Information.
     */
    getTxL1Status(txHash) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const receipt = yield this.zkEthProvider.getTransactionReceipt(txHash);
                return receipt;
            }
            catch (e) {
                throw e;
            }
        });
    }
}
exports.default = BaseWallet;
