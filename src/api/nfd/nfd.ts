import { Mutex } from "async-mutex";
import type { NFDProperties } from "@/api/nfd/avatar.ts";
import { network } from '../algorand';

export const BASE_NFD_API_URL = network === "testnet" ? "https://api.testnet.nf.domains" : "https://api.nf.domains";

const mutex = new Mutex();

function fetchNfd(address: string, init: RequestInit = {}) {
  return fetch(`${BASE_NFD_API_URL}/nfd/lookup?address=${address}`, init)
}

function fetchNfds(addresses: string[], init: RequestInit = {}) {
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

export async function getNonFungibleDomainName(
  address: string,
  init: RequestInit = {},
): Promise<NFD> {
  return mutex.runExclusive(async () => {
    let r = await fetchNfd(address)
    if(r.status === 404) {
      throw new Error("Not found")
    }
    if(r.status === 429) {
      const errRes = await r.json() as { secsRemaining?: number };
      console.log(
        `Rate limited, sleeping for ${errRes?.secsRemaining} seconds`,
      );
      await sleep((errRes?.secsRemaining || 1) * 1000 + 1000);
      console.log("Mutex Still Locked, trying again");
      r = await fetchNfd(address, init);
    }

    if(r.status !== 200) {
      throw new Error("Something went wrong")
    }

    const data = await r.json()
    return data[address]
  })
}

export async function getNonFungibleDomainNames(
  addresses: string[],
  init: RequestInit = {},
): Promise<{ [address: string]: NFD }> {
  return mutex.runExclusive(async () => {
    let r = await fetchNfds(addresses, init);
    if(r.status === 404) {
      throw new Error("Not found")
    }
    if(r.status === 429) {
      const errRes = await r.json() as { secsRemaining?: number };
      console.log(
        `Rate limited, sleeping for ${errRes?.secsRemaining} seconds`,
      );
      await sleep((errRes?.secsRemaining || 1) * 1000 + 1000);
      console.log("Mutex Still Locked, trying again");
      r = await fetchNfds(addresses, init);
    }

    if(r.status !== 200) {
      throw new Error("Something went wrong")
    }

    return await r.json()
  })
}