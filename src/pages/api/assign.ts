import {
  getSubmittedProposal,
  getSubmittedProposals,
  type ProposalSummaryCardDetails,
  getAlgodClient,
  getIndexerClient,
  getRegistryClient,
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
const logger = createLogger("assign-api");

// Constants for transaction processing
const MAX_GROUP_SIZE = 16; // Maximum transactions in a group
const FIRST_TXN_VOTERS = 7; // First transaction can have up to 7 voters
const OTHER_TXN_VOTERS = 8; // Other transactions can have up to 8 voters

const CONFIRMATION_ROUNDS = 4; // Number of rounds to wait for transaction confirmation
const VOTER_BOX_PREFIX_BYTE = 86; // ASCII for 'V'

// Types
interface CommitteeMember {
  address: string;
  votes: number;
}

interface CommitteeData {
  xGovs: CommitteeMember[];
  [key: string]: any;
}

interface ProposalResult {
  success: boolean;
  details: {
    id: bigint;
    title: string;
    voters: number;
    skippedVoters?: number;
    totalVoters?: number;
    status: "success" | "failed";
    error?: string;
  };
}

interface ResultsSummary {
  success: number;
  failed: number;
  details: Array<{
    id: bigint;
    title: string;
    voters: number;
    skippedVoters?: number;
    totalVoters?: number;
    status: "success" | "failed";
    error?: string;
  }>;
}

/**
 * Encodes a committee ID buffer to a base64url safe filename
 *
 * @param committeeId The committee ID as a Buffer
 * @returns A base64url encoded string safe for filenames
 */
function committeeIdToSafeFileName(committeeId: Buffer): string {
  // Use base64url encoding (base64 without padding, using URL-safe characters)
  return committeeId
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Attempts to load committee data from a dynamic import
 *
 * @param committeeId The committee ID
 * @param safeCommitteeId The safe filename version of the committee ID
 * @param committeeIdStr String representation for logging
 * @returns Committee data if found, null otherwise
 */
async function loadCommitteeFromImport(
  safeCommitteeId: string,
  committeeIdStr: string,
): Promise<CommitteeData | null> {
  try {
    const moduleSpecifier = `./committees${import.meta.env.DEV ? "-dev" : ""}/${safeCommitteeId}.json`;
    logger.debug(
      `Attempting to import committee file for ID ${committeeIdStr}: ${moduleSpecifier}`,
    );

    const committeeModule = await import(moduleSpecifier);

    // Validate the imported data
    if (
      committeeModule.default &&
      committeeModule.default.xGovs &&
      Array.isArray(committeeModule.default.xGovs)
    ) {
      logger.info(
        `Loaded ${committeeModule.default.xGovs.length} committee members from imported module`,
      );
      return committeeModule.default as CommitteeData;
    } else {
      logger.warn(
        `Imported committee file for ID ${committeeIdStr} has invalid format`,
      );
      return null;
    }
  } catch (importError) {
    logger.debug(
      `Could not import committee data for ID: ${committeeIdStr}`,
      importError,
    );
    return null;
  }
}

/**
 * Attempts to load committee data from the external API
 *
 * @param safeCommitteeId The safe filename version of the committee ID
 * @param committeeIdStr String representation for logging
 * @param apiUrl Optional URL from the env
 * @returns Committee data if found, null otherwise
 */
async function loadCommitteeFromAPI(
  safeCommitteeId: string,
  committeeIdStr: string,
  apiUrl?: string,
): Promise<CommitteeData | null> {
  if (!apiUrl) {
    logger.error("COMMITTEE_API_URL environment variable not set");
    return null;
  }

  const url = `${apiUrl}/committees/${safeCommitteeId}.json`;

  try {
    logger.info(
      `Fetching committee data from API for committee ID: ${committeeIdStr}`,
    );
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `API returned status ${response.status} for committee ID: ${committeeIdStr}`,
      );
    }

    const committeeData = await response.json();

    // Validate the API response has the expected structure
    if (
      !committeeData ||
      !committeeData.xGovs ||
      !Array.isArray(committeeData.xGovs)
    ) {
      throw new Error(
        `API returned invalid committee data format for committee ID: ${committeeIdStr}`,
      );
    }

    logger.info(
      `Loaded ${committeeData.xGovs.length} committee members from API`,
    );
    return committeeData as CommitteeData;
  } catch (error) {
    logger.error(`Error loading committee data from API`, error);
    return null;
  }
}

