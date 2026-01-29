import type { AppState } from "@algorandfoundation/algokit-utils/types/app";
import { AppManager } from "@algorandfoundation/algokit-utils/types/app-manager";
import algosdk, {
  ABIType,
  type TransactionSigner,
} from "algosdk";
import { ProposalFactory, type VotingState } from "@algorandfoundation/xgov";

import {
  type ProposalBrief,
  ProposalCategory,
  ProposalFocus,
  ProposalFundingType,
  type ProposalJSON,
  type ProposalMainCardDetails,
  ProposalStatus,
  type ProposalSummaryCardDetails
} from "@/api/types";

import {
  algorand,
  getProposalClientById,
  registryClient,
} from "@/api/algorand";

import { FEE_SINK, PROPOSAL_FEE } from "@/constants.ts";
import { AlgoAmount } from "@algorandfoundation/algokit-utils/types/amount";
import { wrapTransactionSigner } from "@/hooks/useTransactionState";
import { proposalApprovalBoxName, proposerBoxName, xGovBoxName } from "./registry";
import type { TransactionHandlerProps } from "./types/transaction_state";
import { sleep } from "./nfd";
import { getCommitteeData, type CommitteeMember } from "./committee";

const PROPOSAL_APPROVAL_BOX_REFERENCE_COUNT = 4;

export const proposalFactory = new ProposalFactory({ algorand });

export const metadataBoxName = new Uint8Array(Buffer.from("M"));

export function voterBoxName(address: string): Uint8Array {
  const addr = algosdk.decodeAddress(address).publicKey;
  return new Uint8Array(Buffer.concat([Buffer.from('V'), addr]));
}

function existsAndValue(appState: AppState, key: string): boolean {
  return key in appState && "value" in appState[key];
}

/**
 * Retrieves all proposals from a specific registry app on the Algorand blockchain.
 *
 * This method fetches information about created applications associated with the registry application address,
 * decodes the global state of each application, and returns an array of proposal summary details.
 *
 * @return A promise that resolves to an array of objects containing
 *         summarized details of each proposal, including id, title, requested amount, proposer address,
 *         funding type, status, focus, category, and submission time.
 */
export async function getAllProposals(): Promise<ProposalSummaryCardDetails[]> {
  try {
    const response = await algorand.client.algod
      .accountInformation(registryClient.appAddress.toString())
      .do();
    console.log("Account info received, processing apps...");

    if (!response.createdApps) {
      throw new Error("No created apps found for registry");
    }

    return await Promise.all(
      response.createdApps.map(
        async (data: algosdk.modelsv2.Application): Promise<ProposalSummaryCardDetails> => {
          try {
            const state = AppManager.decodeAppState(
              data.params.globalState || [],
            );

            let committeeId: Uint8Array<ArrayBufferLike> = new Uint8Array();
            if (state["committee_id"] && "valueRaw" in state["committee_id"]) {
              committeeId = state["committee_id"].valueRaw;
            }

            let proposer = "";
            if (state.proposer && "valueRaw" in state.proposer) {
              proposer = algosdk.encodeAddress(state.proposer.valueRaw);
            }

            return {
              id: data.id,
              title: existsAndValue(state, "title")
                ? String(state.title.value)
                : "",
              requestedAmount: existsAndValue(state, "requested_amount")
                ? BigInt(state["requested_amount"].value)
                : 0n,
              proposer,
              fundingType: existsAndValue(state, "funding_type")
                ? (Number(state["funding_type"].value) as ProposalFundingType)
                : 0,
              status: existsAndValue(state, "status")
                ? (Number(state.status.value) as ProposalStatus)
                : 0,
              focus: existsAndValue(state, "focus")
                ? (Number(state.focus.value) as ProposalFocus)
                : 0,
              fundingCategory: existsAndValue(state, "funding_category")
                ? (Number(state["funding_category"].value) as ProposalCategory)
                : 0,
              openTs: existsAndValue(state, "open_timestamp")
                ? BigInt(state["open_timestamp"].value)
                : 0n,
              approvals: existsAndValue(state, "approvals")
                ? BigInt(state.approvals.value)
                : 0n,
              rejections: existsAndValue(state, "rejections")
                ? BigInt(state.rejections.value)
                : 0n,
              nulls: existsAndValue(state, "nulls")
                ? BigInt(state.nulls.value)
                : 0n,
              boycottedMembers: existsAndValue(state, "boycotted_members")
                ? BigInt(state["boycotted_members"].value)
                : 0n,
              committeeVotes: existsAndValue(state, "committee_votes")
                ? BigInt(state["committee_votes"].value)
                : 0n,
              registryAppId: existsAndValue(state, "registry_app_id")
                ? BigInt(state["registry_app_id"].value)
                : 0n,
              submissionTs: existsAndValue(state, "submission_timestamp")
                ? BigInt(state["submission_timestamp"].value)
                : 0n,
              voteOpenTs: existsAndValue(state, "vote_opening_timestamp")
                ? BigInt(state["vote_opening_timestamp"].value)
                : 0n,
              lockedAmount: existsAndValue(state, "locked_amount")
                ? BigInt(state["locked_amount"].value)
                : 0n,
              committeeId,
              committeeMembers: existsAndValue(state, "committee_members")
                ? BigInt(state["committee_members"].value)
                : 0n,
              votedMembers: existsAndValue(state, "voted_members")
                ? BigInt(state["voted_members"].value)
                : 0n,
              finalized: existsAndValue(state, "finalized")
                ? Boolean(state.finalized.value)
                : false,
            };
          } catch (error) {
            console.error("Error processing app data:", error);
            throw error;
          }
        },
      ),
    );
  } catch (error) {
    console.error("Error getting all proposals:", error);
    throw error;
  }
}

