import { AlgorandClient as AC } from '@algorandfoundation/algokit-utils'
import algosdk from 'algosdk'
import { ClientManager } from '@algorandfoundation/algokit-utils/types/client-manager'

export const indexer = ClientManager.getIndexerClient({
    server: import.meta.env.PUBLIC_INDEXER_SERVER || 'http://localhost',
    port: import.meta.env.PUBLIC_INDEXER_PORT || '4002',
    token: import.meta.env.PUBLIC_INDEXER_TOKEN || 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
});

export const algod = ClientManager.getAlgodClient({
    server: import.meta.env.PUBLIC_ALGOD_SERVER || 'http://localhost',
    port: import.meta.env.PUBLIC_ALGOD_PORT || '4001',
    token: import.meta.env.PUBLIC_ALGOD_TOKEN || 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
});

export const kmd: algosdk.Kmd | undefined = import.meta.env.PUBLIC_NETWORK === 'LocalNet'
    ? ClientManager.getKmdClient({
        server: import.meta.env.PUBLIC_KMD_SERVER || 'http://localhost',
        port: import.meta.env.PUBLIC_KMD_PORT || '4002',
        token: import.meta.env.PUBLIC_ALGOD_TOKEN || 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    })
    : undefined;

export const AlgorandClient = AC.fromClients({ algod, indexer, kmd })
