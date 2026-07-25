/**
 * Links to the transparency artifacts the Foundation publishes for every
 * committee run.
 *
 * A committee is not chosen by anyone — it is derived from what the chain
 * already recorded, and every intermediate step of that derivation is published
 * as a static file. This module turns a committee file into the set of links
 * that lets a reader replay the run.
 *
 * Layout of the published site:
 *   {host}/{genesisId}-{genesisHash}/blocks/{round}.json
 *   {host}/{genesisId}-{genesisHash}/proposers/{from}-{to}.jsons
 *   {host}/{genesisId}-{genesisHash}/candidate-committee/{from}-{to}.json
 *   {host}/{genesisId}-{genesisHash}/subscribed-xGovs/{from}-{to}.json
 *   {host}/{genesisId}-{genesisHash}/committee/{from}-{to}.json
 *   {host}/{genesisId}-{genesisHash}/committee/{committeeId}.json
 */

export const COMMITTEE_ARTIFACTS_HOST = "https://xgov-committees.algorand.tech";

export const COMMITTEE_SPEC_URL =
  "https://docs.xgov.algorand.co/specs/xgov-committee";
export const REGISTRY_SPEC_URL =
  "https://docs.xgov.algorand.co/specs/xgov-registry";
export const ARC86_URL = "https://arc.algorand.foundation/ARCs/arc-0086";
export const GENERATOR_SOURCE_URL =
  "https://github.com/algorandfoundation/xgov-committees";

// The artifact host namespaces each network by "{genesisId}-{genesisHash}". Only
// the genesis hash is recorded in the committee file, so the ids are mapped here.
const GENESIS_IDS: Record<string, string> = {
  "wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=": "mainnet-v1.0",
  "SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=": "testnet-v1.0",
};

// The directory segment escapes padding as well, unlike the committee file names
// (which strip it) — see `committeeIdToSafeFileName`.
function toUrlSegment(base64: string): string {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "_");
}

export function committeeArtifactsBaseUrl(
  networkGenesisHash?: string,
): string | null {
  if (!networkGenesisHash) return null;
  const genesisId = GENESIS_IDS[networkGenesisHash];
  if (!genesisId) return null;
  return `${COMMITTEE_ARTIFACTS_HOST}/${genesisId}-${toUrlSegment(networkGenesisHash)}`;
}

export function committeeRangeKey(
  periodStart: number,
  periodEnd: number,
): string {
  return `${periodStart}-${periodEnd}`;
}

export interface CommitteePipelineStep {
  // Position in the chain, used as the step marker.
  n: number;
  title: string;
  body: string;
  // Real figure produced by this step, or null when it isn't known — never a
  // placeholder.
  count: string | null;
  // Repo-relative name of the artifact this step publishes.
  artifact: string;
  // Absolute link to it, or null when this network publishes no artifacts.
  href: string | null;
}

export interface CommitteeArtifacts {
  baseUrl: string | null;
  // The canonical ARC-86 committee file, by round range and by committee id.
  committeeFileUrl: string | null;
  committeeByIdUrl: string | null;
  steps: CommitteePipelineStep[];
}

interface BuildArtifactsInput {
  periodStart: number;
  periodEnd: number;
  totalMembers: number;
  totalVotes: number;
  networkGenesisHash?: string;
  // Safe-filename form of the committee id, for the by-id copy of the file.
  safeCommitteeId: string;
  // Counts read from the intermediate artifacts, when they could be fetched.
  proposerCount?: number | null;
  subscribedCount?: number | null;
}

const formatCount = (value: number) => value.toLocaleString();

export function buildCommitteeArtifacts({
  periodStart,
  periodEnd,
  totalMembers,
  totalVotes,
  networkGenesisHash,
  safeCommitteeId,
  proposerCount = null,
  subscribedCount = null,
}: BuildArtifactsInput): CommitteeArtifacts {
  const baseUrl = committeeArtifactsBaseUrl(networkGenesisHash);
  const range = committeeRangeKey(periodStart, periodEnd);
  const link = (path: string) => (baseUrl ? `${baseUrl}/${path}` : null);

  const blockCount = Math.max(0, periodEnd - periodStart);

  const steps: CommitteePipelineStep[] = [
    {
      n: 1,
      title: "Block headers",
      body: `Every block header in rounds ${periodStart.toLocaleString()}–${periodEnd.toLocaleString()} is read from an archival node. One block is one potential vote.`,
      count: `${formatCount(blockCount)} headers`,
      artifact: `blocks/${periodStart}.json`,
      href: link(`blocks/${periodStart}.json`),
    },
    {
      n: 2,
      title: "Proposers",
      body: "Headers are aggregated into one record per unique proposing address.",
      count:
        proposerCount !== null ? `${formatCount(proposerCount)} addrs` : null,
      artifact: `proposers/${range}.jsons`,
      href: link(`proposers/${range}.jsons`),
    },
    {
      n: 3,
      title: "Candidate committee",
      body: "Each proposer is mapped to its block count — its potential voting power.",
      count:
        proposerCount !== null
          ? `${formatCount(proposerCount)} candidates`
          : null,
      artifact: `candidate-committee/${range}.json`,
      href: link(`candidate-committee/${range}.json`),
    },
    {
      n: 4,
      title: "Subscribed xGovs",
      body: `Addresses subscribed on the xGov Registry before the cutoff round ${periodEnd.toLocaleString()} stay; anyone who subscribed later waits for the next cohort.`,
      count:
        subscribedCount !== null
          ? `${formatCount(subscribedCount)} subscribed`
          : null,
      artifact: `subscribed-xGovs/${range}.json`,
      href: link(`subscribed-xGovs/${range}.json`),
    },
    {
      n: 5,
      title: "Committee file",
      body: "The ARC-86 file, hashed into the committee ID declared on the Registry.",
      count: `${formatCount(totalMembers)} members · ${formatCount(totalVotes)} votes`,
      artifact: `committee/${range}.json`,
      href: link(`committee/${range}.json`),
    },
  ];

  return {
    baseUrl,
    committeeFileUrl: link(`committee/${range}.json`),
    committeeByIdUrl: link(`committee/${safeCommitteeId}.json`),
    steps,
  };
}

/**
 * Reads the two intermediate artifacts that carry a countable set of addresses,
 * so the pipeline can show real figures rather than placeholders. Both are small
 * maps of `address -> number`; the 27MB `proposers/*.jsons` stream is never read.
 *
 * Resolves to nulls if the network publishes nothing or a fetch fails — the
 * pipeline then simply renders without those counts.
 */
export async function fetchCommitteeArtifactCounts(
  networkGenesisHash: string | undefined,
  periodStart: number,
  periodEnd: number,
): Promise<{ proposerCount: number | null; subscribedCount: number | null }> {
  const baseUrl = committeeArtifactsBaseUrl(networkGenesisHash);
  if (!baseUrl) return { proposerCount: null, subscribedCount: null };

  const range = committeeRangeKey(periodStart, periodEnd);

  const countKeys = async (path: string): Promise<number | null> => {
    try {
      const response = await fetch(`${baseUrl}/${path}`);
      if (!response.ok) return null;
      const body = (await response.json()) as unknown;
      if (!body || typeof body !== "object" || Array.isArray(body)) return null;
      return Object.keys(body).length;
    } catch {
      return null;
    }
  };

  const [proposerCount, subscribedCount] = await Promise.all([
    countKeys(`candidate-committee/${range}.json`),
    countKeys(`subscribed-xGovs/${range}.json`),
  ]);

  return { proposerCount, subscribedCount };
}