/**
 * Retrieves a list of proposals created by the specified proposer.
 *
 * @param address The address of the proposer whose proposals need to be fetched.
 * @return A promise that resolves to an array of ProposalSummaryCardDetails associated with the given proposer address.
 */
export async function getProposalsByProposer(
  address: string,
): Promise<ProposalSummaryCardDetails[]> {
  return (await getAllProposals()).filter(
    (proposal) => proposal.proposer === address,
  );
}

/**
 * Retrieves all proposals with status SUBMITTED.
 *
 * This function fetches all proposals and filters them to return only those
 * with a status of FINAL.
 *
 * @return A promise that resolves to an array of ProposalSummaryCardDetails with status SUBMITTED.
 */
export async function getSubmittedProposals(): Promise<
  ProposalSummaryCardDetails[]
> {
  return (await getAllProposals()).filter(
    (proposal) => proposal.status === ProposalStatus.ProposalStatusSubmitted,
  );
}

export async function getAllProposalsToUnassign(): Promise<
  ProposalSummaryCardDetails[]
> {
  return (await getAllProposals()).filter(
    (proposal) =>
      (
        proposal.status === ProposalStatus.ProposalStatusFunded ||
        proposal.status === ProposalStatus.ProposalStatusBlocked ||
        proposal.status === ProposalStatus.ProposalStatusRejected
      ) && !proposal.finalized,
  );
}

export async function getAllProposalsToDelete(): Promise<
  ProposalSummaryCardDetails[]
> {
  return (await getAllProposals()).filter(
    (proposal) => proposal.finalized && proposal.status === ProposalStatus.ProposalStatusDraft,
  );
}

/**
 * Retrieves proposal details for a given proposal ID.
 *
 * @param id - The unique identifier of the proposal.
 * @return A promise that resolves to the details of the proposal.
 * @throws {Error} If the proposal is not found, its state is missing, or if required fields are invalid.
 */
