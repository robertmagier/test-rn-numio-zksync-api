import '@ethersproject/shims';
import * as ethers from 'ethers';
import * as zksync from './zksync-config';
import * as Numio from './numio-types';
import axios from 'axios';
import FeesWallet from './feeswallet.js';

const DEFAULT_FEE_TOKEN = 'USDC';
const IERC20_INTERFACE = zksync.utils.IERC20_INTERFACE;
const MAX_ERC20_APPROVE_AMOUNT = zksync.utils.MAX_ERC20_APPROVE_AMOUNT;

export default class UtilsWallet extends FeesWallet {
    constructor(opts: Numio.ZkWallet.Constructor) {
        super(opts);
    }

    /**
     * Returns current state of an ZK Account.
     * @returns Promise resolved to zksync.types.AccountState or throws an error
     */
    async getState(): Promise<zksync.types.AccountState> {
        const state = await this.zkWallet.getAccountState();
        return state;
    }

    getTokenSet() {
        return this.zkProvider.tokenSet;
    }

    _mainZkContract(ethersWallet): ethers.Contract {
        const contract = new ethers.Contract(
            this.zkProvider.contractAddress.mainContract,
            zksync.utils.SYNC_MAIN_CONTRACT_INTERFACE,
            ethersWallet,
        );
        return contract;
    }

    async isTokenApproved(token: string): Promise<boolean> {
        const approved = await this.zkWallet.isERC20DepositsApproved(token);
        return approved;
    }

    protected async _approveToken(
        token: string,
        txOptions?: any,
        amount: ethers.BigNumberish = MAX_ERC20_APPROVE_AMOUNT,
    ): Promise<any> {
        if (token == 'ETH') {
            throw Error('ETH token does not need approval.');
        }
        const tokenAddress = await this._tokenAddress(token);
        const erc20contract = new ethers.Contract(tokenAddress, IERC20_INTERFACE, this.ethersWallet);

        let gasPrice, nonce;

        if (txOptions && txOptions.gasPrice) {
            gasPrice = txOptions.gasPrice;
        } else {
            throw 'Gas price for approval is not provided';
        }

        if (txOptions && txOptions.nonce) {
            nonce = txOptions.nonce;
        } else {
            nonce = await this.zkEthProvider.getTransactionCount(this.address, 'pending');
        }
        console.log('Approve nonce:', nonce);
        const opts = {
            gasPrice,
            nonce,
        };
        return await erc20contract.approve(this.zkProvider.contractAddress.mainContract, amount, opts);
    }

    async approveDefaultFeeToken(token: string): Promise<any> {
        // await this.initZkSyncCrypto();
        try {
            const tx = await this.zkDefaultFeeWallet.approveERC20TokenDeposits(token);
            const receipt = await tx.wait();
            return { tx, receipt };
        } catch (e) {
            throw e;
        }
    }
}
