import '@ethersproject/shims';
import * as ethers from 'ethers';
import * as Numio from './numio-types';
import * as zksync from './zksync-config';
import BigNumber from 'bignumber.js';
import ERC20_DEPOSIT_GAS_LIMITS from './erc20_limit.js';
import UtilsWallet from './utilswallet.js';

const DEFAULT_FEE_TOKEN = 'USDC';
const IERC20_INTERFACE = zksync.utils.IERC20_INTERFACE;
const MAX_ERC20_APPROVE_AMOUNT = zksync.utils.MAX_ERC20_APPROVE_AMOUNT;
const ETH_DEPOSIT_GAS_LIMIT = '90000';
// const ERC20_DEFAULT_DEPOSIT_GAS_LIMIT = zksync.utils.ERC20_RECOMMENDED_DEPOSIT_GAS_LIMIT;
const ERC20_DEFAULT_DEPOSIT_GAS_LIMIT = 190000;
// const GAS_LIMITS = zksync.utils.ERC20_RECOMMENDED_DEPOSIT_GAS_LIMIT;

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
    constructor(opts: Numio.ZkWallet.Constructor) {
        // console.log('Creating new wallet:', opts);
        // TODO: Change opts to only one parameter. We don't need zkProvider and zkEthProvider addresses anymore.
        // It will require to change also Verify.ZkWalletConstructor function and NumioZkWallet.Constructor type
        super(opts);
    }

    /**
     * Transfers ETH on L1 network. User has to have enough ETH to pay for gas.
     * @param to L1 address for which transfer will be executed
     * @param amount transfer amount
     * @param gasprice in wei to use for transfer transaction. Optional.
     * @returns Promise resolved to ethers.ContractReceipt or throws an error
     */
    async transferETH(to: string, amount: string, _gasPrice: string, verify = false): Promise<any> {
        const gasPrice = await this._establishGasPrice(_gasPrice);
        const nonce = await this.zkEthProvider.getTransactionCount(this.address, 'pending');

        const txData = {
            to: to,
            value: ethers.BigNumber.from(amount),
            gasPrice: ethers.BigNumber.from(gasPrice),
            nonce,
        };
        const tx = await this.ethersWallet.sendTransaction(txData);
        let receipt;
        if (verify) {
            receipt = await tx.wait();
        }
        return { receipt, tx };
    }

    async cancelL1ETHTransfer(hash: string, _gasPrice: string) {
        const result = await this._speedChangeETHTransfer(hash, _gasPrice, '0');
        return result;
    }

    async rushL1ETHTransfer(hash: string, _gasPrice: string) {
        const result = await this._speedChangeETHTransfer(hash, _gasPrice);
        return result;
    }

    async cancelL1TokenTransfer(hash: string, _gasPrice: string) {
        const result = await this._speedChangeTokenTransfer(hash, _gasPrice, '0');
        return result;
    }

    async rushL1TokenTransfer(hash: string, _gasPrice: string) {
        const result = await this._speedChangeTokenTransfer(hash, _gasPrice);
        return result;
    }

    async cancelDepositToken(hash: string, _gasPrice: string) {
        const result = await this._speedChangeDepositToken(hash, _gasPrice, '0');
        return result;
    }

    async rushDepositToken(hash: string, _gasPrice: string) {
        const result = await this._speedChangeDepositToken(hash, _gasPrice);
        return result;
    }

    async _speedChangeETHTransfer(hash: string, _gasPrice: string, newAmount?: string) {
        // const erc20Interface = new ethers.utils.Interface(<any>zksync.utils.IERC20_INTERFACE);
        const tx = await this.zkEthProvider.getTransaction(hash);
        if (tx == null) {
            throw '_speedChangeETHTransfer: Tx does not exist. Wrong hash or wait a bit. Hash:' + hash;
        }

        if (tx.confirmations > 0) {
            throw '_speedChangeETHTransfer: Tx is already mined. It is not possible to cancel it now. Hash:' + tx.hash;
        }

        const gasPrice = new BigNumber(tx.gasPrice.toString());

        if (gasPrice.gte(_gasPrice)) {
            throw 'cancelL1TokenTransfer: Gas price is too low. New gas price must be greater than existing tx.' +
                ' Old gas price: ' +
                gasPrice.toString() +
                ' New gas price: ' +
                _gasPrice;
        }

        const to = tx.to;
        const nonce = tx.nonce;
        let amount = tx.value;
        amount = newAmount ? newAmount : amount;

        const txData = {
            to: to,
            value: ethers.BigNumber.from(amount),
            gasPrice: ethers.BigNumber.from(_gasPrice),
            nonce,
        };
        const newTx = await this.ethersWallet.sendTransaction(txData);
        return { receipt: undefined, tx: newTx };
    }
    async _speedChangeTokenTransfer(hash: string, _gasPrice: string, newAmount?: string) {
        // const erc20Interface = new ethers.utils.Interface(<any>zksync.utils.IERC20_INTERFACE);
        const erc20Interface = zksync.utils.IERC20_INTERFACE;
        const tx = await this.zkEthProvider.getTransaction(hash);
        // if (tx == null) {
        //     throw '_speedChangeTokenTransfer: Tx does not exist. Wrong hash or wait a bit. Hash:' + hash;
        // }

        // if (tx.confirmations > 0) {
        //     throw '_speedChangeTokenTransfer: Tx is already mined. It is not possible to cancel it now. Hash:' + tx.hash;
        // }

        const decodedInput = erc20Interface.parseTransaction({ data: tx.data, value: tx.value });
        const name = decodedInput.name;
        if (name != 'transfer') {
            throw 'cancelL1TokenTransfer:Wrong tx hash. It is not transfer function hash';
        }

        const gasPrice = new BigNumber(tx.gasPrice.toString());

        if (gasPrice.gte(_gasPrice)) {
            throw 'cancelL1TokenTransfer: Gas price is too low. New gas price must be greater than existing tx.' +
                ' Old gas price: ' +
                gasPrice.toString() +
                ' New gas price: ' +
                _gasPrice;
        }
        const tokenAddress = tx.to;
        const nonce = tx.nonce;
        const to = decodedInput.args[0];

        const resolvedAdddress = await this._tokenAddress(tokenAddress);
        let amount = decodedInput.args[1];
        amount = newAmount ? newAmount : amount;

        const erc20contract = new ethers.Contract(tokenAddress, <any>zksync.utils.IERC20_INTERFACE, this.ethersWallet);
        const newTx = await erc20contract.transfer(to, amount, { nonce: nonce, gasPrice: _gasPrice });
        return { receipt: undefined, tx: newTx };
    }

    async txGasPrice(hash: string) {
        const tx = await this.zkEthProvider.getTransaction(hash);
        if (tx == null) {
            throw 'txGasPrice: Tx does not exist. Wrong hash or wait a bit. Hash:' + hash;
        }
        return tx.gasPrice.toString();
    }

    async _speedChangeDepositToken(hash: string, newGasPrice: string, newAmount?: string) {
        // const erc20Interface = new ethers.utils.Interface(<any>zksync.utils.IERC20_INTERFACE);
        const mainZkContract = this._mainZkContract(this.ethersWallet);

        const tx = await this.zkEthProvider.getTransaction(hash);
        if (tx == null) {
            throw 'cancelL1TokenTransfer: Tx does not exist. Wrong hash or wait a bit. Hash:' + hash;
        }

        if (tx.confirmations > 0) {
            throw 'cancelL1TokenTransfer: Tx is already mined. It is not possible to cancel it now. Hash:' + tx.hash;
        }

        const decodedInput = mainZkContract.interface.parseTransaction({ data: tx.data, value: tx.value });
        if (tx.to !== mainZkContract.address) {
            throw 'Wrong tx hash. It is not related to depositETH or depositToken functions. Hash: ' + tx.hash;
        }

        const name = decodedInput.name;
        let to, amount, tokenAddress;
        if (name == 'depositETH') {
            amount = decodedInput.value.toString();
            to = decodedInput.args[0];
        } else if (name == 'depositERC20') {
            tokenAddress = await this._tokenAddress(decodedInput.args[0]);
            amount = decodedInput.args[1];
            to = decodedInput.args[2];
        } else {
            throw '_speedChangeDepositToken: wrong tx function name. Should be either depositETH or depositERC20. Something is weirdly wrong...';
        }

        amount = newAmount ? newAmount : amount;

        const nonce = tx.nonce;
        const gasPrice = new BigNumber(tx.gasPrice.toString());

        if (gasPrice.gte(newGasPrice)) {
            throw 'cancelL1TokenTransfer: Gas price is too low. New gas price must be greater than existing tx.' +
                ' Old gas price: ' +
                gasPrice.toString() +
                ' New gas price: ' +
                newGasPrice;
        }

        if (name == 'depositETH') {
            let newTx;
            try {
                newTx = await mainZkContract.depositETH(to, { nonce: nonce, gasPrice: newGasPrice, value: amount });
                return { receipt: undefined, tx: newTx };
            } catch (e) {
                console.log(e);
            }
        } else if (name == 'depositERC20') {
            const ethTxOptions: any = {};
            ethTxOptions.nonce = nonce;
            ethTxOptions.gasPrice = newGasPrice;

            const depositData = {
                depositTo: to,
                token: tokenAddress,
                amount: amount,
                ethTxOptions,
            };
            let depositOperation;
            try {
                depositOperation = await this.zkWallet.depositToSyncFromEthereum(depositData);
            } catch (e) {
                console.log(e);
                throw e;
            }
            return { receipt: undefined, tx: depositOperation.ethTx };
        } else {
            return undefined;
        }

        return null;
    }
    /**
     * L1->L1 token transfer transaction. Sender needs to have enough ETH to pay for transaction.
     * @param tokenSymbol - token symbol of erc20 token contract to transfer. It will throw an error if token is not supported.
     * @param to  receiver address
     * @param amount number of tokens to transfer
     */
    async transferEthereumToken(
        tokenSymbol: string,
        to: string,
        amount: string,
        _gasPrice: ethers.BigNumberish,
        verify = false,
    ) {
        if (tokenSymbol === 'ETH') {
            throw 'Use transferETH function to transfer ETH. Not transferEthereumToken';
        }

        const gasPrice = await this._establishGasPrice(_gasPrice);
        const tokenAddress = await this._tokenAddress(tokenSymbol);
        const nonce = await this.zkEthProvider.getTransactionCount(this.address, 'pending');

        const tokenBalance = await this.getEthereumBalance(tokenSymbol);
        if (tokenBalance.lt(amount)) throw `Not enough ${tokenSymbol} tokens to execute transaction`;
        const erc20contract = new ethers.Contract(tokenAddress, <any>zksync.utils.IERC20_INTERFACE, this.ethersWallet);
        const estimate = await erc20contract.estimateGas.transfer(to, amount, { nonce: nonce });
        const ethBalance = await this.getEthereumBalance('ETH');
        const estimatedCost = estimate.mul(gasPrice);
        if (estimatedCost.gt(ethBalance)) {
            console.error('Estimated gas: ', estimatedCost.toString());
            console.error('Gas price: ', gasPrice.toString());
            throw 'transferEthereumToken: Not enough ETH to cover transaction cost';
        }

        const tx = await erc20contract.transfer(to, amount, { nonce: nonce });
        let receipt;
        if (verify) {
            receipt = await tx.wait();
        }
        return { receipt, tx };
    }
    /**
     * Transfer token or ETH from one account to another
     * @param to ethereum address of an account receiving tokens. Zksync address is same as ethereum one.
     * @param amount token amount to be transfered. Must be packable to 5 bytes.
     * @param token token symbol to be transfered. Use 'ETH' for ETH
     * @param fee Fee amount packable to 5 bytes.
     * @param verify set to true for function for to be verified by the zksync provers
     * @returns Promise resolved to Ethereum Transaction Receipt or throws an error
     */
    async transferToken(to: string, amount: string, token: string, fee: string, verify = false): Promise<any> {
        // await this.initZkSyncCrypto();

        if (fee === undefined) throw 'Fee is undefined';
        if (typeof fee != 'string') throw 'Fee is not a string';
        if (parseInt(fee) < 0) throw 'Fee is negative';
        if (parseInt(fee).toString() != fee) throw 'Fee must be a string representing integer value';

        // Check if signing key is set. If not then set it.

        const sigingKey = await this.isSigningKeySet();
        if (!sigingKey) await this.setSigningKey(token);

        // Check if there is enough balance to make a transfer fee + amount
        let balance = await this.zkWallet.getBalance(token);
        let expected = ethers.BigNumber.from(amount);
        expected = expected.add(fee);
        balance = ethers.BigNumber.from(balance);
        if ((await balance).lt(expected)) {
            console.log(`Not enough balance.Expected:${expected.toString()} Got: ${balance.toString()}`);
            throw `Not enough balance.Expected:${expected.toString()} Got: ${balance.toString()}`;
        }
        const transferData = {
            to,
            token,
            amount,
            fee,
        };

        let txReceipt;
        try {
            const transferTransaction = await this.zkWallet.syncTransfer(transferData);
            if (verify) {
                txReceipt = await transferTransaction.awaitVerifyReceipt();
            } else {
                txReceipt = null;
            }
            return { receipt: txReceipt, tx: transferTransaction };
        } catch (e) {
            console.log(e);
            throw e.jrpcError.message;
        }
    }

    /**
     * Transfer All tokens or ETH from one account to another. It will deduct sign fee and transfer fee and then transfer rest of it.
     * @param to ethereum address of an account receiving tokens. Zksync address is same as ethereum one.
     * @param token token symbol to be transfered. Use 'ETH' for ETH
     * @param maxFee max fee amount packable to 5 bytes. If current fee is greater
     * @param maxSignFee max sign fee amount packable to 5 bytes.
     * @param verify set to true for function for to be verified by the zksync provers
     * @returns Promise resolved to Ethereum Transaction Receipt or throws an error
     */
    async transferAllToken(to: string, token: string, maxFee: string, maxSignFee: string): Promise<any> {
        // check input parametrs. validation.
        if (maxFee === undefined) throw 'Fee is undefined';
        if (maxSignFee === undefined) throw 'Sign Fee is undefined';
        if (typeof maxFee != 'string') throw 'Fee is not a string';
        if (typeof maxSignFee != 'string') throw 'Sign Fee is not a string';

        if (parseInt(maxFee) < 0) throw 'Fee is negative';
        if (parseInt(maxSignFee) < 0) throw 'Sign Fee is negative';
        if (parseInt(maxFee).toString() != maxFee) throw 'Fee must be a string representing integer value';
        if (parseInt(maxSignFee).toString() != maxSignFee) throw 'Sign Fee must be a string representing integer value';

        // Check if signing key is set. If not then set it.
        const sigingKey = await this.isSigningKeySet();
        let signFee: any;

        // Calculate and check fees against their maximum values.
        if (!sigingKey) {
            signFee = await this.getSigningFee(token);
            signFee = new BigNumber(signFee.toString());
            console.log('Sign Fee: ', signFee.toString());
            console.log('Max Sign Fee: ', maxSignFee.toString());
            console.log(signFee.toString());
            if (signFee.gt(maxSignFee.toString())) {
                console.log(signFee.toString());
                throw 'Current sign fee is greater than expected. Max: ' +
                    maxSignFee +
                    ' Currents: ' +
                    signFee.toString();
            }
        } else {
            signFee = new BigNumber(0);
        }

        // Check transfer fee
        let fee: any = await this.getTransferFee(to, token);
        fee = new BigNumber(fee.toString());
        if (fee.gt(maxFee)) {
            throw 'Current transfer fee is greater than expected. Max: ' +
                maxFee.toString() +
                ' Current: ' +
                fee.toString();
        }

        // Check if there is enough balance to make a transfer fee + amount

        let balance: any = await this.zkWallet.getBalance(token);
        balance = new BigNumber(balance.toString());
        let maxAmount = balance.minus(fee);
        maxAmount = maxAmount.minus(signFee);

        if (maxAmount.lt(0)) {
            console.log('Transfer fee: ', fee.toString());
            console.log('Sign fee: ', signFee.toString());
            console.log('Balance:', balance.toString());
            throw 'Fee and sign Fee greater than current balance';
        }

        // EXECUTE TRANSACTIONS

        if (!sigingKey) {
            await this.setSigningKey(token);
        }

        const checkedAmount = this.checkAmount(maxAmount.toString());
        console.log('Transfer fee: ', fee.toString());
        console.log('Sign fee: ', signFee.toString());
        console.log('Balance:', balance.toString());
        console.log('Amount left :', maxAmount.toString());
        console.log('Amount check:', checkedAmount.toString());

        const transferData = {
            to,
            token,
            amount: checkedAmount.toString(),
            fee: fee.toString(),
        };

        console.log('Transfer data:', transferData);
        const amountLeft = new BigNumber(maxAmount.toString()).minus(checkedAmount.toString());

        try {
            const transferTransaction = await this.zkWallet.syncTransfer(transferData);
            return { transfered: checkedAmount.toString(), left: amountLeft.toString(), tx: transferTransaction };
        } catch (e) {
            console.log(e);
            throw e.jrpcError.message;
        }
    }

    /**
     * Transfer token or ETH from one account to another
     * @param to ethereum address of an account receiving tokens. Zksync address is same as ethereum one.
     * @param amount token amount to be transfered. Must be packable to 5 bytes.
     * @param token token symbol to be transfered. Use 'ETH' for ETH
     * @returns Promise resolved to Ethereum Transaction Receipt or throws an error
     */
    async transferTokenETHFee(to: string, amount: string, token: string): Promise<any> {
        if (token === 'ETH') {
            throw 'Use transferToken function to transfer ETH';
        }

        // await this.initZkSyncCrypto();

        // Check if signing key is set. If not then set it.

        const sigingKey = await this.isSigningKeySet();
        if (!sigingKey) await this.setSigningKey('ETH');

        // Check if there is enough balance to make a token transfer
        const feeBalance = await this.zkWallet.getBalance('ETH');
        const tokenBalance = await this.zkWallet.getBalance(token);

        const fee = await this.getETHFee(to, 'Transfer');

        if (feeBalance.lt(fee)) {
            console.log(`Not enough balance to cover fee. Expected:${fee.toString()} Got: ${feeBalance.toString()}`);
            throw `Not enough ETH balance to cover fee`;
        }

        if (tokenBalance.lt(amount)) {
            console.log(`Not enough balance make transfer. Expected:${amount} Got: ${tokenBalance.toString()}`);
            throw `Not enough ${token} balance to make a transfer`;
        }
        const state = await this.zkWallet.getAccountState();
        const nonce = state.committed.nonce;

        const tokenTransfer = { to, token, amount, fee: 0, nonce: nonce };
        const feeTransfer = { to, token: 'ETH', amount: 0, fee, nonce: nonce + 1 };

        try {
            const batchTransfer = await this.zkWallet.syncMultiTransfer([tokenTransfer, feeTransfer]);
            return { withdrawal: batchTransfer[0].txHash, fee: batchTransfer[1].txHash };
        } catch (e) {
            console.log(e);
            throw e.jrpcError.message;
        }
    }

    /**
     * L1->L1 Calculate token transfer gas cost.
     * @param tokenSymbol - token symbol of erc20 token contract to calculate transfer cost for. It will throw an error if token is not supported.
     * @param to  receiver address
     * @param amount number of tokens to transfer
     */
    async transferEthereumTokenCost(tokenSymbol: string, to: string, amount: string): Promise<ethers.BigNumberish> {
        if (tokenSymbol === 'ETH') {
            return '21000';
        }

        const tokenAddress = await this._tokenAddress(tokenSymbol);
        const tokenBalance = await this.getEthereumBalance(tokenSymbol);
        const nonce = await this.zkEthProvider.getTransactionCount(this.address, 'pending');

        if (tokenBalance.lt(amount))
            throw `Not enough ${tokenSymbol} tokens to execute transaction. Balance ${tokenBalance.toString()} Amount: ${amount.toString()}. Address: ${
                this.address
            }`;
        const erc20contract = new ethers.Contract(tokenAddress, <any>zksync.utils.IERC20_INTERFACE, this.ethersWallet);
        const value = ethers.BigNumber.from(amount);
        const estimate = await erc20contract.estimateGas.transfer(to, value, { nonce });
        return estimate;
    }

    async approveTokenCost(token: string) {
        const approved = await this.zkWallet.isERC20DepositsApproved(token);
        if (!approved) {
            if (token == 'ETH') {
                throw Error('ETH token does not need approval.');
            }
            const tokenAddress = await this._tokenAddress(token);
            const erc20contract = new ethers.Contract(tokenAddress, IERC20_INTERFACE, this.ethersWallet);
            const gasEstimate = await erc20contract.estimateGas.approve(
                this.zkProvider.contractAddress.mainContract,
                MAX_ERC20_APPROVE_AMOUNT,
            );
            return gasEstimate.toString();
        }
        return undefined;
    }

    // async depositTokenCost(to: string, _amount: string, _token: string): Promise<ethers.BigNumberish> {
    //     let mainZkContract;
    //     let amount = ethers.BigNumber.from(_amount);
    //     let token = _token;

    //     try {
    //         if (token == 'ETH') {
    //             mainZkContract = this._mainZkContract(this.ethersWallet);
    //             const gasEstimate = await mainZkContract.estimateGas.depositETH(to, { value: amount });
    //             return gasEstimate;
    //         } else {
    //             const approved = await this.zkWallet.isERC20DepositsApproved(token);

    //             if (!approved) {
    //                 const approved = await this.zkDefaultFeeWallet.isERC20DepositsApproved(DEFAULT_FEE_TOKEN);
    //                 if (!approved) {
    //                     throw `Wallet and Default Fee wallet are not approved for token ${token}. Can't calculate depositTokenCost`;
    //                 }
    //                 mainZkContract = this._mainZkContract(this.ethersWalletFee);
    //                 token = DEFAULT_FEE_TOKEN;
    //                 amount = ethers.BigNumber.from(120);
    //             } else {
    //                 mainZkContract = this._mainZkContract(this.ethersWallet);
    //             }
    //             const tokenAddress = await this._tokenAddress(token);
    //             const args = [tokenAddress, amount, to];
    //             const gasEstimate = await mainZkContract.estimateGas.depositERC20(...args);
    //             return gasEstimate;
    //         }
    //     } catch (e) {
    //         console.log(e);
    //         return ethers.BigNumber.from('0');
    //     }
    // }

    async depositTokenCost(to: string, _amount: string, _token: string): Promise<any> {
        let mainZkContract;
        const amount = ethers.BigNumber.from(_amount);
        const token = _token;
        const tokenAddress = await this._tokenAddress(token);

        if (token == 'ETH') {
            mainZkContract = this._mainZkContract(this.ethersWallet);
            const gasEstimate = await mainZkContract.estimateGas.depositETH(to, { value: amount });
            return gasEstimate;
        }

        if (ERC20_DEPOSIT_GAS_LIMITS[tokenAddress]) {
            return new BigNumber(ERC20_DEPOSIT_GAS_LIMITS[tokenAddress]);
        } else {
            {
                console.log('!!!! DEFAULT DEPOSIT GAS LIMIT !!!!');
                console.log('Token:', token, ' Addr:', tokenAddress);
                return new BigNumber(ERC20_DEFAULT_DEPOSIT_GAS_LIMIT);
            }
        }
    }

    /**
     * Deposits token from calling Wallet to ZkSync L2
     * @param to ethereum address of account receiving tokens
     * @param amount token amount to be transfered. Must be packable to 5 bytes.
     * @param token token symbol to be transfered. Use 'ETH' for ETH
     * @returns Promise resolved to Operation Receipt or throws an error
     */
    async depositToken(
        to: string,
        amount: string,
        token: string,
        _gasPrice: ethers.BigNumberish,
        gasLimit?: ethers.BigNumberish,
        verify = false,
        approve = true,
    ): Promise<any> {
        // await this.initZkSyncCrypto();

        const gasPrice = await this._establishGasPrice(_gasPrice);
        const initialNonce = await this.zkEthProvider.getTransactionCount(this.address, 'pending');
        let nonce = initialNonce;

        if (token !== 'ETH') {
            const approved = await this.zkWallet.isERC20DepositsApproved(token);
            if (!approved) {
                console.log(`${token} token transfer is not approved for this account. Approving.`);
                try {
                    const approveTx = await this._approveToken(token, { nonce: nonce, gasPrice: gasPrice });
                    console.log(approveTx);
                    await approveTx.wait();
                    nonce = nonce + 1;
                } catch (e) {
                    console.log('Approve function failed: ', e);
                    nonce = initialNonce;
                }
            }
        }
        // TODO: Check if it is possible to see gas feee and then check if there is enough ether to make a deposit
        const balance = await this.zkWallet.getEthereumBalance(token);
        const balanceBN = ethers.BigNumber.from(balance);
        if (balanceBN.lt(amount))
            throw `Too small ${token} balance to make a deposit.Balance:${balanceBN.toString()} Expected: ${amount.toString()}`;
        const amountBN = ethers.BigNumber.from(amount);

        const ethTxOptions: any = {};

        if (gasLimit) {
            ethTxOptions.gasLimit = ethers.BigNumber.from(gasLimit).toString();
        }

        if (gasPrice) {
            ethTxOptions.gasPrice = gasPrice;
        }

        ethTxOptions.nonce = nonce;

        const depositData = {
            depositTo: to,
            token: token,
            amount: amountBN,
            ethTxOptions,
        };
        let receipt, depositOperation;
        try {
            depositOperation = await this.zkWallet.depositToSyncFromEthereum(depositData);
        } catch (e) {
            console.log('Deposit function error: ', e);
            throw 'Despoit token tx error';
        }
        if (verify) {
            receipt = await depositOperation.awaitVerifyReceipt();
        } else {
            receipt = null;
        }
        return { receipt, tx: depositOperation.ethTx };
        // return depositOperation;
    }

    /**
     * Transfer All tokens or ETH from one account to another. It will deduct sign fee and transfer fee and then transfer rest of it.
     * @param to ethereum address of an account receiving tokens. Zksync address is same as ethereum one.
     * @param token token symbol to be transfered. Use 'ETH' for ETH
     * @param maxFee max fee amount packable to 5 bytes. If current fee is greater
     * @param maxSignFee max sign fee amount packable to 5 bytes.
     * @param verify set to true for function for to be verified by the zksync provers
     * @returns Promise resolved to Ethereum Transaction Receipt or throws an error
     */
    async withdrawAllToken(to: string, token: string, maxFee: string, maxSignFee: string): Promise<any> {
        // check input parametrs. validation.
        if (to === undefined) throw 'To address is undefined';
        if (maxFee === undefined) throw 'Fee is undefined';
        if (maxSignFee === undefined) throw 'Sign Fee is undefined';
        if (typeof maxFee != 'string') throw 'Fee is not a string';
        if (typeof maxSignFee != 'string') throw 'Sign Fee is not a string';

        if (parseInt(maxFee) < 0) throw 'Fee is negative';
        if (parseInt(maxSignFee) < 0) throw 'Sign Fee is negative';
        if (parseInt(maxFee).toString() != maxFee) throw 'Fee must be a string representing integer value';
        if (parseInt(maxSignFee).toString() != maxSignFee) throw 'Sign Fee must be a string representing integer value';

        // Check if signing key is set. If not then set it.
        const sigingKey = await this.isSigningKeySet();
        let signFee: any;

        // Calculate and check fees against their maximum values.
        if (!sigingKey) {
            signFee = await this.getSigningFee(token);
            signFee = new BigNumber(signFee.toString());
            console.log('Sign Fee: ', signFee.toString());
            console.log('Max Sign Fee: ', maxSignFee.toString());
            console.log(signFee.toString());
            if (signFee.gt(maxSignFee.toString())) {
                console.log(signFee.toString());
                throw 'Current sign fee is greater than expected. Max: ' +
                    maxSignFee +
                    ' Currents: ' +
                    signFee.toString();
            }
        } else {
            signFee = new BigNumber(0);
        }

        // Check transfer fee
        let fee: any = await this.getWithdrawFee(to, token);
        fee = new BigNumber(fee.toString());
        if (fee.gt(maxFee)) {
            throw 'Current transfer fee is greater than expected. Max: ' +
                maxFee.toString() +
                ' Current: ' +
                fee.toString();
        }

        // Check if there is enough balance to make a transfer fee + amount

        let balance: any = await this.zkWallet.getBalance(token);
        balance = new BigNumber(balance.toString());
        let maxAmount = balance.minus(fee);
        maxAmount = maxAmount.minus(signFee);

        if (maxAmount.lt(0)) {
            console.log('Transfer fee: ', fee.toString());
            console.log('Sign fee: ', signFee.toString());
            console.log('Balance:', balance.toString());
            throw 'Fee and sign Fee greater than current balance';
        }

        // EXECUTE TRANSACTIONS

        if (!sigingKey) {
            await this.setSigningKey(token);
        }

        const checkedAmount = this.checkAmount(maxAmount.toString());
        console.log('Transfer fee: ', fee.toString());
        console.log('Sign fee: ', signFee.toString());
        console.log('Balance:', balance.toString());
        console.log('Amount left :', maxAmount.toString());
        console.log('Amount check:', checkedAmount.toString());

        const state = await this.zkWallet.getAccountState();
        const nonce = state.committed.nonce;

        const withdrawalData = {
            ethAddress: to,
            token: token,
            amount: checkedAmount.toString(),
            fee: fee.toString(),
            nonce: nonce,
        };
        const amountLeft = new BigNumber(maxAmount.toString()).minus(checkedAmount.toString());

        try {
            const withdrawalTransaction = await this.zkWallet.withdrawFromSyncToEthereum(withdrawalData);
            return { transfered: checkedAmount.toString(), left: amountLeft.toString(), tx: withdrawalTransaction };
        } catch (e) {
            console.log(e);
            throw 'withdrawToken failed. Check error message above.';
        }
    }

    /**
     * Withdraws token from ZkSync Account (L2) to Ethereum Account (L1)
     * @param to ethereum address of an account receiving tokens. Zksync address is same as ethereum one.
     * @param amount token amount to be transfered. Must be packable to 5 bytes.
     * @param token token symbol to be withdrawn. Use 'ETH' for ETH
     * @param fee Fee amount packable to 5 bytes.
     * @returns Promise
     */
    async withdrawToken(to: string, amount: string, token: string, fee: string, verify = false): Promise<any> {
        if (to === undefined) throw 'To address is undefined';
        if (amount === undefined) throw 'Amount is undefined';
        if (token == undefined) throw 'Token is undefined';
        if (fee === undefined) throw 'Fee is undefined';
        if (typeof fee != 'string') throw 'Fee is not a string';
        if (parseInt(fee) < 0) throw 'Fee is negative';
        if (parseInt(fee).toString() != fee) throw 'Fee is not an integer';

        // Check if signing key is set. If not then set it.
        let signingFee;
        fee = (await this.getWithdrawFee(to, token)).toString();
        const sigingKey = await this.isSigningKeySet();

        if (!sigingKey) {
            signingFee = await this.getSigningFee(token);
            await this.verifyFee(fee, amount, token, signingFee);
            const res = await this.setSigningKey(token);
        } else {
            await this.verifyFee(fee, amount, token);
        }

        const state = await this.zkWallet.getAccountState();
        const nonce = state.committed.nonce;
        const withdrawalData = {
            ethAddress: to,
            token: token,
            amount: amount,
            fee: fee,
            nonce: nonce,
        };
        try {
            const withdrawalTransaction = await this.zkWallet.withdrawFromSyncToEthereum(withdrawalData);
            let txReceipt;
            if (verify) {
                txReceipt = await withdrawalTransaction.awaitVerifyReceipt();
            }
            return { receipt: txReceipt, tx: withdrawalTransaction };
        } catch (e) {
            console.log(e);
            throw 'withdrawToken failed. Check error message above.';
        }
    }

    /**
     * Withdraws token from ZkSync Account (L2) to Ethereum Account (L1)
     * @param to ethereum address of an account receiving tokens. Zksync address is same as ethereum one.
     * @param amount token amount to be transfered. Must be packable to 5 bytes.
     * @param token token symbol to be withdrawn. Use 'ETH' for ETH
     * @param fee Fee amount packable to 5 bytes.
     * @returns Promise
     */
    async withdrawTokenETHFee(to: string, amount: string, token: string): Promise<any> {
        if (to === undefined) throw 'To address is undefined';
        if (amount === undefined) throw 'Amount is undefined';
        if (token == undefined) throw 'Token is undefined';

        // Check if signing key is set. If not then set it.
        const sigingKey = await this.isSigningKeySet();
        if (!sigingKey) await this.setSigningKey('ETH');

        let fee = await this.getETHFee(to, 'Withdraw');
        fee = this.checkFee(fee.toString());
        // Check if there is enough balance to make a transfer fee + amount
        const tokenBalance = await this.zkWallet.getBalance(token);
        const feeBalance = await this.zkWallet.getBalance('ETH');

        if ((await tokenBalance).lt(amount)) {
            console.log(`Not enough balance to withdraw token.Expected:${amount.toString()}`);
            console.log(`Got:                        ${tokenBalance.toString()}`);
            throw `Not enough balance to cover transfer amount`;
        }

        if ((await feeBalance).lt(fee)) {
            console.log(`Not enough balance to pay withdraw fee.Expected:${fee.toString()}`);
            console.log(`Got:                        ${feeBalance.toString()}`);
            throw `Not enough balance to cover withdrawal fee`;
        }
        const state = await this.zkWallet.getAccountState();
        const nonce = state.committed.nonce;
        const withdrawData = {
            ethAddress: to,
            token: token,
            amount: amount,
            fee: '0',
            nonce,
        };

        const feeData = {
            to,
            token: 'ETH',
            amount: 0,
            fee: fee.toString(),
            nonce: nonce + 1,
        };

        const withdrawalSig = await this.zkWallet.signWithdrawFromSyncToEthereum(withdrawData);
        const feeSig = await this.zkWallet.signSyncTransfer(feeData);

        const batch = [
            { tx: withdrawalSig.tx, signature: withdrawalSig.ethereumSignature },
            { tx: feeSig.tx, signature: feeSig.ethereumSignature },
        ];
        const txHashes = await this.zkProvider.submitTxsBatch(batch);
        return { withdrawal: txHashes[0], fee: txHashes[1] };
    }
}