export async function getProposal(
  id: bigint,
): Promise<ProposalMainCardDetails> {
  const proposalClient = getProposalClientById(id);

  const results = await Promise.allSettled([
    algorand.client.algod.getApplicationByID(Number(id)).do(),
    proposalClient.appClient.getGlobalState(),
    algorand.app.getBoxValue(id, metadataBoxName),
  ]);

  const data = results[0].status === "fulfilled" ? results[0].value : null;
  if (!data || data.params.creator.toString() !== registryClient.appAddress.toString()) {
    throw new Error("Proposal not found");
  }

  const state = results[1].status === "fulfilled" ? results[1].value : null;
  if (!state) {
    throw new Error("Proposal state not found");
  }

  const metadata = results[2].status === "fulfilled" ? results[2].value : null;
  let proposalMetadata = {} as ProposalJSON;

  if (metadata) {
    try {
      proposalMetadata = JSON.parse(Buffer.from(metadata).toString());
    } catch (e: any) {
      throw new Error("Failed to parse proposal metadata: " + e);
    }
  }

  let committeeId: Uint8Array<ArrayBufferLike> = new Uint8Array();
  if (state["committee_id"] && "valueRaw" in state["committee_id"]) {
    committeeId = state["committee_id"].valueRaw;
  }

  let proposer = "";
  if (state.proposer && "valueRaw" in state.proposer) {
    proposer = algosdk.encodeAddress(state.proposer.valueRaw);
  }

  return {
    id: data.id,
    title: existsAndValue(state, "title") ? String(state.title.value) : "",
    requestedAmount: existsAndValue(state, "requested_amount")
      ? BigInt(state["requested_amount"].value)
      : 0n,
    proposer,
    fundingType: existsAndValue(state, "funding_type")
      ? (Number(state["funding_type"].value) as ProposalFundingType)
      : 0,
    status: existsAndValue(state, "status")
      ? (Number(state.status.value) as ProposalStatus)
      : 0,
    focus: existsAndValue(state, "focus")
      ? (Number(state.focus.value) as ProposalFocus)
      : 0,
    fundingCategory: existsAndValue(state, "funding_category")
      ? (Number(state["funding_category"].value) as ProposalCategory)
      : 0,
    openTs: existsAndValue(state, "open_timestamp")
      ? BigInt(state["open_timestamp"].value)
      : 0n,
    approvals: existsAndValue(state, "approvals")
      ? BigInt(state.approvals.value)
      : 0n,
    rejections: existsAndValue(state, "rejections")
      ? BigInt(state.rejections.value)
      : 0n,
    nulls: existsAndValue(state, "nulls") ? BigInt(state.nulls.value) : 0n,
    boycottedMembers: existsAndValue(state, "boycotted_members")
      ? BigInt(state["boycotted_members"].value)
      : 0n,
    committeeVotes: existsAndValue(state, "committee_votes")
      ? BigInt(state["committee_votes"].value)
      : 0n,
    registryAppId: existsAndValue(state, "registry_app_id")
      ? BigInt(state["registry_app_id"].value)
      : 0n,
    submissionTs: existsAndValue(state, "submission_timestamp")
      ? BigInt(state["submission_timestamp"].value)
      : 0n,
    voteOpenTs: existsAndValue(state, "vote_opening_timestamp")
      ? BigInt(state["vote_opening_timestamp"].value)
      : 0n,
    lockedAmount: existsAndValue(state, "locked_amount")
      ? BigInt(state["locked_amount"].value)
      : 0n,
    committeeId,
    committeeMembers: existsAndValue(state, "committee_members")
      ? BigInt(state["committee_members"].value)
      : 0n,
    votedMembers: existsAndValue(state, "voted_members")
      ? BigInt(state["voted_members"].value)
      : 0n,
    finalized: existsAndValue(state, "finalized")
      ? Boolean(state.finalized.value)
      : false,
    ...proposalMetadata,
  };
}

export async function getSubmittedProposal(
  id: bigint,
): Promise<ProposalMainCardDetails> {
  const proposalData = await getProposal(id);
  if (proposalData.status !== ProposalStatus.ProposalStatusSubmitted) {
    throw new Error("Proposal not in submitted state");
  }
  return proposalData;
}

export async function getProposalToUnassign(
  id: bigint,
): Promise<ProposalMainCardDetails> {
  const proposalData = await getProposal(id);
  if (
    (
      proposalData.status !== ProposalStatus.ProposalStatusFunded &&
      proposalData.status !== ProposalStatus.ProposalStatusBlocked &&
      proposalData.status !== ProposalStatus.ProposalStatusRejected
    ) || proposalData.finalized
  ) {
    throw new Error("Proposal not in unassignable state");
  }
  return proposalData;
}

export async function getProposalToDelete(
  id: bigint,
): Promise<ProposalMainCardDetails> {
  const proposalData = await getProposal(id);
  if (
    !proposalData.finalized || proposalData.status !== ProposalStatus.ProposalStatusDraft
  ) {
    throw new Error("Proposal not in deletable state");
  }
  return proposalData;
}

