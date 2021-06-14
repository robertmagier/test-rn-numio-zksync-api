import '@ethersproject/shims';
import * as ethers from 'ethers';
import * as Numio from './numio-types';
import * as Verify from './verify.js';
import * as zksync from './zksync-config';
import crypto from 'crypto';
import APIOptions from './apioptions.js';
import NumioZkWallet from './wallet.js';
import Wallet from './wallet.js';

const tokenListAll = { rinkeby: [], main: [] };
// const zksync = require('@teamnumio/zksync')
const EC_GROUP_ORDER = Buffer.from('fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141', 'hex');
const ZERO32 = Buffer.alloc(32, 0);
/**
 * NumioZKSyncApi class to create new ZK Wallet to execute transactions on L2 network: deposit, withdrawal, transfer.
 * It allows to calculate fees and check state and balance.
 */
class NumioZKSyncAPI {
    private options: any = {};
    private zkEthProvider: any;
    private zkProvider: zksync.Provider;
    private randomWallet: any;
    defaultAccountPK: string;
    tokenSet: any;
    useWss: boolean;

    /**
     * NumioZksyncAPI constructor. Requires list of options describing connection addresses for Zk Serevr and Eth Provider.
     * @param connectioNode it defines which connection addresses to use: privateWss, privateHtpps, rinkebyHttps, rinkebyWss
     */

    constructor(connectionNode: string, defaultAccountPK: string) {
        let opts;

        if (!defaultAccountPK) {
            throw 'Default Fee Account PK is undefined';
        } else {
            this.defaultAccountPK = defaultAccountPK;
        }

        if (connectionNode == 'rinkebyHttps') {
            opts = APIOptions.rinkebyHttps;
        } else if (connectionNode == 'mainHttps') {
            opts = APIOptions.mainHttps;
        } else {
            throw 'Connection node value must be one of: mainHttps, rinkebyHttps';
        }

        // This PK is used to be able to ask for balances of other users. We should never use it for anything else.
        // It is used to avod using ethers.Wallet.createRandom function which is slow on react-native
        const RANDOMPK = '0x6d4b86a873a1a4d73b4f5b5af702a9a68617c9eb0dab2152ec77c6e92199aa55';
        this.randomWallet = new ethers.Wallet(RANDOMPK);
        this.options = Object.assign(this.options, opts);
    }

    isScalar(x) {
        return Buffer.isBuffer(x) && x.length === 32;
    }

    private isValidPrivateKey(_pk) {
        if (!this.isScalar(_pk)) {
            return false;
        }
        return (
            _pk.compare(ZERO32) > 0 && _pk.compare(EC_GROUP_ORDER) < 0 // > 0
        ); // < G
    }

    private generatePrivateKey() {
        let privateKey = crypto.randomBytes(32);
        while (!this.isValidPrivateKey(privateKey)) {
            privateKey = crypto.randomBytes(32);
        }
        return '0x' + privateKey.toString('hex');
    }

