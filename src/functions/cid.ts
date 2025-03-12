import { MemoryBlockstore } from "blockstore-core";
import { importer } from "ipfs-unixfs-importer";
import { CID as cidParser} from 'multiformats/cid';

// Calculate CIDv1 hash of the entire file
export const cidFromFile = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer()
    const blockstore = new MemoryBlockstore()
    const content = new Uint8Array(arrayBuffer) 
    const hashBuffer = importer([{ content }], blockstore, { cidVersion: 1 });
    let cidString = ''
    for await (const { cid } of hashBuffer) {
      cidString = cid.toString()
    }

    return cidString
}

// Convert CID string to Uint8Array, which is needed for the declareCommittee call
export const cidStringToUInt8Array = (cidString: string) => {
      return cidParser.parse(cidString).bytes
}