export async function getVotingState(id: bigint): Promise<VotingState> {
  const proposalClient = getProposalClientById(id);
  return (await proposalClient.newGroup().getVotingState({
    sender: FEE_SINK,
    args: {},
  }).simulate({
    skipSignatures: true,
  })).returns[0] as VotingState;
}

export async function getVoterBox(
  id: bigint,
  address: string,
): Promise<bigint> {
  const addr = algosdk.decodeAddress(address).publicKey;
  const voterBoxName = new Uint8Array(Buffer.concat([Buffer.from("V"), addr]));
  return await algorand.app.getBoxValueFromABIType({
    appId: id,
    boxName: voterBoxName,
    type: ABIType.from("uint64"),
  }) as bigint;
}

export async function getVotersInfo(id: bigint, committeeSubset: CommitteeMember[]): Promise<{ [address: string]: { votes: bigint, voted: boolean } }> {

  const voterBoxes = await Promise.allSettled(
    committeeSubset.map((member) => getVoterBox(id, member.address))
  );

  let votersInfo: { [address: string]: { votes: bigint, voted: boolean } } = {};
  voterBoxes.forEach((res, i) => {
    if (res.status === 'fulfilled') {
      votersInfo[committeeSubset[i].address] = {
        votes: BigInt(committeeSubset[i].votes),
        voted: false,
      };
    } else {
      votersInfo[committeeSubset[i].address] = {
        votes: BigInt(committeeSubset[i].votes),
        voted: true,
      };
    }
  });

  return votersInfo;
}

export async function getMetadata(id: bigint): Promise<ProposalJSON> {
  const metadata = await algorand.app.getBoxValue(
    id,
    metadataBoxName,
  );

  let proposalMetadata: ProposalJSON;
  try {
    proposalMetadata = JSON.parse(Buffer.from(metadata).toString());
  } catch (e: any) {
    throw new Error("Failed to parse proposal metadata: " + e);
  }

  return proposalMetadata;
}

/**
 * Fetches brief information about proposals based on their IDs.
 *
 * @param ids - An array of proposal IDs to fetch and process.
 * @return A promise that resolves to an array of ProposalBrief objects containing id, status, and title.
 */
export async function getProposalBrief(
  ids: bigint[],
): Promise<ProposalBrief[]> {
  return (await Promise.all(ids.map((id) => getProposal(id)))).map(
    (proposal) => ({
      id: proposal.id,
      status: proposal.status,
      title: proposal.title,
    }),
  );
}

export async function getProposalVoters(
  id: number,
  limit: number = 1000,
): Promise<string[]> {
  const boxes = await algorand.client.algod
    .getApplicationBoxes(id)
    .max(limit)
    .do();

  let addresses: string[] = [];
  boxes.boxes.map((box) => {
    if (new TextDecoder().decode(box.name).startsWith("V")) {
      addresses.push(algosdk.encodeAddress(Buffer.from(box.name.slice(1))));
    }
  });

  return addresses;
}

export async function getProposalVoterData(appId: bigint): Promise<{ address: string, votes: bigint, voted: boolean }[]> {
  const proposalClient = proposalFactory.getAppClientById({ appId });
  const committeeByteArray = await proposalClient.state.global.committeeId();

  if (!committeeByteArray) {
    throw new Error("Committee ID not found in proposal global state");
  }

  const committeeId = Buffer.from(committeeByteArray);
  const committeeData = await getCommitteeData(committeeId);

  if (!committeeData) {
    throw new Error("Committee data could not be retrieved");
  }

  const voterAddresses = await getProposalVoters(Number(appId));

  // iterate over the committee, if the member is not in the voterAddresses, voted is true
  let voterData: { address: string, votes: bigint, voted: boolean }[] = [];
  for (const member of committeeData.xGovs) {
    const voted = !voterAddresses.includes(member.address);
    voterData.push({
      address: member.address,
      votes: BigInt(member.votes),
      voted,
    });
  }

  return voterData;
}

/**
 * Retrieves the discussion duration based on the given proposal category.
 *
 * @param category - The category of the proposal which determines the discussion duration.
 * @param durations - An array of discussion durations for different proposal categories.
 *        The order of the durations corresponds to small, medium, and large categories respectively.
 * @return The discussion duration for the specified proposal category. If the category is not recognized, returns 0 as a default value.
 */
