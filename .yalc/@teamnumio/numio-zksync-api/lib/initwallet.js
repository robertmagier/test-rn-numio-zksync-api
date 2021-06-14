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
Object.defineProperty(exports, "__esModule", { value: true });
require("@ethersproject/shims");
const ethers = __importStar(require("ethers"));
const zksync = __importStar(require("./zksync-config"));
const Verify = __importStar(require("./verify.js"));
class InitWallet {
    constructor(opts) {
        if (!Verify.zkWalletConstructor(opts)) {
            throw 'Invalid Wallet Constructor parameters values.';
        }
        this.options = opts;
    }
    /**
     * Private function used to initialize ZKWallet. There are some actions that have to be executed for new wallet:
     * Connect ethers wallet to provider, create new ZkWallet instance using Zk Provider.
     * @returns Returns true or throws an error.
     */
    _init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.address = this.ethersWallet.address;
            this.privateKey = this.ethersWallet.privateKey;
            this.ethersWallet = this.ethersWallet.connect(this.zkEthProvider);
            console.time('fromEthSigner');
            this.zkWallet = yield zksync.Wallet.fromEthSigner(this.ethersWallet, this.zkProvider);
            console.timeEnd('fromEthSigner');
            // console.log('DefaultFeeWallet PK: ', this.defaultAccountPK);
            if (!this.defaultAccountPK) {
                console.log('process.env.DEPOSIT_FEE_DEFAULT_ACCOUNT not defined');
                throw 'process.env.DEPOSIT_FEE_DEFAULT_ACCOUNT not defined';
            }
            this.ethersWalletFee = new ethers.Wallet(this.defaultAccountPK);
            this.ethersWalletFee = this.ethersWalletFee.connect(this.zkEthProvider);
            this.zkDefaultFeeWallet = yield zksync.Wallet.fromEthSigner(this.ethersWalletFee, this.zkProvider);
        });
    }
    /**
     * Disconnects provider from checking for events. Should be used to make sure that process can properly exit.
     */
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.zkProvider.disconnect();
            if (this.zkEthProvider.destroy) {
                yield this.zkEthProvider.destroy();
            }
        });
    }
    /**
     * Transfers ETH on L1 network. User has to have enough ETH to pay for gas.
     * @param to L1 address for which transfer will be executed
     * @param amount transfer amount
     * @param gasprice in wei to use for transfer transaction. Optional.
     * @returns Promise resolved to ethers.ContractReceipt or throws an error
     */
    initWallet(_ethersWallet, defaultAccountPK, zkEthProvider, zkProvider) {
        return __awaiter(this, void 0, void 0, function* () {
            this.zkEthProvider = zkEthProvider;
            this.zkProvider = zkProvider;
            this.defaultAccountPK = defaultAccountPK;
            this.ethersWallet = _ethersWallet;
            yield this._init();
        });
    }
}
exports.default = InitWallet;
