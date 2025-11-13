import {
  type ProposalSummaryCardDetails,
  getAlgodClient,
  getIndexerClient,
  getProposalToDelete,
  getAllProposalsToDelete,
  metadataBoxName,
  RegistryAppID,
} from "@/api";
import { ProposalFactory } from "@algorandfoundation/xgov";
import algosdk, { type TransactionSigner } from "algosdk";
import type { APIRoute } from "astro";
import { createLogger } from "@/utils/logger";
import { AlgorandClient } from "@algorandfoundation/algokit-utils";
import { getNumericEnvironmentVariable, getStringEnvironmentVariable } from "@/functions";

// Create logger for this file
const logger = createLogger("delete-api");

const DEFAULT_CONCURRENT_PROPOSALS = 5; // Default number of proposals to process concurrently
const MAX_CONCURRENT_PROPOSALS = 20; // Maximum number of proposals to process concurrently
// Environment variable for concurrent proposal processing
const ENV_CONCURRENT_PROPOSALS = import.meta.env.MAX_CONCURRENT_PROPOSALS
  ? parseInt(import.meta.env.MAX_CONCURRENT_PROPOSALS, 10)
  : null;
const DEFAULT_MAX_REQUESTS_PER_PROPOSAL = 5; // Default number of proposals to process concurrently
const MAX_REQUESTS_PER_PROPOSAL = 20; // Maximum number of proposals to process concurrently
// Environment variable for concurrent proposal processing
const ENV_MAX_REQUESTS_PER_PROPOSAL = import.meta.env.MAX_REQUESTS_PER_PROPOSAL
  ? parseInt(import.meta.env.MAX_REQUESTS_PER_PROPOSAL, 10)
  : null;

// Types
interface ProposalResult {
  success: boolean;
  details: {
    id: bigint;
    status: "success" | "failed";
    error?: string;
  };
}

interface ResultsSummary {
  success: number;
  failed: number;
  details: Array<{
    id: bigint;
    status: "success" | "failed";
    error?: string;
  }>;
}

/**
 * Parses request options from the request body
 *
 * @param request The incoming request
 * @returns Parsed options for processing
 */
