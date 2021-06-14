import '@ethersproject/shims';
import * as ethers from 'ethers';
import * as Numio from './numio-types';
import * as zksync from './zksync-config';
import InitWallet from './initwallet';
export default class BaseWallet extends InitWallet {
    constructor(opts: Numio.ZkWallet.Constructor);
    /**
     * Checks signingKey is set for an account. It must be to execute transfer and withdrawal.
     * @returns Promise resolved to boolean. True if key is already set and false if it is not set.
     */
    isSigningKeySet(): Promise<boolean>;
    /**
     * Sets signing key for the zksync account. It will throw an error if account doesn't exist.
     * To create an account you have to first make a deposit or transfer from another account.
     * @returns Returns Promise resolved to boolean. False if it was not possible to set signing key or it was already set and true if signing key was set.
     */
    setSigningKey(feeToken: string): Promise<zksync.types.TransactionReceipt>;
    supportedTokens(): Promise<Array<string>>;
    /**
     * Returns erc20 contract address of a token
     * @param tokenSymbol - symbol of a token to find an address for.
     */
    protected _tokenAddress(tokenSymbol: string): Promise<any>;
    getL1Balances(tokens: Array<string>, account?: string): Promise<any>;
    getL2Balances(tokens: Array<string>, account?: string): Promise<any>;
    /**
     * Returns balance on Ethereum network (L1). Will throw an error when token parameter is undefined or null.
     * @param token token to check balance for
     * @returns Promise resolved to ethers.BigNumber or throws an error
     */
    getEthereumBalance(token: string, account?: string): Promise<ethers.BigNumber>;
    /**
     * Returns balance on Ethereum network (L1). Will throw an error when token parameter is undefined or null.
     * @param token token to check balance for
     * @returns Promise resolved to ethers.BigNumber or throws an error
     */
    getTokenDecimals(token: string): Promise<number>;
    /**
     * Returns balance on ZKSync network (L2). Will throw an error when token parameter is undefined or null.
     * @param token token to check balance for
     * @param account? account address to check balance for. Optional. If not used then this wallet balance will be returned.
     * @returns Promise resolved to ethers.BigNumber or throws an error
     */
    getZkSyncBalance(token: string, account?: string): Promise<ethers.BigNumberish>;
    /**
     * Function checks if an account exists on ZK Sync Network(L2). If account doesn't exist then it is not possible to make a transfer and withdrawal
     * @returns Returns Promise resolved to boolean. true if an account exist. false if it doesn't
     */
    exists(): Promise<boolean>;
    /**
     * Returns transactions history of an account within specified range. Will throw an error if account doesn't exist
     * @param start offset value. Specifies first transaction which should be retrieved. The newest transaction is 0.
     * @param range number of transactions to retrieve
     * @returns Array of transactions as type: Numio.ZkWallet.HistoryEntry
     */
    getTxHistory(start: number, range: number): Promise<{
        Withdraw: any[];
        Transfer: any[];
        Deposit: any[];
        ChangePubKey: any[];
        all: any[];
    }>;
    private _parseHistoryTx;
    /**
     * Returns transactions status and  additional information
     * @param txHash transaction hash. Must be internal zksync hash.
     * @returns Transaction Information.
     */
    getTxL2Status(txHash: string): Promise<zksync.types.TransactionReceipt>;
    /**
     * Returns transactions status and  additional information
     * @param txHash transaction hash. Must be L1 hash.
     * @returns Transaction Information.
     */
    getTxL1Status(txHash: string): Promise<any>;
}
