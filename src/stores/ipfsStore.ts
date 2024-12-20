import { create } from 'kubo-rpc-client'

// new URL(`${import.meta.env.IPFS_SERVER}:${import.meta.env.IPFS_PORT}`)
export const IPFSClient = create();