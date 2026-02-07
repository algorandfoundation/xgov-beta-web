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
import { getStringEnvironmentVariable } from "@/functions";
import { createXGovDaemon, parseRequestOptions } from "./common";
import type { TransactionSignerAccount } from "@algorandfoundation/algokit-utils/types/account";

// Create logger for this file
const logger = createLogger("delete-api");

// Types
interface ProposalResult {
  success: boolean;
  details: {
    id: string;
    status: "success" | "failed";
    error?: string;
  };
}

interface ResultsSummary {
  success: number;
  failed: number;
  details: Array<{
    id: string;
    status: "success" | "failed";
    error?: string;
  }>;
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
  xgovDaemon: TransactionSignerAccount,
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
        id: proposal.id.toString(),
        status: "success" as const,
      },
    };
  } catch (error) {
    logger.error(`Error processing proposal ${proposal.id}`, error);

    // Return failed result
    return {
      success: false,
      details: {
        id: proposal.id.toString(),
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
  xgovDaemon: TransactionSignerAccount,
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
          id: batch[index].id.toString(),
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
      await parseRequestOptions(request, locals, logger);

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
      logger,
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
