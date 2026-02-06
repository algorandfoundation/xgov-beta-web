import { AlgorandClient } from "@algorandfoundation/algokit-utils";

export async function getLastRound(algorand: AlgorandClient): Promise<bigint> {
  return (await algorand.client.algod.status().do()).lastRound;
}

export async function getLatestTimestamp(
  algorand: AlgorandClient,
): Promise<bigint> {
  const lastRound = await getLastRound(algorand);
  const block = await algorand.client.algod.block(lastRound).do();
  return block.block.header.timestamp;
}

export async function roundWarp(algorand: AlgorandClient, to: bigint = 0n) {
  algorand.setSuggestedParamsCacheTimeout(0);
  const dispenser = await algorand.account.dispenserFromEnvironment();
  let nRounds;
  if (to !== 0n) {
    const lastRound = await getLastRound(algorand);

    if (to < lastRound) {
      throw new Error(`Cannot warp to the past: ${to} < ${lastRound}`);
    }

    nRounds = to - lastRound;
  } else {
    nRounds = 1;
  }

  for (let i = 0; i < nRounds; i++) {
    await algorand.send.payment({
      sender: dispenser.addr,
      signer: dispenser.signer,
      receiver: dispenser.addr,
      amount: (0).microAlgo(),
    });
  }
}

export async function timeWarp(algorand: AlgorandClient, to: bigint) {
  algorand.setSuggestedParamsCacheTimeout(0);
  const current = await getLatestTimestamp(algorand);
  await algorand.client.algod.setBlockOffsetTimestamp(to - current).do();
  await roundWarp(algorand);
  await algorand.client.algod.setBlockOffsetTimestamp(0).do();
}

// copied from api/assign.ts
export function committeeIdToSafeFileName(committeeId: string): string {
  // Use base64url encoding (base64 without padding, using URL-safe characters)
  return committeeId.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