/**
 * Retrieves committee data for a given committee ID
 *
 * This function attempts to load committee data from multiple sources:
 * 1. Dynamic import
 * 2. External API
 *
 * @param committeeId The committee ID as a Buffer
 * @param apiUrl The api url provided by the context
 * @returns Committee data if found, null otherwise
 */
async function getCommitteeData(
  committeeId: Buffer,
  apiUrl?: string,
): Promise<CommitteeData | null> {
  // For logging purposes - define outside try/catch to ensure it's available in the catch block
  const committeeIdStr = committeeId.toString("base64");

  try {
    // Convert committeeId to a base64url encoded filename
    const safeCommitteeId = committeeIdToSafeFileName(committeeId);

    // Try loading from import first
    try {
      const importData = await loadCommitteeFromImport(
        safeCommitteeId,
        committeeIdStr,
      );
      if (importData) return importData;
    } catch (importSetupError) {
      logger.warn(
        `Error setting up import for committee ID ${committeeIdStr}`,
        importSetupError,
      );
    }

    // Try loading from API as a last resort
    const apiData = await loadCommitteeFromAPI(
      safeCommitteeId,
      committeeIdStr,
      apiUrl,
    );
    if (apiData) {
      return apiData;
    }

    return null;
  } catch (error) {
    logger.error(
      `Failed to get committee data for ID ${committeeIdStr}`,
      error,
    );
    return null;
  }
}

/**
 * Retrieves the committee ID from a proposal
 *
 * @param proposalClient The proposal client
 * @returns The committee ID as a Buffer
 */
async function getCommitteeId(
  proposalClient: ProposalClient,
): Promise<Buffer | null> {
  try {
    // Get committee ID from global state
    const byteArray = await proposalClient.state.global.committeeId();

    if (byteArray) {
      const committeeId = Buffer.from(byteArray);
      const committeeIdStr = committeeId.toString("base64");
      logger.debug(
        `Using committeeId ${committeeIdStr} from asByteArray(), length: ${byteArray.length}`,
      );
      return committeeId;
    }

    logger.warn(
      `No valid committeeId found for proposal ${proposalClient.appId}`,
    );
    return null;
  } catch (error) {
    logger.error(
      `Failed to get committee ID for proposal ${proposalClient.appId}`,
      error,
    );
    return null;
  }
}

/**
 * Retrieves the list of already assigned voter addresses for a proposal
 *
 * @param proposalClient The proposal client instance
 * @returns A Set of voter Algorand addresses
 */
