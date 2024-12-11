import { create, type KuboRPCClient } from 'kubo-rpc-client'
import { map } from 'nanostores';

const client = create(new URL(`${import.meta.env.IPFS_SERVER}:${import.meta.env.IPFS_PORT}`));

export interface IPFSStore { client: KuboRPCClient; };

export const $ipfsStore = map<IPFSStore>({ client });