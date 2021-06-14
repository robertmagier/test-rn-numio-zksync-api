import '@ethersproject/shims';
import * as ethers from 'ethers';
import * as Numio from './numio-types';
import UtilsWallet from './utilswallet.js';
/**
 * Zksync description
 */
export default class NumioZkWallet extends UtilsWallet {
    /**
     * NumioZkWallet constructor.
     * @param opts: list of options derived from zkSyncApi
     * @param zkEthProvider: ethers.Provider. Should be either JsonRPCProvider or WebSocketProvider
     * @param zkProvider: zksync.Provider. Should be zksync.Provider type.
     * @param zkSyncLib: zksync library. It is passed as a parameter from zksync api class because it is required to init zksync lib to load wasm.
     *
     */
    constructor(opts: Numio.ZkWallet.Constructor);
    /**
     * Transfers ETH on L1 network. User has to have enough ETH to pay for gas.
     * @param to L1 address for which transfer will be executed
     * @param amount transfer amount
     * @param gasprice in wei to use for transfer transaction. Optional.
     * @returns Promise resolved to ethers.ContractReceipt or throws an error
     */
    transferETH(to: string, amount: string, _gasPrice: string, verify?: boolean): Promise<any>;
    cancelL1ETHTransfer(hash: string, _gasPrice: string): Promise<{
        receipt: any;
        tx: ethers.ethers.providers.TransactionResponse;
    }>;
    rushL1ETHTransfer(hash: string, _gasPrice: string): Promise<{
        receipt: any;
        tx: ethers.ethers.providers.TransactionResponse;
    }>;
    cancelL1TokenTransfer(hash: string, _gasPrice: string): Promise<{
        receipt: any;
        tx: any;
    }>;
    rushL1TokenTransfer(hash: string, _gasPrice: string): Promise<{
        receipt: any;
        tx: any;
    }>;
    cancelDepositToken(hash: string, _gasPrice: string): Promise<{
        receipt: any;
        tx: any;
    }>;
    rushDepositToken(hash: string, _gasPrice: string): Promise<{
        receipt: any;
        tx: any;
    }>;
    _speedChangeETHTransfer(hash: string, _gasPrice: string, newAmount?: string): Promise<{
        receipt: any;
        tx: ethers.ethers.providers.TransactionResponse;
    }>;
    _speedChangeTokenTransfer(hash: string, _gasPrice: string, newAmount?: string): Promise<{
        receipt: any;
        tx: any;
    }>;
    txGasPrice(hash: string): Promise<any>;
    _speedChangeDepositToken(hash: string, newGasPrice: string, newAmount?: string): Promise<{
        receipt: any;
        tx: any;
    }>;
    /**
     * L1->L1 token transfer transaction. Sender needs to have enough ETH to pay for transaction.
     * @param tokenSymbol - token symbol of erc20 token contract to transfer. It will throw an error if token is not supported.
     * @param to  receiver address
     * @param amount number of tokens to transfer
     */
    transferEthereumToken(tokenSymbol: string, to: string, amount: string, _gasPrice: ethers.BigNumberish, verify?: boolean): Promise<{
        receipt: any;
        tx: any;
    }>;
    /**
     * Transfer token or ETH from one account to another
     * @param to ethereum address of an account receiving tokens. Zksync address is same as ethereum one.
     * @param amount token amount to be transfered. Must be packable to 5 bytes.
     * @param token token symbol to be transfered. Use 'ETH' for ETH
     * @param fee Fee amount packable to 5 bytes.
     * @param verify set to true for function for to be verified by the zksync provers
     * @returns Promise resolved to Ethereum Transaction Receipt or throws an error
     */
    transferToken(to: string, amount: string, token: string, fee: string, verify?: boolean): Promise<any>;
    /**
     * Transfer All tokens or ETH from one account to another. It will deduct sign fee and transfer fee and then transfer rest of it.
     * @param to ethereum address of an account receiving tokens. Zksync address is same as ethereum one.
     * @param token token symbol to be transfered. Use 'ETH' for ETH
     * @param maxFee max fee amount packable to 5 bytes. If current fee is greater
     * @param maxSignFee max sign fee amount packable to 5 bytes.
     * @param verify set to true for function for to be verified by the zksync provers
     * @returns Promise resolved to Ethereum Transaction Receipt or throws an error
     */
    transferAllToken(to: string, token: string, maxFee: string, maxSignFee: string): Promise<any>;
    /**
     * Transfer token or ETH from one account to another
     * @param to ethereum address of an account receiving tokens. Zksync address is same as ethereum one.
     * @param amount token amount to be transfered. Must be packable to 5 bytes.
     * @param token token symbol to be transfered. Use 'ETH' for ETH
     * @returns Promise resolved to Ethereum Transaction Receipt or throws an error
     */
    transferTokenETHFee(to: string, amount: string, token: string): Promise<any>;
    /**
     * L1->L1 Calculate token transfer gas cost.
     * @param tokenSymbol - token symbol of erc20 token contract to calculate transfer cost for. It will throw an error if token is not supported.
     * @param to  receiver address
     * @param amount number of tokens to transfer
     */
    transferEthereumTokenCost(tokenSymbol: string, to: string, amount: string): Promise<ethers.BigNumberish>;
    approveTokenCost(token: string): Promise<string>;
    depositTokenCost(to: string, _amount: string, _token: string): Promise<any>;
    /**
     * Deposits token from calling Wallet to ZkSync L2
     * @param to ethereum address of account receiving tokens
     * @param amount token amount to be transfered. Must be packable to 5 bytes.
     * @param token token symbol to be transfered. Use 'ETH' for ETH
     * @returns Promise resolved to Operation Receipt or throws an error
     */
    depositToken(to: string, amount: string, token: string, _gasPrice: ethers.BigNumberish, gasLimit?: ethers.BigNumberish, verify?: boolean, approve?: boolean): Promise<any>;
    /**
     * Transfer All tokens or ETH from one account to another. It will deduct sign fee and transfer fee and then transfer rest of it.
     * @param to ethereum address of an account receiving tokens. Zksync address is same as ethereum one.
     * @param token token symbol to be transfered. Use 'ETH' for ETH
     * @param maxFee max fee amount packable to 5 bytes. If current fee is greater
     * @param maxSignFee max sign fee amount packable to 5 bytes.
     * @param verify set to true for function for to be verified by the zksync provers
     * @returns Promise resolved to Ethereum Transaction Receipt or throws an error
     */
    withdrawAllToken(to: string, token: string, maxFee: string, maxSignFee: string): Promise<any>;
    /**
     * Withdraws token from ZkSync Account (L2) to Ethereum Account (L1)
     * @param to ethereum address of an account receiving tokens. Zksync address is same as ethereum one.
     * @param amount token amount to be transfered. Must be packable to 5 bytes.
     * @param token token symbol to be withdrawn. Use 'ETH' for ETH
     * @param fee Fee amount packable to 5 bytes.
     * @returns Promise
     */
    withdrawToken(to: string, amount: string, token: string, fee: string, verify?: boolean): Promise<any>;
    /**
     * Withdraws token from ZkSync Account (L2) to Ethereum Account (L1)
     * @param to ethereum address of an account receiving tokens. Zksync address is same as ethereum one.
     * @param amount token amount to be transfered. Must be packable to 5 bytes.
     * @param token token symbol to be withdrawn. Use 'ETH' for ETH
     * @param fee Fee amount packable to 5 bytes.
     * @returns Promise
     */
    withdrawTokenETHFee(to: string, amount: string, token: string): Promise<any>;
}
