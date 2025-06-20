import { AlgorandClient } from "@algorandfoundation/algokit-utils";

export async function getLastRound(algorand: AlgorandClient): Promise<number> {
  return (await algorand.client.algod.status().do())["last-round"];
}

export async function getLatestTimestamp(
  algorand: AlgorandClient,
): Promise<number> {
  const lastRound = await getLastRound(algorand);
  const block = await algorand.client.algod.block(lastRound).do();
  return block.block.ts;
}

export async function roundWarp(algorand: AlgorandClient, to: number = 0) {
  algorand.setSuggestedParamsCacheTimeout(0);
  const dispenser = await algorand.account.dispenserFromEnvironment();
  let nRounds;
  if (to !== 0) {
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

export async function timeWarp(algorand: AlgorandClient, to: number) {
  algorand.setSuggestedParamsCacheTimeout(0);
  const current = await getLatestTimestamp(algorand);
  await algorand.client.algod.setBlockOffsetTimestamp(to - current).do();
  await roundWarp(algorand);
  await algorand.client.algod.setBlockOffsetTimestamp(0).do();
}

/**
 * Converts a committee ID buffer to a base64url safe filename
 *
 * @param committeeId The committee ID as a Buffer
 * @returns A base64url encoded string safe for filenames
 */
export function committeeIdToSafeFileName(committeeId: Buffer): string {
  // Use base64url encoding (base64 without padding, using URL-safe characters)
  return committeeId
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}