async function getAssignedVoters(
  proposalClient: ProposalClient,
): Promise<Set<string>> {
  const existingVoters = new Set<string>();

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
          existingVoters.add(address);
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
 * Gets eligible voters for a proposal by filtering out already assigned voters
 *
 * @param proposalClient The proposal client
 * @param committeeData The committee data with voter information
 * @returns Object containing eligible voters and counts
 */
async function getEligibleVoters(
  proposalClient: ProposalClient,
  committeeData: CommitteeData,
): Promise<{
  eligibleVoters: CommitteeMember[];
  alreadyAssignedCount: number;
  totalVotersCount: number;
}> {
  // Check for already assigned voters to prevent duplicates
  logger.debug(
    `Checking for previously assigned voters for proposal ${proposalClient.appId}`,
  );

  // Get the list of already assigned voters
  const existingVoters = await getAssignedVoters(proposalClient);
  logger.info(
    `Found ${existingVoters.size} already assigned voters for proposal ${proposalClient.appId}`,
  );

  // Filter out already assigned voters
  const eligibleVoters = committeeData.xGovs.filter(
    (member: CommitteeMember) => !existingVoters.has(member.address),
  );

  logger.info(
    `Filtered from ${committeeData.xGovs.length} to ${eligibleVoters.length} eligible voters for proposal ${proposalClient.appId}`,
  );

  return {
    eligibleVoters,
    alreadyAssignedCount: committeeData.xGovs.length - eligibleVoters.length,
    totalVotersCount: committeeData.xGovs.length,
  };
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
  voters: [string, number][],
  boxReferences: Uint8Array[],
  xgovDaemon: TransactionSignerAccount,
  isFirstTransaction: boolean,
): CallParams<ProposalArgs["obj"]["assign_voters((address,uint64)[])void"]> {
  const txnParams: CallParams<
    ProposalArgs["obj"]["assign_voters((address,uint64)[])void"]
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
 * @param eligibleVoters The eligible voters to assign
 * @param xgovDaemon The xgov daemon for signing
 * @param proposalId The proposal ID for logging
 * @param groupStart The starting index for this group
 * @returns Number of voters successfully assigned
 */
async function processVoterBatch(
  registryClient: XGovRegistryClient,
  proposalClient: ProposalClient,
  eligibleVoters: CommitteeMember[],
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
    ) as CommitteeMember[];

    // Create the voters array in the format [[address, votingPower], ...]
    const voters: [string, number][] = batch.map((member: CommitteeMember) => [
      member.address,
      member.votes,
    ]);

    // Collect all box references for this batch
    const boxReferences = batch.map((member: CommitteeMember) => {
      const addr = algosdk.decodeAddress(member.address).publicKey;
      return new Uint8Array(Buffer.concat([Buffer.from("V"), addr]));
    });

    // Create transaction parameters
    const txnParams = createTransactionParams(
      registryClient,
      voters,
      boxReferences,
      xgovDaemon,
      txnIndex === 0,
    );

    // Add this transaction to the group
    txnGroup.assignVoters(txnParams);

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
      `Successfully assigned ${groupVotersCount} voters to proposal ${proposalClient.appId} tx group ${txResponse.groupId}`,
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
 * Process a single proposal to assign voters
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
  apiUrl?: string,
): Promise<ProposalResult> {
  try {
    logger.info(`Processing proposal ${proposal.id}: ${proposal.title}`);

    // Get the proposal client
    const proposalClient = proposalFactory.getAppClientById({
      appId: proposal.id,
    });

    // Get the committee ID from the proposal client's global state
    const committeeId = await getCommitteeId(proposalClient);

    // Skip this proposal if no committee ID is found
    if (!committeeId) {
      throw new Error(`No committee ID found for proposal ${proposal.id}`);
    }

    const committeeIdStr = committeeId.toString("base64");
    logger.info(
      `Fetching committee data for proposal ${proposal.id} with committee ID: ${committeeIdStr}`,
    );

    // Get committee data using the committee ID
    const committeeData = await getCommitteeData(committeeId, apiUrl);

    // Skip this proposal if no committee data is found
    if (!committeeData) {
      throw new Error(
        `Failed to get committee data for ID: ${committeeIdStr})`,
      );
    }

    // Get eligible voters
    const { eligibleVoters, alreadyAssignedCount, totalVotersCount } =
      await getEligibleVoters(proposalClient, committeeData);

    // Nothing to do if all voters are already assigned
    if (eligibleVoters.length === 0) {
      logger.info(
        `All voters already assigned to proposal ${proposal.id}, skipping assignment`,
      );
      return {
        success: true,
        details: {
          id: proposal.id,
          title: proposal.title,
          voters: 0,
          skippedVoters: totalVotersCount,
          totalVoters: totalVotersCount,
          status: "success" as const,
        },
      };
    }

    let voterCount = 0;

    // Assign voters in batches for better efficiency
    if (
      eligibleVoters &&
      Array.isArray(eligibleVoters) &&
      eligibleVoters.length > 0
    ) {
      // Calculate max voters per group: First txn (7) + remaining txns (8 each)
      const MAX_VOTERS_PER_GROUP =
        FIRST_TXN_VOTERS + (MAX_GROUP_SIZE - 1) * OTHER_TXN_VOTERS; // = 7 + 15*8 = 127

      const votersInChunks = chunk(eligibleVoters, MAX_VOTERS_PER_GROUP);
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
      `Proposal ${proposal.id} assignment complete: ` +
      `${voterCount} voters assigned, ` +
      `${alreadyAssignedCount} duplicate voters skipped, ` +
      `${totalVotersCount} total committee members`,
    );

    // Return successful result
    return {
      success: true,
      details: {
        id: proposal.id,
        title: proposal.title,
        voters: voterCount,
        skippedVoters: alreadyAssignedCount,
        totalVoters: totalVotersCount,
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
  apiUrl?: string,
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
      apiUrl,
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
 * POST endpoint to assign voters to all submitted proposals.
 * This assigns voters from the committee to each proposal with status SUBMITTED.
 *
 * @param context The Astro API context
 * @returns A JSON response with the results of the assignment operation
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
        proposalIds.map((id) => getSubmittedProposal(id)),
      );
    } else {
      // Get all submitted proposals
      const allSubmittedProposals = await getSubmittedProposals();

      if (!allSubmittedProposals || allSubmittedProposals.length === 0) {
        return new Response(
          JSON.stringify({ message: "No submitted proposals found" }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      }

      proposalsToProcess = allSubmittedProposals;
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
        getStringEnvironmentVariable("COMMITTEE_API_URL", locals, ""),
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
            : `Processed ${proposalsToProcess.length} submitted proposals in ${executionTimeSeconds}s using parallel processing`,
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
    logger.error("Error in POST /api/assign:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process submitted proposals",
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
