import '@ethersproject/shims';
import * as ethers from 'ethers';
import BaseWallet from './basewallet.js';
import * as Numio from './numio-types';
export default class FeesWallet extends BaseWallet {
    constructor(opts: Numio.ZkWallet.Constructor);
    verifyFee(fee: string, amount: string, token: string, signingFee?: string): Promise<any>;
    protected _getGasNowGasPrice(): Promise<any>;
    getGasPrice(): Promise<any>;
    _establishGasPrice(_requiredGasPrice: ethers.BigNumberish): Promise<string>;
    /**
     * Calculates closest packable to 5 bytes value
     * @param  fee fee to calculate packable value for
     * @returns fee:string packable to 5 bytes
     */
    checkFee(fee: string): string;
    /**
     * Calculates closest packable to 5 bytes value
     * @param  amount fee to calculate packable value for. Must  be a string or BigNumber
     * @returns amount:string packable to 5 bytes
     */
    checkAmount(amount: ethers.BigNumberish): string;
    /**
     * Returns fee amount required to make a transfer from L2 to L2
     * @param to L2 address for which transfer will be executed
     * @param token token for which transfer will be executed
     * @returns Promise resolved to ethers.BigNumber or throws an error
     */
    getTransferFee(to: string, token: string): Promise<ethers.BigNumberish>;
    /**
     * Returns fee amount required to make a transfer from L2 to L2
     * @param to L2 address for which transfer will be executed
     * @param token token for which transfer will be executed
     * @returns Promise resolved to ethers.BigNumber or throws an error
     */
    getETHFee(to: string, type: 'Transfer' | 'Withdraw' | 'FastWithdraw'): Promise<ethers.BigNumberish>;
    /**
     * Returns fee amount required to make a transfer from L2 to L2
     * @param to L2 address for which transfer will be executed
     * @param token token for which transfer will be executed
     * @returns Promise resolved to ethers.BigNumber or throws an error
     */
    getSigningFee(token: string): Promise<ethers.BigNumberish>;
    /**
     * Returns fee amount required to make a withdrawal from L2 to L1
     * @param to L1 address to which withdrawal will be executed.
     * @param token token for which withdrawal will be executed
     * @returns Promise resolved to ethers.BigNumber or throws an error
     */
    getWithdrawFee(to: string, token: string): Promise<ethers.BigNumber>;
}
