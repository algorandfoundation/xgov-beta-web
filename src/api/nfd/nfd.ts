import { Mutex } from "async-mutex";
import type { NFDProperties } from "@/api/nfd/avatar.ts";

const mutex = new Mutex();

function fetchNfd(address: string, init: RequestInit = {}) {
  return fetch(`https://api.nf.domains/nfd?address=${address}`, init)
}

function fetchNfds(addresses: string[], init: RequestInit = {}) {
  return fetch(`https://api.nf.domains/nfd?address=${addresses.join("&address=")}`, init)
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

    return await r.json()
  })
}

export async function getNonFungibleDomainNames(
  addresses: string[],
  init: RequestInit = {},
): Promise<NFD[]> {
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