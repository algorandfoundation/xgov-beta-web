import { AlgorandClient as AC } from '@algorandfoundation/algokit-utils'
import algosdk from 'algosdk'
import { ClientManager } from '@algorandfoundation/algokit-utils/types/client-manager'

export const indexer = ClientManager.getIndexerClient({
    server: import.meta.env.PUBLIC_INDEXER_SERVER,
    port: import.meta.env.PUBLIC_INDEXER_PORT,
    token: import.meta.env.PUBLIC_INDEXER_TOKEN,
});

export const algod = ClientManager.getAlgodClient({
    server: import.meta.env.PUBLIC_ALGOD_SERVER,
    port: import.meta.env.PUBLIC_ALGOD_PORT,
    token: import.meta.env.PUBLIC_ALGOD_TOKEN,
});

export const kmd: algosdk.Kmd | undefined = import.meta.env.PUBLIC_NETWORK === 'LocalNet'
    ? ClientManager.getKmdClient({
        server: import.meta.env.PUBLIC_KMD_SERVER,
        port: import.meta.env.PUBLIC_KMD_PORT,
        token: import.meta.env.PUBLIC_ALGOD_TOKEN,
    })
    : undefined;

export const Algorand = AC.fromClients({ algod, indexer, kmd })