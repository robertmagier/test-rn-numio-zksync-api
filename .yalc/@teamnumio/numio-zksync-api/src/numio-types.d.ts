// import * as ethers from 'ethers'
// import { AxiosResponse } from 'axios';

declare namespace Numio {
    namespace ZkWallet {
        interface Constructor {
            zkHttpAddress: string;
            zkHttpEthAddress: string;
            zkApi: string;
            zkEthNetwork;
            zkEthAccessKey;
        }
        interface HistoryEntry {
            tx_id: string;
            accountId: number;
            fee: string;
            amount: string;
            from: string;
            to: string;
            type: string;
            token: string;
            success: boolean;
            fail_reason: string;
            verified: boolean;
            commited: boolean;
            hash: string;
            eth_block: number;
            created_at: string;
            nonce: number;
        }
    }

    namespace ZKAPI {
        interface Constructor {
            zkWsAddress: string;
            zkHttpAddress: string;
            zkHttpEthAddress: string;
            zkWsEthAddress: string;
        }
    }
}

export = Numio;
