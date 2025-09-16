import { Mutex } from "async-mutex";
import type { NFDProperties } from "@/api/nfd/avatar.ts";
import { network } from '../algorand';

export const BASE_NFD_API_URL = network === "testnet" ? "https://api.testnet.nf.domains" : "https://api.nf.domains";

const mutex = new Mutex();

function fetchNfd(nameOrID: string | bigint | number, init: RequestInit = {}) {
  return fetch(`${BASE_NFD_API_URL}/nfd/${nameOrID}`, init)
}

function fetchNfdReverseLookup(address: string, init: RequestInit = {}) {
  return fetch(`${BASE_NFD_API_URL}/nfd/lookup?address=${address}`, init)
}

function fetchNfdReverseLookups(addresses: string[], init: RequestInit = {}) {
  return fetch(`${BASE_NFD_API_URL}/nfd/lookup?address=${addresses.join("&address=")}`, init)
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type NFD = {
  appID: number,
  asaID: number,
  expired: false,
  nfdAccount: string,
  name: string,
  owner: string,
  depositAccount: string,
  properties: NFDProperties,
}

export async function getNFD(
  nameIDOrAddress: string | bigint | number,
  init: RequestInit = {},
): Promise<NFD> {
  return mutex.runExclusive(async () => {
    const isString = typeof nameIDOrAddress === 'string';
    const isNFD = !isString || nameIDOrAddress.includes('.algo');

    let r = isNFD
      ? await fetchNfd(nameIDOrAddress, init)
      : await fetchNfdReverseLookup(nameIDOrAddress as string, init);

    if (r.status === 404) {
      throw new Error("Not found")
    }

    if (r.status === 429) {
      const errRes = await r.json() as { secsRemaining?: number };
      console.log(
        `Rate limited, sleeping for ${errRes?.secsRemaining} seconds`,
      );
      await sleep((errRes?.secsRemaining || 1) * 1000 + 1000);
      console.log("Mutex Still Locked, trying again");
      r = isNFD
        ? await fetchNfd(nameIDOrAddress, init)
        : await fetchNfdReverseLookup(nameIDOrAddress as string, init);
    }

    if (r.status !== 200) {
      throw new Error("Something went wrong")
    }

    const data = await r.json()
    return isNFD ? data : data[nameIDOrAddress as string]
  })
}

export async function getNFDs(
  addresses: string[],
  init: RequestInit = {},
): Promise<{ [address: string]: NFD }> {
  return mutex.runExclusive(async () => {
    let r = await fetchNfdReverseLookups(addresses, init);
    if (r.status === 404) {
      throw new Error("Not found")
    }
    if (r.status === 429) {
      const errRes = await r.json() as { secsRemaining?: number };
      console.log(
        `Rate limited, sleeping for ${errRes?.secsRemaining} seconds`,
      );
      await sleep((errRes?.secsRemaining || 1) * 1000 + 1000);
      console.log("Mutex Still Locked, trying again");
      r = await fetchNfdReverseLookups(addresses, init);
    }

    if (r.status !== 200) {
      throw new Error("Something went wrong")
    }

    return await r.json()
  })
}