async function parseRequestOptions(
  request: Request,
  locals: App.Locals,
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
function createXGovDaemon(
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

/**
 * Process a single proposal to delete
 *
 * @param proposal The proposal to delete
 * @param proposalFactory The proposal factory
 * @param xgovDaemon The xgov daemon for signing
 * @returns Result of the processing operation
 */
async function processProposal(
  proposal: ProposalSummaryCardDetails,
  proposalFactory: ProposalFactory,
  xgovDaemon: { addr: string; signer: TransactionSigner },
): Promise<ProposalResult> {
  try {
    logger.info(`Processing proposal ${proposal.id}: ${proposal.title}`);

    // Get the proposal client
    const proposalClient = proposalFactory.getAppClientById({
      appId: proposal.id,
    });

    try {
      logger.info(
        `Deleting proposal ${proposal.id}`,
      );

      await proposalClient.send.delete.delete({
        sender: xgovDaemon.addr,
        signer: xgovDaemon.signer,
        args: {},
        appReferences: [RegistryAppID],
        boxReferences: [metadataBoxName],
        extraFee: (1000).microAlgo(), // Extra fee for inner transaction
      });
      logger.info(
        `Successfully deleted proposal ${proposal.id}`,
      );
    } catch (deletionError) {
      logger.error(
        `Failed to delete proposal ${proposal.id}`,
        deletionError,
      );
    }

    // Return successful result
    return {
      success: true,
      details: {
        id: proposal.id,
        status: "success" as const,
      },
    };
  } catch (error) {
    logger.error(`Error processing proposal ${proposal.id}`, error);

    // Return failed result
    return {
      success: false,
      details: {
        id: proposal.id,
        status: "failed" as const,
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

/**
 * Creates and processes batch promises for parallel execution
 *
 * @param batch Batch of proposals to process
 * @param proposalFactory The proposal factory
 * @param xgovDaemon The xgov daemon
 * @returns Processing results
 */
async function processBatch(
  batch: ProposalSummaryCardDetails[],
  proposalFactory: ProposalFactory,
  xgovDaemon: { addr: string; signer: TransactionSigner },
): Promise<ProposalResult[]> {
  logger.info(`Processing batch of ${batch.length} proposals`);

  // Create promises for processing each proposal
  const batchPromises = batch.map((proposal) =>
    processProposal(
      proposal,
      proposalFactory,
      xgovDaemon,
    ),
  );

  // Process this batch in parallel, continuing even if some proposals fail
  const batchResults = await Promise.allSettled(batchPromises);

  // Convert the settled results to our result format
  return batchResults.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      // If a promise was rejected, create a failure result
      logger.error(`Unexpected error in proposal processing: ${result.reason}`);
      return {
        success: false,
        details: {
          id: batch[index].id,
          title: batch[index].title,
          voters: 0,
          status: "failed" as const,
          error: `Uncaught error: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`,
        },
      };
    }
  });
}

/**
 * Aggregates results from all proposal processing
 *
 * @param proposalResults Results from processing all proposals
 * @returns Aggregated summary
 */
function aggregateResults(proposalResults: ProposalResult[]): ResultsSummary {
  const summary: ResultsSummary = {
    success: 0,
    failed: 0,
    details: [],
  };

  for (const result of proposalResults) {
    if (result.success) {
      summary.success++;
    } else {
      summary.failed++;
    }
    summary.details.push(result.details);
  }

  return summary;
}

/**
 * POST endpoint to delete dropped proposals.
 * This deletes proposals that have been dropped (Status DRAFT, FINALIZED).
 *
 * @param context The Astro API context
 * @returns A JSON response with the results of the deletion operation
 */
export const POST: APIRoute = async ({ request, locals }) => {
  // Record start time for performance metrics
  const startTime = Date.now();

  try {
    // Authentication validation removed

    // Parse request options
    const { maxConcurrentProposals, maxRequestsPerProposal, proposalIds } =
      await parseRequestOptions(request, locals);

    logger.info("Received proposalIds", proposalIds);

    let proposalsToProcess: ProposalSummaryCardDetails[] = [];

    if (proposalIds?.length) {
      proposalsToProcess = await Promise.all(
        proposalIds.map((id) => getProposalToDelete(id)),
      );
    } else {
      // Get all funded/blocked/rejected proposals
      const allProposalsToDelete = await getAllProposalsToDelete();

      if (!allProposalsToDelete || allProposalsToDelete.length === 0) {
        return new Response(
          JSON.stringify({ message: "No proposals to delete found" }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      }

      proposalsToProcess = allProposalsToDelete;
    }

    // Setup xgov daemon
    const daemonInfo = createXGovDaemon(
      getStringEnvironmentVariable("XGOV_DAEMON_MNEMONIC", locals, ""),
    );
    if (!daemonInfo) {
      return new Response(
        JSON.stringify({
          error:
            "xGov Daemon mnemonic not found in environment variables",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    const algod = getAlgodClient(locals, "BACKEND");
    const indexer = getIndexerClient(locals, "BACKEND");

    const algorand = AlgorandClient.fromClients({ algod, indexer });
    // cache suggested params for 30 minutes
    const suggestedParams = await algorand.getSuggestedParams();
    algorand.setSuggestedParamsCache(
      suggestedParams,
      new Date(Date.now() + 30 * 60 * 1000),
    );
    // max txn validity to accomodate params caching
    algorand.setDefaultValidityWindow(1000);

    // Create proposal factory
    const proposalFactory = new ProposalFactory({ algorand });

    logger.info(
      `Processing ${proposalsToProcess.length} proposals in batches of ${maxConcurrentProposals}, req/proposal: ${maxRequestsPerProposal}`,
    );

    // Process proposals in batches
    const proposalResults: ProposalResult[] = [];
    for (
      let i = 0;
      i < proposalsToProcess.length;
      i += maxConcurrentProposals
    ) {
      const batch = proposalsToProcess.slice(i, i + maxConcurrentProposals);
      logger.info(
        `Processing batch of ${batch.length} proposals (${i + 1} to ${Math.min(i + maxConcurrentProposals, proposalsToProcess.length)} of ${proposalsToProcess.length})`,
      );

      const batchResults = await processBatch(
        batch,
        proposalFactory,
        daemonInfo,
      );
      proposalResults.push(...batchResults);
    }

    // Aggregate results
    const results = aggregateResults(proposalResults);

    // Calculate timing info
    const completionTime = Date.now();
    const executionTimeSeconds = ((completionTime - startTime) / 1000).toFixed(
      2,
    );

    // Return the results
    return new Response(
      JSON.stringify({
        message:
          proposalIds && proposalIds.length > 0
            ? `Processed ${proposalsToProcess.length} specific proposals in ${executionTimeSeconds}s using parallel processing`
            : `Processed ${proposalsToProcess.length} proposals in ${executionTimeSeconds}s using parallel processing`,
        results,
        processingDetails: {
          concurrencyLevel: maxConcurrentProposals,
          executionTimeSeconds: parseFloat(executionTimeSeconds),
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    logger.error("Error in POST /api/delete:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process proposals",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
};
