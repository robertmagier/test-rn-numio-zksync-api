import '@ethersproject/shims';
import * as ethers from 'ethers';
import * as zksync from './zksync-config';
import BaseWallet from './basewallet.js';
import * as Numio from './numio-types';
import axios from 'axios';
import { ChangePubKeyFee, ChangePubkeyTypes } from 'zksync/build/types';

export default class FeesWallet extends BaseWallet {
    constructor(opts: Numio.ZkWallet.Constructor) {
        super(opts);
    }

    async verifyFee(fee: string, amount: string, token: string, signingFee?: string): Promise<any> {
        let balance = await this.zkWallet.getBalance(token);
        balance = ethers.BigNumber.from(balance);
        signingFee = signingFee ? signingFee : '0';
        let expected = ethers.BigNumber.from(amount);
        expected = expected.add(fee).add(signingFee);
        if ((await balance).lt(expected)) {
            console.log(`Not enough balance.Expected:${expected.toString()}`);
            console.log('Fee:', fee);
            console.log('Signing Fee: ', signingFee.toString());
            console.log(`Got Balance:                        ${balance.toString()}`);
            console.log(`Missing:                    ${expected.sub(balance).toString()}`);
            throw `Not enough balance`;
        }
    }

    protected async _getGasNowGasPrice() {
        const url = 'https://www.gasnow.org/api/v3/gas/price?utm_source=:Numio';
        try {
            const result = await axios.get(url, { timeout: 5000 });
            return result.data.data.fast;
        } catch (e) {
            console.log('_getGasNowGasPrice() url: ', url, ' error:', e.message);
            return ethers.BigNumber.from(4 * 10 ** 10);
        }
    }

    public async getGasPrice() {
        const url = 'https://www.gasnow.org/api/v3/gas/price?utm_source=:Numio';
        try {
            const result = await axios.get(url, { timeout: 5000 });
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
        } catch (e) {
            throw 'nowGasPrice() url: ' + url + ' error: ' + e.message;
        }
    }
    public async _establishGasPrice(_requiredGasPrice: ethers.BigNumberish) {
        if (_requiredGasPrice === undefined) {
            throw 'Gas Price undefined';
        }

        if (parseInt(_requiredGasPrice.toString()) == 0) {
            throw 'Gas price is 0';
        }

        return _requiredGasPrice.toString();
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
    checkFee(fee: string): string {
        if (fee === undefined) throw 'Fee value is undefined';
        const feeBN = ethers.BigNumber.from(fee);
        const packableAmount = zksync.utils.closestPackableTransactionFee(feeBN);
        return packableAmount.toString();
    }

    /**
     * Calculates closest packable to 5 bytes value
     * @param  amount fee to calculate packable value for. Must  be a string or BigNumber
     * @returns amount:string packable to 5 bytes
     */
    checkAmount(amount: ethers.BigNumberish): string {
        if (amount === undefined) throw 'Amount value is undefined';
        const value: any = amount;
        let amountBN;
        if (value._isBigNumber || typeof value == 'string') {
            amountBN = ethers.BigNumber.from(amount);
        } else throw 'Amount must be a string or a BigNumber';

        const packableAmount = zksync.utils.closestPackableTransactionAmount(amountBN);
        return packableAmount.toString();
    }
    /**
     * Returns fee amount required to make a transfer from L2 to L2
     * @param to L2 address for which transfer will be executed
     * @param token token for which transfer will be executed
     * @returns Promise resolved to ethers.BigNumber or throws an error
     */
    async getTransferFee(to: string, token: string): Promise<ethers.BigNumberish> {
        try {
            const fee = await this.zkProvider.getTransactionFee('Transfer', to, token);
            return fee.totalFee;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Returns fee amount required to make a transfer from L2 to L2
     * @param to L2 address for which transfer will be executed
     * @param token token for which transfer will be executed
     * @returns Promise resolved to ethers.BigNumber or throws an error
     */
    async getETHFee(to: string, type: 'Transfer' | 'Withdraw' | 'FastWithdraw'): Promise<ethers.BigNumberish> {
        const feeToken = 'ETH';
        try {
            const txTypes: Array<any> = [type, 'Transfer'];
            const toArray = [to, to];
            const fee = await this.zkProvider.getTransactionsBatchFee(txTypes, toArray, feeToken);
            return fee;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Returns fee amount required to make a transfer from L2 to L2
     * @param to L2 address for which transfer will be executed
     * @param token token for which transfer will be executed
     * @returns Promise resolved to ethers.BigNumber or throws an error
     */
    async getSigningFee(token: string): Promise<ethers.BigNumberish> {
        try {
            const txType: ChangePubKeyFee = <ChangePubKeyFee>{};
            txType.ChangePubKey = <ChangePubkeyTypes>'ECDSA';
            // const txType: any = 'ChangePubKey';
            // const fee = await this.zkProvider.getTransactionFee(txType, this.address, token);
            const fee = await this.zkProvider.getTransactionFee(txType, this.address, token);
            return fee.totalFee;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Returns fee amount required to make a withdrawal from L2 to L1
     * @param to L1 address to which withdrawal will be executed.
     * @param token token for which withdrawal will be executed
     * @returns Promise resolved to ethers.BigNumber or throws an error
     */
    async getWithdrawFee(to: string, token: string): Promise<ethers.BigNumber> {
        try {
            const fee = await this.zkProvider.getTransactionFee('Withdraw', to, token);
            console.log(fee);
            for (let i = 0; i < Object.keys(fee).length; i++) {
                console.log(Object.keys(fee)[i], fee[Object.keys(fee)[i]].toString());
            }
            return fee.totalFee;
        } catch (e) {
            throw e;
        }
    }
}