    async init() {
        await this._connectEthProvider();
        await this._connectZkProvider();
        this.randomWallet = await this.randomWallet.connect(this.zkEthProvider);
    }
    /**
     * Returns balance on Ethereum network (L1). Will throw an error when token parameter is undefined or null.
     * @param token token to check balance for
     * @returns Promise resolved to ethers.BigNumber or throws an error
     */
    async getEthereumBalance(token: string, account: string): Promise<ethers.BigNumber> {
        this._checkInit();
        let tokenAddress;

        if (token === undefined || token === null) {
            throw 'getEthereumBalance: token undefined or null';
        }

        if (account === undefined) {
            throw 'Account address undefined';
        }

        if (token == 'ETH') {
            const balance = await this.zkEthProvider.getBalance(account);
            return balance;
        } else if (token == 'MIA') {
            tokenAddress = '0xf598497B8067964F469c33A3bEF2d5Efe96F8750';
        } else {
            tokenAddress = this.zkProvider.tokenSet.resolveTokenAddress(token);
        }

        try {
            const erc20contract = new ethers.Contract(
                tokenAddress,
                <any>zksync.utils.IERC20_INTERFACE,
                this.randomWallet,
            );
            const balance = await erc20contract.balanceOf(account);
            return balance;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Returns balance on ZKSync network (L2). Will throw an error when token parameter is undefined or null.
     * @param token token to check balance for
     * @param account? account address to check balance for. Optional. If not used then this wallet balance will be returned.
     * @returns Promise resolved to ethers.BigNumber or throws an error
     */
    // TODO: I think we should create another function to check balance of another account. This is a bit misleading. Maybe it should be moved to zksyncapi.
    async getZkSyncBalance(token: string, account: string): Promise<ethers.BigNumberish> {
        this._checkInit();
        if (token === undefined || token === null) {
            throw 'getZkSyncBalance: token undefined or null';
        }
        const state = await this.zkProvider.getState(account);
        const balance = state.committed.balances[token];
        if (balance === undefined) {
            return '0';
        } else {
            return balance;
        }
    }

    /**
     * Returns erc20 contract address of a token
     * @param tokenSymbol - symbol of a token to find an address for.
     */
    protected async _tokenAddress(tokenSymbol: string) {
        const network = this.options.zkEthNetwork;
        if (tokenSymbol == 'MIA' || tokenSymbol == '0xf598497B8067964F469c33A3bEF2d5Efe96F8750') {
            return '0xf598497B8067964F469c33A3bEF2d5Efe96F8750';
        } else {
            try {
                const adr = this.zkProvider.tokenSet.resolveTokenAddress(tokenSymbol);
                return adr;
            } catch (e) {
                console.log(tokenSymbol + ' token not supported on L2');

                const tokenList = network == 'rinkeby' ? tokenListAll.rinkeby : tokenListAll.main;

                const el = tokenList.find(e => e.symbol == tokenSymbol);
                if (el) {
                    return el.address;
                } else {
                    throw tokenSymbol + ' not supported on L1 and L2';
                }
            }
        }
    }

    async getL1Balances(tokens: Array<string>, account?: string): Promise<any> {
        if (tokens.length == 0) throw 'Expecting array of tokenSymbols';
        const self = this;
        return new Promise((resolve, reject) => {
            const result = {};
            const expectedCount = tokens.length;
            let count = 0;
            for (let i = 0; i < tokens.length; i++) {
                const symbol = tokens[i];
                const balance = self
                    .getEthereumBalance(symbol, account)
                    .then(res => {
                        result[symbol] = res.toString();
                        count = count + 1;
                    })
                    .catch(e => {
                        result[symbol] = null;
                        count = count + 1;
                    });
            }
            const interval = setInterval(() => {
                // console.log('Checking:', count, 'Expected:', expectedCount);
                if (count >= expectedCount) {
                    clearInterval(interval);
                    resolve(result);
                }
            }, 1000);
        });
    }

    async getL2Balances(tokens: Array<string>, account: string): Promise<any> {
        if (tokens.length == 0) throw 'Expecting array of tokenSymbols';
        const result = {};

        return new Promise((resolve, reject) => {
            let count = 0;
            const expectedCount = tokens.length;

            for (let i = 0; i < tokens.length; i++) {
                const symbol = tokens[i];
                this.getZkSyncBalance(symbol, account)
                    .then(res => {
                        result[symbol] = res.toString();
                        count++;
                    })
                    .catch(e => {
                        result[symbol] = null;
                        count++;
                    });
            }
            const interval = setInterval(() => {
                // console.log('Checking:', count, 'Expected:', expectedCount);
                if (count >= expectedCount) {
                    clearInterval(interval);
                    resolve(result);
                }
            }, 1000);
        });
    }

    private async _connectEthProvider(counter = 0) {
        console.time('ConnectETH');
        const self = this;
        const network = this.options.zkEthNetwork;

        return new Promise((resolve, reject) => {
            const maxCounter = 10;
            const timeToWait = 200 * counter;
            counter = counter + 1;
            setTimeout(async function() {
                try {
                    console.log('Network:', network);
                    if (network == 'homestead') {
                        self.zkEthProvider = new ethers.providers.InfuraProvider(network, {
                            projectId: self.options.zkEthAccessKey,
                            projectSecret: '773ccb58aaa7403e9312b1ccfacd3e9a',
                        });
                        // self.zkEthProvider = new ethers.providers.Web3Provider(self.options.zkHttpEthAddress, 1);
                    } else if (network == 'rinkeby') {
                        // self.zkEthProvider = new ethers.providers.Web3Provider(self.options.zkHttpEthAddress, 4);
                        self.zkEthProvider = new ethers.providers.InfuraProvider(network, {
                            projectId: self.options.zkEthAccessKey,
                            projectSecret: '773ccb58aaa7403e9312b1ccfacd3e9a',
                        });
                    } else {
                        throw 'Wrong network name';
                    }
                    console.timeEnd('ConnectETH');
                    resolve(true);
                } catch (e) {
                    console.log(
                        "Error: Can't connect to ETH Provider. ",
                        `${counter}/${maxCounter}  Timeout: ${timeToWait} ms`,
                    );
                    console.log(e);
                    if (counter >= maxCounter) {
                        console.timeEnd('ConnectETH');
                        reject("Can't connect to Ethereum Provider.Exiting...");
                    } else {
                        return await self._connectEthProvider(counter);
                    }
                }
            }, timeToWait);
        });
    }

    private async _connectZkProvider(counter = 0) {
        console.time('connectZk');
        const self = this;
        return new Promise((resolve, reject) => {
            const maxCounter = 10;
            const timeToWait = 100 * counter;
            counter = counter + 1;

            setTimeout(async function() {
                try {
                    const url = self.options.zkHttpAddress;
                    self.zkProvider = await zksync.Provider.newHttpProvider(url);
                    console.timeEnd('connectZk');
                    resolve(true);
                } catch (e) {
                    console.log(e);
                    console.log(
                        "Error: Can't connect to ZK Server. ",
                        `${counter}/${maxCounter} Timeout: ${timeToWait} ms`,
                    );
                    if (counter >= maxCounter) {
                        console.timeEnd('connectZk');
                        reject("Can't connect to ZK Server.Exiting...");
                    } else {
                        return await self._connectZkProvider(counter);
                    }
                }
            }, timeToWait);
        });
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
     * Calculates closest packable to 5 bytes value
     * @param  fee fee to calculate packable value for
     * @returns fee:string packable to 5 bytes
     */
    checkFee(fee: string): string {
        if (fee === undefined) throw 'Fee value is undefined';
        const feeBN = ethers.BigNumber.from(fee);
        const packableAmount = zksync.utils.closestPackableTransactionAmount(feeBN);
        return packableAmount.toString();
    }

    private _checkInit() {
        if (this.zkEthProvider === undefined || this.zkProvider === undefined) {
            throw 'ZKAPI instance to initialized. Call init() function to connect to providers';
        }
        return;
    }
    /**
     * Creates new ZkSync Wallet with random Private Key
     * @returns Promise resolved to NumioZkWallet instance
     */
    async createNew(): Promise<NumioZkWallet> {
        console.time('createNew2');
        this._checkInit();
        const _privateKey = await this.generatePrivateKey();
        const ethersWallet = new ethers.Wallet(_privateKey);
        const zkWallet = new Wallet(this.options);
        await zkWallet.initWallet(ethersWallet, this.defaultAccountPK, this.zkEthProvider, this.zkProvider);
        console.timeEnd('createNew2');
        return zkWallet;
    }

    /**
     * Creates new ZkSync Wallet with from provided mnemoonic and path
     * @param mnemonic mnemonic to create new NumioZkWallet instance
     * @param path path to create new NumioZkWallet Instance
     * @returns Promise resolved to Numio ZkSync Wallet instance
     */
    async createFromMnemonic(mnemonic: string, path: string): Promise<NumioZkWallet> {
        this._checkInit();
        const ethersWallet = ethers.Wallet.fromMnemonic(mnemonic, path);
        const zkWallet = new Wallet(this.options);
        await zkWallet.initWallet(ethersWallet, this.defaultAccountPK, this.zkEthProvider, this.zkProvider);

        return zkWallet;
    }

    /**
     * Creates new ZkSync Wallet with from Private Key
     * @param privateKey used to create NumioZkWallet instance
     * @returns Promise resolved to Numio ZkSync Wallet instance
     */
    async createFromPrivateKey(privateKey: string): Promise<NumioZkWallet> {
        console.time('createFromPrivateKey');
        this._checkInit();
        const ethersWallet = new ethers.Wallet(privateKey);
        const zkWallet = new Wallet(this.options);
        await zkWallet.initWallet(ethersWallet, this.defaultAccountPK, this.zkEthProvider, this.zkProvider);

        console.timeEnd('createFromPrivateKey');
        return zkWallet;
    }

    async createManyFromPrivateKey(PKs: string[]) {
        console.time('createManyFromPrivateKey');
        const wallets = [];
        if (PKs === undefined || PKs.length == 0) {
            throw 'Expecting array of private keys';
        }
        for (const pk of PKs) {
            const wallet = await this.createFromPrivateKey(pk);
            wallets.push(wallet);
        }
        console.timeEnd('createManyFromPrivateKey');
        return wallets;
    }
}

module.exports = NumioZKSyncAPI;