export function getDiscussionDuration(
  category: ProposalCategory,
  durations: [bigint, bigint, bigint, bigint],
): number {
  switch (category) {
    case ProposalCategory.ProposalCategorySmall:
      return Number(durations[0]);
    case ProposalCategory.ProposalCategoryMedium:
      return Number(durations[1]);
    case ProposalCategory.ProposalCategoryLarge:
      return Number(durations[2]);
    default:
      return 0;
  }
}

export function getVotingDuration(
  category: ProposalCategory,
  durations: readonly [bigint, bigint, bigint, bigint],
): number {
  switch (category) {
    case ProposalCategory.ProposalCategorySmall:
      return Number(durations[0]) * 1000;
    case ProposalCategory.ProposalCategoryMedium:
      return Number(durations[1]) * 1000;
    case ProposalCategory.ProposalCategoryLarge:
      return Number(durations[2]) * 1000;
    default:
      return 0;
  }
}

export async function createEmptyProposal({
  activeAddress,
  innerSigner,
  setStatus,
  refetch,
}: TransactionHandlerProps) {
  if (!innerSigner) return;

  const transactionSigner = wrapTransactionSigner(
    innerSigner,
    setStatus
  );
  setStatus("loading");

  if (!activeAddress || !transactionSigner) {
    setStatus(new Error("No active address or transaction signer"));
    return;
  }

  try {
    const proposalFee = PROPOSAL_FEE.microAlgo();

    const suggestedParams = await algorand.getSuggestedParams();
    const _proposalApprovalBoxName = proposalApprovalBoxName();

    const result = await registryClient.send.openProposal({
      sender: activeAddress,
      signer: transactionSigner,
      args: {
        payment: algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          amount: proposalFee.microAlgos,
          sender: activeAddress,
          receiver: registryClient.appAddress,
          suggestedParams,
        }),
      },
      boxReferences: [
        proposerBoxName(activeAddress),
        ...Array(PROPOSAL_APPROVAL_BOX_REFERENCE_COUNT).fill(_proposalApprovalBoxName)
      ],
      extraFee: (2_000).microAlgos(),
    });

    // Store proposal ID if available
    if (!result.return) {
      setStatus(new Error("Proposal creation failed"));
      return;
    }

    setStatus("confirmed");
    await sleep(800);
    setStatus("idle");
    await Promise.all(refetch.map(r => r()));

    return result.return;
  } catch (e: any) {
    if (e.message.includes("tried to spend")) {
      setStatus(new Error("Insufficient funds to create proposal."));
    } else {
      setStatus(new Error("Failed to create proposal: " + (e as Error).message));
    }
  }
}

export interface OpenProposalProps extends TransactionHandlerProps {
  data: any,
  appId: bigint;
  bps: bigint;
}

export async function openProposal({
  activeAddress,
  innerSigner,
  setStatus,
  refetch,
  data,
  appId,
  bps
}: OpenProposalProps) {
  if (!innerSigner) return;

  const transactionSigner = wrapTransactionSigner(
    innerSigner,
    setStatus
  );

  setStatus("loading");

  if (!activeAddress || !transactionSigner) {
    setStatus(new Error("No active address or transaction signer"));
    return;
  }

  try {
    const suggestedParams = await algorand.getSuggestedParams();

    const proposalClient = proposalFactory.getAppClientById({ appId });

    const metadata = new Uint8Array(
      Buffer.from(
        JSON.stringify(
          {
            description: data.description,
            team: data.team,
            additionalInfo: data.additionalInfo,
            openSource: data.openSource,
            adoptionMetrics: data.adoptionMetrics,
            forumLink: data.forumLink,
          },
          (_, value) => (typeof value === "bigint" ? value.toString() : value), // return everything else unchanged
        ),
      ),
    );

    let chunkedMetadata: Uint8Array<ArrayBuffer>[] = [];
    for (let j = 0; j < metadata.length; j += 2041) {
      const chunk = metadata.slice(j, j + 2041);
      chunkedMetadata.push(chunk);
    }

    const requestedAmount = AlgoAmount.Algos(
      BigInt(data.requestedAmount),
    ).microAlgos;

    const proposalSubmissionFee = Math.trunc(
      Number((requestedAmount * bps) / BigInt(10_000)),
    );

    const openGroup = proposalClient.newGroup().open({
      sender: activeAddress,
      signer: transactionSigner,
      args: {
        payment: algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          amount: proposalSubmissionFee,
          sender: activeAddress,
          receiver: proposalClient.appAddress,
          suggestedParams,
        }),
        title: data.title,
        fundingType: Number(data.fundingType),
        requestedAmount,
        focus: Number(data.focus),
      },
      appReferences: [registryClient.appId],
    });

    chunkedMetadata.map((chunk, index) => {
      openGroup.uploadMetadata({
        sender: activeAddress,
        signer: transactionSigner,
        args: {
          payload: chunk,
          isFirstInGroup: index === 0,
        },
        appReferences: [registryClient.appId],
        boxReferences: [metadataBoxName, metadataBoxName],
      });
    });

    await openGroup.send();

    setStatus("confirmed");
    await sleep(800);
    setStatus("idle");
    await Promise.all(refetch.map(r => r()));
  } catch (e: any) {
    if (e.message.includes("tried to spend")) {
      setStatus(new Error("Insufficient funds to open proposal."));
    } else {
      setStatus(new Error("Failed to open proposal: " + (e as Error).message));
    }
    return;
  }
}

