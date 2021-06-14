import '@ethersproject/shims';
import * as ethers from 'ethers';
import * as zksync from './zksync-config';
import * as Numio from './numio-types';
export default class InitWallet {
    protected zkWallet: zksync.Wallet;
    protected options: Numio.ZkWallet.Constructor;
    protected zkEthProvider: any;
    protected zkProvider: zksync.Provider;
    protected ethersWallet: ethers.Wallet;
    protected ethersWalletFee: ethers.Wallet;
    protected zkDefaultFeeWallet: zksync.Wallet;
    protected defaultAccountPK: string;
    address: string;
    privateKey: string;
    constructor(opts: Numio.ZkWallet.Constructor);
    /**
     * Private function used to initialize ZKWallet. There are some actions that have to be executed for new wallet:
     * Connect ethers wallet to provider, create new ZkWallet instance using Zk Provider.
     * @returns Returns true or throws an error.
     */
    protected _init(): Promise<void>;
    /**
     * Disconnects provider from checking for events. Should be used to make sure that process can properly exit.
     */
    disconnect(): Promise<void>;
    /**
     * Transfers ETH on L1 network. User has to have enough ETH to pay for gas.
     * @param to L1 address for which transfer will be executed
     * @param amount transfer amount
     * @param gasprice in wei to use for transfer transaction. Optional.
     * @returns Promise resolved to ethers.ContractReceipt or throws an error
     */
    initWallet(_ethersWallet: ethers.Wallet, defaultAccountPK: string, zkEthProvider: any, zkProvider: any): Promise<void>;
}
