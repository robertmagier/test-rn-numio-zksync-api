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
const feeswallet_js_1 = __importDefault(require("./feeswallet.js"));
const DEFAULT_FEE_TOKEN = 'USDC';
const IERC20_INTERFACE = zksync.utils.IERC20_INTERFACE;
const MAX_ERC20_APPROVE_AMOUNT = zksync.utils.MAX_ERC20_APPROVE_AMOUNT;
class UtilsWallet extends feeswallet_js_1.default {
    constructor(opts) {
        super(opts);
    }
    /**
     * Returns current state of an ZK Account.
     * @returns Promise resolved to zksync.types.AccountState or throws an error
     */
    getState() {
        return __awaiter(this, void 0, void 0, function* () {
            const state = yield this.zkWallet.getAccountState();
            return state;
        });
    }
    getTokenSet() {
        return this.zkProvider.tokenSet;
    }
    _mainZkContract(ethersWallet) {
        const contract = new ethers.Contract(this.zkProvider.contractAddress.mainContract, zksync.utils.SYNC_MAIN_CONTRACT_INTERFACE, ethersWallet);
        return contract;
    }
    isTokenApproved(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const approved = yield this.zkWallet.isERC20DepositsApproved(token);
            return approved;
        });
    }
    _approveToken(token, txOptions, amount = MAX_ERC20_APPROVE_AMOUNT) {
        return __awaiter(this, void 0, void 0, function* () {
            if (token == 'ETH') {
                throw Error('ETH token does not need approval.');
            }
            const tokenAddress = yield this._tokenAddress(token);
            const erc20contract = new ethers.Contract(tokenAddress, IERC20_INTERFACE, this.ethersWallet);
            let gasPrice, nonce;
            if (txOptions && txOptions.gasPrice) {
                gasPrice = txOptions.gasPrice;
            }
            else {
                throw 'Gas price for approval is not provided';
            }
            if (txOptions && txOptions.nonce) {
                nonce = txOptions.nonce;
            }
            else {
                nonce = yield this.zkEthProvider.getTransactionCount(this.address, 'pending');
            }
            console.log('Approve nonce:', nonce);
            const opts = {
                gasPrice,
                nonce,
            };
            return yield erc20contract.approve(this.zkProvider.contractAddress.mainContract, amount, opts);
        });
    }
    approveDefaultFeeToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            // await this.initZkSyncCrypto();
            try {
                const tx = yield this.zkDefaultFeeWallet.approveERC20TokenDeposits(token);
                const receipt = yield tx.wait();
                return { tx, receipt };
            }
            catch (e) {
                throw e;
            }
        });
    }
}
exports.default = UtilsWallet;
