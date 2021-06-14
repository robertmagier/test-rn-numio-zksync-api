import '@ethersproject/shims';
import * as ethers from 'ethers';
import * as zksync from './zksync-config';
import * as Numio from './numio-types';
import FeesWallet from './feeswallet.js';
export default class UtilsWallet extends FeesWallet {
    constructor(opts: Numio.ZkWallet.Constructor);
    /**
     * Returns current state of an ZK Account.
     * @returns Promise resolved to zksync.types.AccountState or throws an error
     */
    getState(): Promise<zksync.types.AccountState>;
    getTokenSet(): zksync.utils.TokenSet;
    _mainZkContract(ethersWallet: any): ethers.Contract;
    isTokenApproved(token: string): Promise<boolean>;
    protected _approveToken(token: string, txOptions?: any, amount?: ethers.BigNumberish): Promise<any>;
    approveDefaultFeeToken(token: string): Promise<any>;
}
