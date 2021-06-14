[![zkSync API CI pipeline](https://github.com/TeamNumio/numio-zksync-api/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/TeamNumio/numio-zksync-api/actions/workflows/ci.yml)

# NUMIO-ZKSYNC-API

## SERVER RE-INIT STEPS

    1. Login to zksync server node
    2. sudo systemctl stop zksync
    3. sudo systemctl stop zksync-prover
    4. zksync init
    5. sudo systemctl start zksync
    6. sudo systemctl start zksync-prover
    7. Done. Confirm that it works by executing zksync-server-logs and
        zksync-prover-logs to check logs for server and prover.

### API to communicate with ZKSYNC node. It depends on zksync module to work properly. It was developed to streamline the most common use cases of interaction with zksync node.

There are two layers in ZKSYNC.

-   L1 - this is normal Ethereum Blockchain network. Transactions between L1 are slow and expensive.
-   L2 - this ZKSYNC layer. State of an account is stored on ZKSYNC Smart Contract. Transactions between L2 accounts are faster and cheaper.

L1->L1 - transactions betwween L1 and L1 account. This is normal Ethereum transaction.

L2->L2 - transfer from one account to another on ZKSYNC node. Sender must exist on L2 layer.

L1->L2 - Transaction from L1 to L2. This is deposit. It is slow and expensive.

L2->L1 - Transaction from L2 to L1. This is withdrawal. It is slow and expensive.

Account address is same for L2 an L1 networks.

## <b>How to use it in the project</b>

Add this two lines to your global or project .npmrc file:

`//npm.pkg.github.com/:_authToken=${TOKEN}`
`@teamnumio:registry=https://npm.pkg.github.com`

The second line above requires you to provide github access token:
You can find more information about using github packages here:

https://docs.github.com/en/packages/using-github-packages-with-your-projects-ecosystem/configuring-npm-for-use-with-github-packages#authenticating-to-github-packages

-   Install npm module


    `npm install @teamnumio/numio-zksync-api`

-   Import module in your code

    `const ZKAPI = require('@teamnumio/numio-zksync-api')`

-   Create ZKAPI instance

<code>

    //Available zkServer values: privateHttps, privateWss, privateRinkebyHttps, rinkebyHttps, rinkebyWss
    const zkServer = 'rinkebyWss'
    zkSyncApi = new ZKAPI(zkServer);

</code>

## <b>Create ZK Wallet</b>

-   Create new wallet


    `zkWalletNew = await zkSyncApi.createNew();`

-   Create wallet from Private Key


    `zkWalletPK = await zkSyncApi.createFromPrivateKey('0xd58ae7852a6766194bd01c1526d823a7afcda8a4abeb7030e2bf80f30a49fb69');`

-   Create wallet from mnemonic and path

<code>

        var pathA = "m/44'/60'/0'/0/1";
        var mnemonic = 'next run impact minimum item plate orchard vehicle dance inform correct dutch';
        zkWalletMnemonic = await zkSyncApi.createFromMnemonic(mnemonic, pathA);

</code>

-   Check wallet address and Private Key

<code>

        zkWalletPK = await zkSyncApi.createFromPrivateKey(PK);
        console.log('Private Key:',zkWalletPK.privateKey)
        console.log('Account address:', zkWalletPK.address)

</code>

## <b>Deposit</b>

Deposit is L1->L2 transaction. It call Smart Contract function on L1 network. This means it is slow and expensive. There is no fee because transaction is paid by the user in gas. The important thing is that amount to be transfered must be packable to 5 bytes. This is limitation of ZKSYNC design. It is one of the reasons why transactions are cheaper.Example:
<code>

1111111111111111111111111111 - normal value

1111111111100000000000000000 - packable to 5 bytes

</code>

<code>

       let amount = '1111111111111111111111111111';
       let amountChecked = zkSyncApi.checkAmount(amount); //It will convert amount to 1111111111100000000000000000
       let token = 'ETH';
       await zkWalletPK.depositToken(zkWalletNew.address, amountChecked, token);

</code>

## <b>Transfer Token L2->L2</b>

Transfer is L2->L2 transaction. It is cheaper and fee is paid token being transfered. Amount must also be packable to 5 bytes (fee and transfer amount).
Account has to exist on ZK to be able to make a transfer. Account exists on ZK after making deposit or transfer from another account.

<code>

        let amount = '1111111111111111111111111111';
        let amountChecked = zkSyncApi.checkAmount(amount); //It will convert amount to 1111111111100000000000000000
        let fee = await zkWalletPK.getTransferFee(zkWalletNew.address, token); // this value will be packable to 5 bytes. No need to convert it.
        await zkWalletPK.transferToken(zkWalletNew.address, amountChecked, token, fee.toString())

</code>

## <b>Batch Transfer using ETH Fee Token L2->L2</b>

Transfer is L2->L2 transaction. It is cheaper and fee is paid token being transfered. Amount must also be packable to 5 bytes (fee and transfer amount).
Account has to exist on ZK to be able to make a transfer. Account exists on ZK after making deposit or transfer from another account. This function will use
batch transactions functionality on ZK Node and fees will be paid in ETH. It can be used on all tokens except ETH.

<code>

        let amount = '1111111111111111111111111111';
        let amountChecked = zkSyncApi.checkAmount(amount); //It will convert amount to 1111111111100000000000000000
        let fee = await zkWalletPK.getETHFee(zkWalletNew.address, 'Transfer'); // this will return ETH Fee for transfer transaction.
        //We can use getETHFee function to inform user what fee for transfer will be.
        await zkWalletPK.transferTokenETHFee(zkWalletNew.address, amountChecked, token) //We don't provide fee.
        //this function doesn't require fee to be provided
        // it will call getETHFuncion inside to get a fee.

</code>

## <b>Transfer Token L1->L1 </b>

This is an **L1** to **L1** transaction. This will execute transfer function of erc20 smart contract. Sender needs to have enough ETH to pay for transaction and
enough ERC20 balance to send it to the receiver. It will throw an error if token Symbol is not supported.

<code>

        let amount = '100';
        let to = zkWallet1.address;
        let tokenSymbol = 'DAI'
        await ownerZkWallet.transferEthereumToken(tokenSymbol, to, amount);

</code>

## <b>Transfer ETH L1->L1 </b>

This is an **L1** to **L1** transaction. This will execute ETH transfer. It will throw an error if user has not enough ETH to cover transfer amount and gas.

<code>

        let amount = '100000000000000000000';
        let to = zkWallet1.address
        let gasPrice = (10 ** 9).toString() //1 gwei
        await ownerZkWallet.transferETH(zkWallet1.address, amount, gasPrice);

</code>

## <b>Withdrawal</b>

Withdrawal is L2->L1 transaction. It is expensive because it has to be executed on L1. Fee are paid in token being transfered. Amount must also be packable to 5 bytes (fee and transfer amount). Account has to exist on ZK to be able to make a withdrawal. It is also necessary to set signing key to make a withdrawal. Account exists on ZK after making deposit or transfer from another account.

<code>

        let amount = '1111111111111111111111111111';
        let amountChecked = zkSyncApi.checkAmount(amount); //It will convert amount to 1111111111100000000000000000

        //There is a different function to check withdrawal fee than transfer fee.
        let fee = await zkWalletPK.getWithdrawFee(zkWalletNew.address, token); // this value will be packable to 5 bytes. No need to convert it.
        await zkWalletPK.withdrawToken(zkWalletNew.address, amountChecked, token, fee.toString())

</code>

## <b>Batch Withdrawal using ETH Fee</b>

Withdrawal is L2->L1 transaction. It is expensive because it has to be executed on L1. Fee are paid in ETH. Amount must also be packable to 5 bytes (fee and transfer amount). Account has to exist on ZK to be able to make a withdrawal. Account exists on ZK after making deposit or transfer from another account.

<code>

        let amount = '1111111111111111111111111111';
        let amountChecked = zkSyncApi.checkAmount(amount); //It will convert amount to 1111111111100000000000000000
        let fee = await zkWalletPK.getETHFee(zkWalletNew.address, 'Withdraw'); // this will return ETH Fee for transfer transaction.
        //We can use getETHFee function to inform user what fee for transfer will be.
        //There is a different function to check withdrawal fee than transfer fee.
        let result = await zkWalletPK.withdrawTokenETHFee(zkWalletNew.address, amountChecked, token)
        console.log('Withdrawal Tx Hash:',result.withdrawal)
        console.log('Fee Tx Hash:',result.fee)

        let status = await zkWalletPK.getTxL2Status(result.withdrawal)

</code>

## <b>Check Balance</b>

There are two types of balances:

-   L1 - normal balance on Ethereum Network
    You can check L1 balance by calling function:

    `let balanceL1 = await zkWalletPK.getEthereumBalance(tokenString)` //use 'ETH' for ETH or other token symbol supported by ZK Node.

-   L2 - balance of ZK Wallet account.

    `let balanceZk = await zkWalletPK.getZkSyncBalance(tokenString)` //use 'ETH' for ETH or other token symbol supported by ZK Node.

## <b>Get Transaction History</b>

You can get list of transaction related to the wallet. There are three types of transactions: Deposit, Withdraw and Transfer.
Function returns an object with 4 arrays: Deposit, Withdraw, Transfer and all. This is self explanatory.

<code>

        let startOffset = 0 // 0 - last executed transaction, 1 - second to last and so on.
        let range = 10 //range must a number greater than 0 and smaller or equal to 100
        let txHistory = await zkPkWallet.getTxHistory(0, 10);

        console.log('History of all types: ',txHistory.all)
        console.log('Deposit history: ',txHistory.Deposit)
        console.log('Withdraw history: ',txHistory.Withdraw)
        console.log('Transfer history: ',txHistory.Transfer)

</code>

Each history entry has the below structure:

<code>

        interface HistoryEntry {
            tx_id: string;  //internal zksync id
            accountId: number;
            fee: string;
            amount: string;
            from: string;
            to: string;
            type: string; // transaction type. Must be Transfer, Withdraw or Deposit
            token: string; // token symbol. ETH or DAI
            success: boolean;
            fail_reason: string;
            verified: boolean;
            commited: boolean;
            hash: string; /ethereum tx hash or zksync hash
            eth_block: number;
            created_at: string;
            nonce: number; //internal zksync nonce. It is not same as ethereum nonce.
        }

</code>

## <b>HOW TO GET TX HASH OF EACH TRANSACTION AND CHECK STATUS</b>

### DEPOSIT TOKEN (L1->L2)

<code>

        let res = await zkWallet.depositToken(to, amount, token)
        console.log('Deposit finished hash: ', res.tx.hash);
        let status = await zkWallet.getTxL1Status(res.tx.hash);
        if (status) {
        console.log('Deposit completed');
        }

</code>

### TRANSFER TOKEN (L1->L1)

<code>

        let res = await zkWallet.transferEthereumToken(tokenSymbol, address, amount)
        let status = await zkWallet.getTxL1Status(res.tx.hash)
        if (status) {
        console.log('Token Transfer completed');
        }

</code>

### TRANSFER ETH (L1->L1)

<code>

        let res = await zkWallet.transferETH(address, amount)
        let status = await zkWallet.getTxL1Status(res.tx.hash)
        if (status) {
        console.log('ETH Transfer completed');
        }

</code>

### TRANSFER TOKEN (L2->L2)

<code>

        let res = await zkWallet.transferToken(address, amount, token, fee)
        let status = zkWallet.getTxL2Status(res.tx.txHash)
        if(status.block && status.block.verified == true) {
                console.log('L2 Transfer completed');
        }

</code>

### BATCH TRANSFER TOKEN (L2->L2)

<code>

        let res = await zkWallet.transferTokenETHFee(address, amount, token)
        let status = zkWallet.getTxL2Status(res.withdrawal)
        if(status.block && status.block.verified == true) {
                console.log('Batch L2 Transfer completed');
        }

</code>

### WITHDRAW TOKEN (L2->L1)

<code>

        let res = await zkWallet.withdrawToken(address, amount, token, fee)
        let status = zkWallet.getTxL2Status(res.tx.txHash)
        if(status.block && status.block.verified == true) {
                console.log('Withdrawal completed');
        }

</code>

### BATCH WITHDRAW TOKEN (L2->L1)

<code>

        let res = await zkWallet.withdrawTokenETHFee(address, amount, token)
        let status zkWallet.getTxL2Status(res.withdrawal)
        if(status.block && status.block.verified == true) {
                console.log('Batch Withdrawal completed');
        }

</code>
