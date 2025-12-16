import algosdk, { type TransactionSigner } from "algosdk";
import { getNumericEnvironmentVariable } from "@/functions";
import type { Logger } from "@/utils/logger";

export const DEFAULT_CONCURRENT_PROPOSALS = 5; // Default number of proposals to process concurrently
export const MAX_CONCURRENT_PROPOSALS = 20; // Maximum number of proposals to process concurrently
// Environment variable for concurrent proposal processing
export const ENV_CONCURRENT_PROPOSALS = import.meta.env.MAX_CONCURRENT_PROPOSALS
  ? parseInt(import.meta.env.MAX_CONCURRENT_PROPOSALS, 10)
  : null;
export const DEFAULT_MAX_REQUESTS_PER_PROPOSAL = 5; // Default number of proposals to process concurrently
export const MAX_REQUESTS_PER_PROPOSAL = 20; // Maximum number of proposals to process concurrently
// Environment variable for concurrent proposal processing
export const ENV_MAX_REQUESTS_PER_PROPOSAL = import.meta.env.MAX_REQUESTS_PER_PROPOSAL
  ? parseInt(import.meta.env.MAX_REQUESTS_PER_PROPOSAL, 10)
  : null;

/**
 * Parses request options from the request body
 *
 * @param request The incoming request
 * @returns Parsed options for processing
 */
export async function parseRequestOptions(
  request: Request,
  locals: App.Locals,
  logger: Logger
): Promise<{
  maxConcurrentProposals: number;
  maxRequestsPerProposal: number;
  proposalIds?: bigint[];
}> {
  // Get concurrent proposals from environment variable first, then fallback to default
  let maxConcurrentProposals = getNumericEnvironmentVariable(
    "MAX_CONCURRENT_PROPOSALS",
    locals,
    ENV_CONCURRENT_PROPOSALS || DEFAULT_CONCURRENT_PROPOSALS,
  );

  // Ensure the value is within acceptable range
  if (
    maxConcurrentProposals <= 0 ||
    maxConcurrentProposals > MAX_CONCURRENT_PROPOSALS
  ) {
    logger.warn(
      `Invalid environment MAX_CONCURRENT_PROPOSALS value: ${maxConcurrentProposals}, using default: ${DEFAULT_CONCURRENT_PROPOSALS}`,
    );
    maxConcurrentProposals = DEFAULT_CONCURRENT_PROPOSALS;
  } else {
    logger.info(
      `Using concurrency level from environment: ${maxConcurrentProposals}`,
    );
  }

  // Get concurrent proposals from environment variable first, then fallback to default
  let maxRequestsPerProposal = getNumericEnvironmentVariable(
    "MAX_REQUESTS_PER_PROPOSAL",
    locals,
    ENV_MAX_REQUESTS_PER_PROPOSAL || DEFAULT_MAX_REQUESTS_PER_PROPOSAL,
  );

  // Ensure the value is within acceptable range
  if (
    maxRequestsPerProposal <= 0 ||
    maxRequestsPerProposal > MAX_REQUESTS_PER_PROPOSAL
  ) {
    logger.warn(
      `Invalid environment MAX_REQUESTS_PER_PROPOSAL value: ${maxRequestsPerProposal}, using default: ${DEFAULT_MAX_REQUESTS_PER_PROPOSAL}`,
    );
    maxRequestsPerProposal = DEFAULT_MAX_REQUESTS_PER_PROPOSAL;
  } else {
    logger.info(
      `Using requests per proposal from environment: ${maxRequestsPerProposal}`,
    );
  }

  let proposalIds: bigint[] | undefined = undefined;

  try {
    const requestBody = await request.json();

    // Parse proposal IDs if provided
    if (
      requestBody &&
      requestBody.proposalIds &&
      Array.isArray(requestBody.proposalIds)
    ) {
      try {
        proposalIds = requestBody.proposalIds.map((id: string | number) =>
          BigInt(id),
        );
        if (proposalIds) {
          logger.info(
            `Request targets ${proposalIds.length} specific proposals`,
          );
        }
      } catch (parseError) {
        logger.error(`Error parsing proposal IDs`, parseError);
        throw new Error(
          `Invalid proposal ID format: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        );
      }
    }
  } catch (error) {
    logger.info(
      `Could not parse request body, using default concurrency level: ${maxConcurrentProposals}`,
    );
  }

  return { maxConcurrentProposals, maxRequestsPerProposal, proposalIds };
}

/**
 * Creates an xgov daemon account from mnemonic
 *
 * @returns xgov daemon account and signer, or null if no mnemonic
 */
export function createXGovDaemon(
  logger: Logger,
  daemonMnemonic?: string,
): { addr: string; signer: TransactionSigner } | null {
  // Check if we have daemon credentials
  if (!daemonMnemonic) {
    return null;
  }

  // Create xgov daemon account from mnemonic
  const account = algosdk.mnemonicToSecretKey(daemonMnemonic);

  // Create a TransactionSignerAccount from the account
  const daemon = {
    addr: account.addr,
    // Implement the signer as a TransactionSigner
    signer: (txnGroup: algosdk.Transaction[], indexesToSign: number[]) => {
      return Promise.resolve(
        indexesToSign.map((i) => txnGroup[i].signTxn(account.sk)),
      );
    },
  };

  logger.info(`Using xgov daemon with address: ${account.addr}`);
  return daemon;
}