export interface VoteProposalProps extends TransactionHandlerProps {
  xgovAddress: string | null;
  appId: bigint;
  approvals: number;
  rejections: number;
  voterInfo?: { votes: bigint; voted: boolean; };
}

export async function voteProposal({
  activeAddress,
  xgovAddress,
  innerSigner,
  setStatus,
  refetch,
  appId,
  approvals,
  rejections,
  voterInfo
}: VoteProposalProps) {
  if (!innerSigner) return;

  const transactionSigner = wrapTransactionSigner(
    innerSigner,
    setStatus,
  );

  setStatus("loading");

  if (!activeAddress || !transactionSigner) {
    setStatus(new Error("No active address or transaction signer"));
    return;
  }

  if (!voterInfo) {
    console.log('Voter info not found');
    return false;
  }

  if (!xgovAddress) {
    console.log('xGov address not found');
    return false;
  }

  try {
    const res = await registryClient.send.voteProposal({
      sender: activeAddress,
      signer: transactionSigner,
      args: {
        proposalId: appId,
        xgovAddress,
        approvalVotes: approvals,
        rejectionVotes: rejections,
      },
      appReferences: [appId],
      accountReferences: [activeAddress],
      boxReferences: [
        xGovBoxName(xgovAddress),
        { appId: appId, name: voterBoxName(xgovAddress) }
      ],
      extraFee: (1000).microAlgos(),
    });

    if (
      res.confirmation.confirmedRound !== undefined &&
      res.confirmation.confirmedRound > 0 &&
      res.confirmation.poolError === ''
    ) {
      setStatus("confirmed");
      await sleep(800);
      setStatus("idle");
      await Promise.all(refetch.map(r => r()));
      return;
    }

    console.error("Vote proposal failed:", res);
    setStatus(new Error("Failed to vote on the proposal."));
  } catch (e: any) {
    console.error("Error during voting:", e.message);
    setStatus(new Error("An error occurred while voting on the proposal: " + (e as Error).message));
    return;
  }
}

export interface UpdateMetadataProps extends TransactionHandlerProps {
  data: any;
  proposal: ProposalSummaryCardDetails;
}

