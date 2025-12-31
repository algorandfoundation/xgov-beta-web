import {
  type ProposalSummaryCardDetails,
  getAlgodClient,
  getIndexerClient,
  getRegistryClient,
  getProposalToUnassign,
  getAllProposalsToUnassign,
  proposerBoxName,
} from "@/api";
import {
  ProposalClient,
  ProposalFactory,
  type CallParams,
  type ProposalArgs,
} from "@algorandfoundation/xgov";
import algosdk from "algosdk";
import type { APIRoute } from "astro";
import { createLogger } from "@/utils/logger";
import { AlgorandClient } from "@algorandfoundation/algokit-utils";
import { chunk, getStringEnvironmentVariable } from "@/functions";
import pMap from "p-map";
import type { XGovRegistryClient } from "@algorandfoundation/xgov/registry";
import { createXGovDaemon, parseRequestOptions } from "./common";
import type { TransactionSignerAccount } from "@algorandfoundation/algokit-utils/types/account";

// Create logger for this file
const logger = createLogger("unassign-api");

// Constants for transaction processing
const MAX_GROUP_SIZE = 16; // Maximum transactions in a group
const FIRST_TXN_VOTERS = 7; // First transaction can have up to 7 voters
const OTHER_TXN_VOTERS = 8; // Other transactions can have up to 8 voters

const CONFIRMATION_ROUNDS = 4; // Number of rounds to wait for transaction confirmation
const VOTER_BOX_PREFIX_BYTE = 86; // ASCII for 'V'

// Types
interface ProposalResult {
  success: boolean;
  details: {
    id: bigint;
    title: string;
    voters: number;
    status: "success" | "failed";
    error?: string;
    finalized?: boolean; // Whether the proposal was finalized
  };
}

interface ResultsSummary {
  success: number;
  failed: number;
  details: Array<{
    id: bigint;
    title: string;
    voters: number;
    status: "success" | "failed";
    error?: string;
  }>;
}

/**
 * Retrieves the list of assigned voter addresses for a proposal
 *
 * @param proposalClient The proposal client instance
 * @returns An array of voter Algorand addresses
 */
async function getAssignedVoters(
  proposalClient: ProposalClient,
): Promise<Array<string>> {
  const existingVoters = new Array<string>();

  try {
    // Get all existing box names for this proposal
    const existingVoterBoxes = await proposalClient.appClient.getBoxNames();

    // Extract voter addresses from box names starting with 'V'
    for (const box of existingVoterBoxes) {
      try {
        // Use nameRaw which is Uint8Array instead of name property
        const boxNameRaw = box.nameRaw;

        // Voter boxes should be 33 bytes: 'V' (1 byte) + address (32 bytes)
        if (
          boxNameRaw &&
          boxNameRaw.length === 33 &&
          boxNameRaw[0] === VOTER_BOX_PREFIX_BYTE
        ) {
          // Extract address from box name (skip first byte which is 'V')
          const addressBytes = boxNameRaw.slice(1);
          // Convert address bytes to Algorand address format
          const address = algosdk.encodeAddress(addressBytes);
          existingVoters.push(address);
        }
      } catch (error) {
        logger.warn(`Failed to decode voter box name`, error);
        // Continue processing other boxes
      }
    }
  } catch (error) {
    logger.error(`Error getting assigned voters`, error);
    // Return empty set if there was an error
  }

  return existingVoters;
}

/**
 * Creates transaction parameters for a batch of voters
 *
 * @param voters Voter information to include in the transaction
 * @param xgovDaemon The xgov daemon for signing
 * @param isFirstTransaction Whether this is the first transaction in a group
 * @returns Transaction parameters
 */
function createTransactionParams(
  registryClient: XGovRegistryClient,
  voters: string[],
  boxReferences: Uint8Array[],
  xgovDaemon: TransactionSignerAccount,
  isFirstTransaction: boolean,
): CallParams<ProposalArgs["obj"]["unassign_voters(address[])void"]> {
  const txnParams: CallParams<
    ProposalArgs["obj"]["unassign_voters(address[])void"]
  > = {
    sender: xgovDaemon.addr,
    signer: xgovDaemon.signer,
    args: { voters },
    boxReferences,
  };

  // Only add appReferences for the first transaction in the group
  if (isFirstTransaction) {
    txnParams.appReferences = [registryClient.appId];
  }

  return txnParams;
}

/**
 * Processes a batch of voters for a proposal
 *
 * @param proposalClient The proposal client
 * @param eligibleVoters The eligible voters to unassign
 * @param xgovDaemon The xgov daemon for signing
 * @param proposalId The proposal ID for logging
 * @param groupStart The starting index for this group
 * @returns Number of voters successfully unassigned
 */
