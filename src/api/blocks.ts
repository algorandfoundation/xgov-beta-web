import type algosdk from "algosdk";
import { algod } from "@/api/algorand/algo-client";

// A produced block's timestamp is immutable, so once resolved it can be cached
// for the lifetime of the page. Keyed by round number.
const blockTimestampCache = new Map<number, number>();
const inFlight = new Map<number, Promise<number | null>>();

/**
 * Resolves an Algorand round to its block timestamp (unix seconds) using the
 * algod block header only (`GET /v2/blocks/{round}?header-only=true`).
 *
 * Successful lookups are cached forever (block timestamps never change). A block
 * that does not exist yet (future round) or a transient failure resolves to
 * `null` and is not cached, so it can be retried later.
 *
 * `algodClient` defaults to the public client; server-side callers pass the
 * backend-configured one. A deployment only ever talks to a single network, so
 * the round-keyed cache is shared across clients.
 */
export async function getBlockTimestamp(
  round: number,
  algodClient: algosdk.Algodv2 = algod,
): Promise<number | null> {
  const cached = blockTimestampCache.get(round);
  if (cached !== undefined) return cached;

  const pending = inFlight.get(round);
  if (pending) return pending;

  const request = algodClient
    .block(round)
    .headerOnly(true)
    .do()
    .then((response) => {
      const timestamp = Number(response.block.header.timestamp);
      if (Number.isFinite(timestamp)) {
        blockTimestampCache.set(round, timestamp);
        return timestamp;
      }
      return null;
    })
    .catch(() => null)
    .finally(() => {
      inFlight.delete(round);
    });

  inFlight.set(round, request);
  return request;
}