export async function updateMetadata({
  activeAddress,
  innerSigner,
  setStatus,
  refetch,
  data,
  proposal,
}: UpdateMetadataProps) {
  if (!innerSigner) return;

  const transactionSigner = wrapTransactionSigner(
    innerSigner,
    setStatus,
  );

  setStatus("loading");

  if (!activeAddress || !transactionSigner) {
    setStatus(new Error("No active address or transaction signer"));
    return;
  }

  try {
    const proposalClient = proposalFactory.getAppClientById({
      appId: proposal.id,
    });

    const refCountNeeded =
      (await proposalClient.appClient.getBoxValue(metadataBoxName)).length /
      1024;

    const metadata = new Uint8Array(
      Buffer.from(
        JSON.stringify(
          {
            description: data.description,
            team: data.team,
            additionalInfo: data.additionalInfo,
            openSource: data.openSource,
            adoptionMetrics: data.adoptionMetrics,
            forumLink: data.forumLink,
          },
          (_, value) => (typeof value === "bigint" ? value.toString() : value), // return everything else unchanged
        ),
      ),
    );

    let chunkedMetadata: Uint8Array<ArrayBuffer>[] = [];
    for (let j = 0; j < metadata.length; j += 2041) {
      const chunk = metadata.slice(j, j + 2041);
      chunkedMetadata.push(chunk);
    }

    const updateMetadataGroup = proposalClient.newGroup();

    chunkedMetadata.map((chunk, index) => {
      updateMetadataGroup.uploadMetadata({
        sender: activeAddress,
        signer: transactionSigner,
        args: {
          payload: chunk,
          isFirstInGroup: index === 0,
        },
        appReferences: [registryClient.appId],
        boxReferences: [
          metadataBoxName,
          metadataBoxName,
          metadataBoxName,
          metadataBoxName,
          metadataBoxName,
          metadataBoxName,
          metadataBoxName,
        ],
      });
    });

    const opUpsNeeded = (refCountNeeded - chunkedMetadata.length * 7) / 7;
    if (opUpsNeeded > 0) {
      for (let i = 0; i < opUpsNeeded; i++) {
        updateMetadataGroup.opUp({
          sender: activeAddress,
          signer: transactionSigner,
          args: {},
          boxReferences: [
            metadataBoxName,
            metadataBoxName,
            metadataBoxName,
            metadataBoxName,
            metadataBoxName,
            metadataBoxName,
            metadataBoxName,
          ],
          note: `opup ${i}`,
        });
      }
    }

    await updateMetadataGroup.send();

    setStatus("confirmed");
    await sleep(800);
    setStatus("idle");
    await Promise.all(refetch.map(r => r()));

    return proposal.id;
  } catch (e: any) {
    if (e.message.includes("tried to spend")) {
      setStatus(new Error("Insufficient funds to update proposal metadata."));
    } else {
      setStatus(new Error("Failed to update proposal metadata: " + (e as Error).message));
    }
    return null;
  }
}

export interface DropProposalProps extends TransactionHandlerProps {
  appId: bigint;
}

export async function dropProposal({
  activeAddress,
  innerSigner,
  setStatus,
  refetch,
  appId,
}: DropProposalProps) {
  if (!innerSigner) return;

  const transactionSigner = wrapTransactionSigner(
    innerSigner,
    setStatus,
  );

  setStatus("loading");

  if (!activeAddress || !transactionSigner) {
    setStatus(new Error("No active address or transaction signer"));
    return;
  }

  try {
    const proposalFactory = new ProposalFactory({ algorand });
    const proposalClient = proposalFactory.getAppClientById({ appId });

    let grp = (
      await (
        await proposalClient
          .newGroup()
          .uploadMetadata({
            sender: activeAddress,
            signer: transactionSigner,
            args: {
              payload: metadataBoxName,
              isFirstInGroup: true
            },
            appReferences: [registryClient.appId],
            boxReferences: [
              metadataBoxName,
              metadataBoxName,
              metadataBoxName,
              metadataBoxName,
              metadataBoxName,
              metadataBoxName,
              metadataBoxName,
            ]
          })
          .uploadMetadata({
            sender: activeAddress,
            signer: transactionSigner,
            args: {
              payload: metadataBoxName,
              isFirstInGroup: false
            },
            appReferences: [registryClient.appId],
            boxReferences: [
              metadataBoxName,
              metadataBoxName,
              metadataBoxName,
              metadataBoxName,
              metadataBoxName,
              metadataBoxName,
              metadataBoxName,
            ],
          })
          .uploadMetadata({
            sender: activeAddress,
            signer: transactionSigner,
            args: {
              payload: metadataBoxName,
              isFirstInGroup: false
            },
            appReferences: [registryClient.appId],
            boxReferences: [
              metadataBoxName,
              metadataBoxName,
              metadataBoxName,
              metadataBoxName,
              metadataBoxName,
              metadataBoxName,
              metadataBoxName,
            ],
            note: '1'
          })
          .uploadMetadata({
            sender: activeAddress,
            signer: transactionSigner,
            args: {
              payload: metadataBoxName,
              isFirstInGroup: false
            },
            appReferences: [registryClient.appId],
            boxReferences: [
              metadataBoxName,
              metadataBoxName,
              metadataBoxName,
              metadataBoxName,
              metadataBoxName,
              metadataBoxName,
              metadataBoxName,
            ],
            note: '2'
          })
          .composer()
      ).build()
    ).transactions

    grp = grp.map((txn) => { txn.txn.group = undefined; return txn })

    const addr = algosdk.decodeAddress(activeAddress).publicKey;
    const proposerBoxName = new Uint8Array(Buffer.concat([Buffer.from('p'), addr]));

    const res = await registryClient
      .newGroup()
      .addTransaction(grp[0].txn, grp[0].signer)
      .addTransaction(grp[1].txn, grp[1].signer)
      .addTransaction(grp[2].txn, grp[2].signer)
      .addTransaction(grp[3].txn, grp[3].signer)
      .dropProposal({
        sender: activeAddress,
        signer: transactionSigner,
        args: { proposalId: appId },
        appReferences: [registryClient.appId],
        accountReferences: [activeAddress],
        boxReferences: [
          proposerBoxName,
          metadataBoxName,
          metadataBoxName,
        ],
        extraFee: (2000).microAlgos(),
      })
      .send()

    if (
      res.confirmations[4].confirmedRound !== undefined &&
      res.confirmations[4].confirmedRound > 0 &&
      res.confirmations[4].poolError === ""
    ) {
      setStatus("confirmed");
      await sleep(800);
      setStatus("idle");
      await Promise.all(refetch.map(r => r()));
      return;
    }

    setStatus(new Error("Transaction not confirmed."));
  } catch (error) {
    setStatus(new Error("An error occurred while dropping the proposal: " + (error as Error).message));
  }
};