async function processVoterBatch(
  registryClient: XGovRegistryClient,
  proposalClient: ProposalClient,
  eligibleVoters: string[],
  xgovDaemon: TransactionSignerAccount,
): Promise<number> {
  const totalVoters = eligibleVoters.length;

  // Calculate how many voters to process in this batch (capped by MAX_VOTERS_PER_GROUP)
  const votersInThisBatch = eligibleVoters.length;

  if (votersInThisBatch <= 0) return 0;

  // Calculate how many transactions we need for this batch
  const txnsForThisBatch =
    votersInThisBatch <= FIRST_TXN_VOTERS
      ? 1 // If 7 or fewer voters, only need one transaction
      : Math.ceil((votersInThisBatch - FIRST_TXN_VOTERS) / OTHER_TXN_VOTERS) +
        1;

  logger.info(
    `Batch needs ${txnsForThisBatch}/${MAX_GROUP_SIZE} transactions for ${votersInThisBatch} voters`,
  );

  // Create a transaction group
  const txnGroup = proposalClient.newGroup();
  let groupVotersCount = 0;

  // Calculate distribution for detailed logging
  const firstTxnVoters = Math.min(FIRST_TXN_VOTERS, votersInThisBatch);
  const remainingVoters = votersInThisBatch - firstTxnVoters;
  const fullMiddleTxns = Math.floor(remainingVoters / OTHER_TXN_VOTERS);
  const lastTxnVoters = remainingVoters % OTHER_TXN_VOTERS;

  logger.debug(
    `Voter distribution: ${votersInThisBatch} total voters - ` +
      `1st txn: ${firstTxnVoters} voters, ` +
      `${fullMiddleTxns} middle txns with ${OTHER_TXN_VOTERS} voters each` +
      `${lastTxnVoters > 0 ? `, last txn: ${lastTxnVoters} voters` : ""}`,
  );

  // Track processed count
  let processedInGroup = 0;

  // Add each transaction to the group - only create as many as we need
  for (
    let txnIndex = 0;
    txnIndex < txnsForThisBatch && processedInGroup < votersInThisBatch;
    txnIndex++
  ) {
    // Determine how many voters to process in this transaction
    let votersInThisTxn;

    if (txnIndex === 0) {
      // First transaction takes exactly 7 voters (or all remaining if less than 7)
      votersInThisTxn = Math.min(FIRST_TXN_VOTERS, votersInThisBatch);
    } else if (txnIndex === txnsForThisBatch - 1) {
      // Last transaction takes whatever is left
      votersInThisTxn = votersInThisBatch - processedInGroup;
    } else {
      // Middle transactions take full capacity of 8 voters
      votersInThisTxn = OTHER_TXN_VOTERS;
    }

    // Calculate start index for this batch
    const batchStartIndex = processedInGroup;

    // Check if we've processed all voters
    if (batchStartIndex >= totalVoters) break;

    // Get the current batch of voters for this transaction
    const batchEndIndex = Math.min(
      batchStartIndex + votersInThisTxn,
      totalVoters,
    );
    const batch = eligibleVoters.slice(
      batchStartIndex,
      batchEndIndex,
    ) as string[];

    // Collect all box references for this batch
    const boxReferences = batch.map((voter: string) => {
      const addr = algosdk.decodeAddress(voter).publicKey;
      return new Uint8Array(Buffer.concat([Buffer.from("V"), addr]));
    });

    // Create transaction parameters
    const txnParams = createTransactionParams(
      registryClient,
      batch,
      boxReferences,
      xgovDaemon,
      txnIndex === 0,
    );

    // Add this transaction to the group
    txnGroup.unassignVoters(txnParams);

    // Update counters
    groupVotersCount += batch.length;
    processedInGroup += batch.length;

    // More condensed log for individual transactions
    logger.debug(
      `Txn ${txnIndex + 1}/${txnsForThisBatch}: ${batch.length} voters ` +
        `[${txnIndex === 0 ? "First" : txnIndex === txnsForThisBatch - 1 ? "Last" : "Middle"}]`,
    );
  }

  // Send the entire transaction group atomically
  logger.info(
    `Sending group with ${txnsForThisBatch} transactions (${groupVotersCount} voters) to proposal ${proposalClient.appId}`,
  );

  try {
    // Send the transaction group - this will handle the atomic commits
    const txResponse = await txnGroup.send({
      maxRoundsToWaitForConfirmation: CONFIRMATION_ROUNDS,
    });

    // If we get here, the transaction was successful
    logger.info(
      `Successfully unassigned ${groupVotersCount} voters from proposal ${proposalClient.appId} tx group ${txResponse.groupId}`,
    );
    return groupVotersCount;
  } catch (error) {
    logger.error(
      `Error sending transaction group for proposal ${proposalClient.appId}`,
      error,
    );

    throw new Error(
      `Failed to send transaction group for proposal ${proposalClient.appId}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Process a single proposal to unassign voters
 *
 * @param proposal The proposal to process
 * @param proposalFactory The proposal factory
 * @param xgovDaemon The xgov daemon for signing
 * @returns Result of the processing operation
 */
async function processProposal(
  registryClient: XGovRegistryClient,
  proposal: ProposalSummaryCardDetails,
  proposalFactory: ProposalFactory,
  xgovDaemon: TransactionSignerAccount,
  maxRequestsPerProposal: number,
): Promise<ProposalResult> {
  try {
    logger.info(`Processing proposal ${proposal.id}: ${proposal.title}`);

    // Get the proposal client
    const proposalClient = proposalFactory.getAppClientById({
      appId: proposal.id,
    });

    // Get the list of assigned voters
    const existingVoters = await getAssignedVoters(proposalClient);
    logger.info(
      `Found ${existingVoters.length} assigned voters for proposal ${proposalClient.appId}`,
    );

    let voterCount = 0;

    // Unsssign voters in batches for better efficiency
    if (
      existingVoters &&
      Array.isArray(existingVoters) &&
      existingVoters.length > 0
    ) {
      // Calculate max voters per group: First txn (7) + remaining txns (8 each)
      const MAX_VOTERS_PER_GROUP =
        FIRST_TXN_VOTERS + (MAX_GROUP_SIZE - 1) * OTHER_TXN_VOTERS; // = 7 + 15*8 = 127

      const votersInChunks = chunk(existingVoters, MAX_VOTERS_PER_GROUP);
      await pMap(
        votersInChunks,
        async (eligibleVotersChunk, i) => {
          logger.debug(`Processing voter group starting at index ${i}`);
          try {
            await processVoterBatch(
              registryClient,
              proposalClient,
              eligibleVotersChunk,
              xgovDaemon,
            );
            voterCount += eligibleVotersChunk.length;
          } catch (error) {
            logger.error(
              `Failed to process transaction group for proposal ${proposal.id}`,
              error,
            );
            throw new Error(
              `Failed to assign voters to proposal ${proposal.id}: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        },
        { concurrency: maxRequestsPerProposal },
      );
    }

    logger.info(
      `Proposal ${proposal.id} unassignment complete: ` +
        `${voterCount} voters unassigned, `
    );

    // extra step, finalize the proposal
    let finalized = false;
    try {
      logger.info(
        `Finalizing proposal ${proposal.id} after unassigning voters`,
      );
      const proposer = await proposalClient.state.global.proposer();

      if (!proposer) {
        throw new Error(`No proposer found for proposal ${proposal.id}`);
      }

      await registryClient.send.finalizeProposal({
        sender: xgovDaemon.addr,
        signer: xgovDaemon.signer,
        args: {
          proposalId: proposal.id,
        },
        appReferences: [proposal.id],
        boxReferences: [proposerBoxName(proposer)],
        extraFee: (2000).microAlgo(), // Extra fee for inner transaction
      });
      logger.info(
        `Successfully finalized proposal ${proposal.id}`,
      );
      finalized = true;
    } catch (finalizationError) {
      logger.error(
        `Failed to finalize proposal ${proposal.id} after unassigning voters`,
        finalizationError,
      );
    }

    // Return successful result
    return {
      success: true,
      details: {
        id: proposal.id,
        title: proposal.title,
        voters: voterCount,
        status: "success" as const,
        finalized,
      },
    };
  } catch (error) {
    logger.error(`Error processing proposal ${proposal.id}`, error);

    // Return failed result
    return {
      success: false,
      details: {
        id: proposal.id,
        title: proposal.title,
        voters: 0,
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
  registryClient: XGovRegistryClient,
  batch: ProposalSummaryCardDetails[],
  proposalFactory: ProposalFactory,
  xgovDaemon: TransactionSignerAccount,
  maxRequestsPerProposal: number,
): Promise<ProposalResult[]> {
  logger.info(`Processing batch of ${batch.length} proposals`);

  // Create promises for processing each proposal
  const batchPromises = batch.map((proposal) =>
    processProposal(
      registryClient,
      proposal,
      proposalFactory,
      xgovDaemon,
      maxRequestsPerProposal,
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
 * POST endpoint to unassign voters from all funded/blocked/rejected proposals.
 * This unassigns voters from each proposal with status FUNDED/BLOCKED/REJECTED.
 *
 * @param context The Astro API context
 * @returns A JSON response with the results of the unassignment operation
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
        proposalIds.map((id) => getProposalToUnassign(id)),
      );
    } else {
      // Get all funded/blocked/rejected proposals
      const allProposalsToUnassign = await getAllProposalsToUnassign();

      if (!allProposalsToUnassign || allProposalsToUnassign.length === 0) {
        return new Response(
          JSON.stringify({ message: "No proposals to unassign found" }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      }

      proposalsToProcess = allProposalsToUnassign;
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

    const registryClient = getRegistryClient(algorand);

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
        registryClient,
        batch,
        proposalFactory,
        daemonInfo,
        maxRequestsPerProposal,
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
    logger.error("Error in POST /api/unassign:", error);
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
