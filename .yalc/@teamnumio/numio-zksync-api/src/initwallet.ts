import '@ethersproject/shims';
import * as ethers from 'ethers';
import * as zksync from './zksync-config';
import * as Numio from './numio-types';
import * as Verify from './verify.js';

export default class InitWallet {
    protected zkWallet: zksync.Wallet;
    protected options: Numio.ZkWallet.Constructor;
    protected zkEthProvider: any;
    protected zkProvider: zksync.Provider;
    protected ethersWallet: ethers.Wallet;
    protected ethersWalletFee: ethers.Wallet;
    protected zkDefaultFeeWallet: zksync.Wallet;
    protected defaultAccountPK: string;
    public address: string;
    public privateKey: string;

    constructor(opts: Numio.ZkWallet.Constructor) {
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
    protected async _init() {
        this.address = this.ethersWallet.address;
        this.privateKey = this.ethersWallet.privateKey;
        this.ethersWallet = this.ethersWallet.connect(this.zkEthProvider);

        console.time('fromEthSigner');
        this.zkWallet = await zksync.Wallet.fromEthSigner(this.ethersWallet, this.zkProvider);
        console.timeEnd('fromEthSigner');

        // console.log('DefaultFeeWallet PK: ', this.defaultAccountPK);

        if (!this.defaultAccountPK) {
            console.log('process.env.DEPOSIT_FEE_DEFAULT_ACCOUNT not defined');
            throw 'process.env.DEPOSIT_FEE_DEFAULT_ACCOUNT not defined';
        }

        this.ethersWalletFee = new ethers.Wallet(this.defaultAccountPK);
        this.ethersWalletFee = this.ethersWalletFee.connect(this.zkEthProvider);
        this.zkDefaultFeeWallet = await zksync.Wallet.fromEthSigner(this.ethersWalletFee, this.zkProvider);
    }
    /**
     * Disconnects provider from checking for events. Should be used to make sure that process can properly exit.
     */
    public async disconnect() {
        await this.zkProvider.disconnect();
        if (this.zkEthProvider.destroy) {
            await this.zkEthProvider.destroy();
        }
    }
    /**
     * Transfers ETH on L1 network. User has to have enough ETH to pay for gas.
     * @param to L1 address for which transfer will be executed
     * @param amount transfer amount
     * @param gasprice in wei to use for transfer transaction. Optional.
     * @returns Promise resolved to ethers.ContractReceipt or throws an error
     */
    public async initWallet(
        _ethersWallet: ethers.Wallet,
        defaultAccountPK: string,
        zkEthProvider: any,
        zkProvider: any,
    ) {
        this.zkEthProvider = zkEthProvider;
        this.zkProvider = zkProvider;
        this.defaultAccountPK = defaultAccountPK;
        this.ethersWallet = _ethersWallet;

        await this._init();
    }
}