export async function callScrutinize(
  address: string,
  appId: bigint,
  proposer: string,
  transactionSigner: TransactionSigner,
) {
  try {
    const registryAny = registryClient as unknown as {
      send?: Record<string, unknown>;
    };

    const sendAny = registryAny.send as Record<string, unknown> | undefined;
    const scrutinizeViaRegistry =
      (sendAny?.scrutinizeProposal as unknown) ||
      (sendAny?.scrutinize as unknown) ||
      (sendAny?.scrutinize_proposal as unknown);

    if (typeof scrutinizeViaRegistry === "function") {
      await (scrutinizeViaRegistry as (args: unknown) => Promise<unknown>)({
        sender: address,
        signer: transactionSigner,
        args: { proposalId: appId },
        appReferences: [appId],
        accountReferences: [proposer],
        extraFee: (1000).microAlgo(),
      });
      return;
    }

    // Backwards-compatible fallback: verify proposal via registry, then call proposal scrutiny.
    const proposalClient = proposalFactory.getAppClientById({ appId });
    const scrutiny = (
      await proposalClient.createTransaction.scrutiny({
        sender: address,
        signer: transactionSigner,
        args: {},
        appReferences: [registryClient.appId],
        accountReferences: [proposer],
        extraFee: (1000).microAlgo(),
      })
    ).transactions[0];

    await registryClient
      .newGroup()
      .isProposal({
        sender: address,
        signer: transactionSigner,
        args: { proposalId: appId },
        appReferences: [appId],
      })
      .addTransaction(scrutiny, transactionSigner)
      .send();
  } catch (e) {
    console.warn(`While calling scrutiny(${appId}):`, (e as Error).message)
  }
}

export async function callAssignVoters(proposalId: bigint) {
  console.log("Starting AssignVoters call", proposalId);
  const response = await fetch("/api/assign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      proposalIds: [proposalId.toString()],
    }),
  });
  console.log("Finished AssignVoters call");
  const data = await response.json();
  console.log("AssignVoters data:", data);
}

export async function callUnassign(
  proposalId: bigint | null,
): Promise<void> {
  console.log("Starting unassign call", proposalId);
  const response = await fetch("/api/unassign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      proposalIds: proposalId !== null ? [proposalId] : [],
    }),
  });
  console.log("Finished unassign call");
  const data = await response.json();
  console.log("Unassign data:", data);
}

export async function callDeleteProposal(
  proposalId: bigint | null,
): Promise<void> {
  console.log("Starting delete call", proposalId);
  const response = await fetch("/api/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      proposalIds: proposalId !== null ? [proposalId] : [],
    }),
  });
  console.log("Finished delete call");
  const data = await response.json();
  console.log("Delete data:", data);
}