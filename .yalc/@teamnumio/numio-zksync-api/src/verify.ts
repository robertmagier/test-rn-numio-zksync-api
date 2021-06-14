import * as Numio from './numio-types';

export function apiConstructor(request: Numio.ZKAPI.Constructor): boolean {
    /**
     *
     */
    const name = 'numio-zksync-api constructor';
    let result = true;

    if (request.zkWsAddress === undefined && request.zkHttpAddress === undefined) {
        result = false;
        console.error(name, 'ZKSync server address is not defined:', request.zkWsAddress, ' ', request.zkHttpAddress);
    }

    return result;
}

export function zkWalletConstructor(request: Numio.ZkWallet.Constructor): boolean {
    const name = 'Wallet Constructor';
    let result = true;

    if (request.zkHttpAddress === undefined) {
        result = false;
        console.error(name, 'ZKSync server address is not defined:', request.zkHttpAddress);
    }

    if (request.zkEthNetwork === undefined || request.zkEthAccessKey == undefined) {
        result = false;
        console.error(
            name,
            'ZKSync Eth Provider connection data is undefined:',
            request.zkEthNetwork,
            request.zkEthAccessKey,
        );
    }

    return result;
}
