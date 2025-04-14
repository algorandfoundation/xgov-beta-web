
import type { AppState } from "@algorandfoundation/algokit-utils/types/app";
import { AppManager } from "@algorandfoundation/algokit-utils/types/app-manager";
import algosdk, { ABIType, ALGORAND_MIN_TX_FEE, type TransactionSigner } from "algosdk";
import { CID } from "kubo-rpc-client";
import { ProposalFactory } from "@algorandfoundation/xgov";

import {
  type ProposalBrief,
  ProposalCategory,
  ProposalFocus,
  ProposalFundingType,
  type ProposalJSON,
  type ProposalMainCardDetails,
  ProposalStatus,
  type ProposalSummaryCardDetails,
} from "@/api/types";

import {
  algorand,
  getProposalClientById,
  registryClient,
} from "@/api/algorand";

import { PROPOSAL_FEE } from "@/constants.ts";
import { ipfsClient } from "@/api/ipfs.ts";
import { AlgoAmount } from "@algorandfoundation/algokit-utils/types/amount";

export const proposalFactory = new ProposalFactory({ algorand });

function existsAndValue(appState: AppState, key: string): boolean {
  return key in appState && 'value' in appState[key];
}

/**
 * Retrieves all proposals from a specific registry app on the Algorand blockchain.
 *
 * This method fetches information about created applications associated with the registry application address,
 * decodes the global state of each application, and returns an array of proposal summary details.
 *
 * @return A promise that resolves to an array of objects containing
 *         summarized details of each proposal, including id, title, CID, requested amount, proposer address,
 *         funding type, status, focus, category, and submission time.
 */
export async function getAllProposals(): Promise<ProposalSummaryCardDetails[]> {
  try {
    const response = await algorand.client.algod.accountInformation(registryClient.appAddress).do();
    console.log("Account info received, processing apps...");

    return await Promise.all(response['created-apps'].map(async (data: any): Promise<ProposalSummaryCardDetails> => {
      try {
        const state = AppManager.decodeAppState(data.params['global-state']);

        let cid: Uint8Array<ArrayBufferLike> = new Uint8Array();
        if (state.cid && 'valueRaw' in state.cid) {
          cid = state.cid.valueRaw;
        }

        let committeeId: Uint8Array<ArrayBufferLike> = new Uint8Array();
        if (state['committee_id'] && 'valueRaw' in state['committee_id']) {
          committeeId = state['committee_id'].valueRaw;
        }

        let proposer = '';
        if (state.proposer && 'valueRaw' in state.proposer) {
          proposer = algosdk.encodeAddress(state.proposer.valueRaw);
        }

        return {
          id: data.id,
          title: existsAndValue(state, 'title') ? String(state.title.value) : '',
          cid,
          requestedAmount: existsAndValue(state, 'requested_amount') ? BigInt(state['requested_amount'].value) : 0n,
          proposer,
          fundingType: existsAndValue(state, 'funding_type') ? Number(state['funding_type'].value) as ProposalFundingType : 0,
          status: existsAndValue(state, 'status') ? Number(state.status.value) as ProposalStatus : 0,
          focus: existsAndValue(state, 'focus') ? Number(state.focus.value) as ProposalFocus : 0,
          fundingCategory: existsAndValue(state, 'funding_category') ? Number(state['funding_category'].value) as ProposalCategory : 0,
          submissionTs: existsAndValue(state, 'submission_timestamp') ? BigInt(state['submission_timestamp'].value) : 0n,
          approvals: existsAndValue(state, 'approvals') ? BigInt(state.approvals.value) : 0n,
          rejections: existsAndValue(state, 'rejections') ? BigInt(state.rejections.value) : 0n,
          nulls: existsAndValue(state, 'nulls') ? BigInt(state.nulls.value) : 0n,
          committeeVotes: existsAndValue(state, 'committee_votes') ? BigInt(state['committee_votes'].value) : 0n,
          registryAppId: existsAndValue(state, 'registry_app_id') ? BigInt(state['registry_app_id'].value) : 0n,
          finalizationTs: existsAndValue(state, 'finalization_timestamp') ? BigInt(state['finalization_timestamp'].value) : 0n,
          voteOpenTs: existsAndValue(state, 'vote_opening_timestamp') ? BigInt(state['vote_opening_timestamp'].value) : 0n,
          lockedAmount: existsAndValue(state, 'locked_amount') ? BigInt(state['locked_amount'].value) : 0n,
          committeeId,
          committeeMembers: existsAndValue(state, 'committee_members') ? BigInt(state['committee_members'].value) : 0n,
          votedMembers: existsAndValue(state, 'voted_members') ? BigInt(state['voted_members'].value) : 0n,
          coolDownStartTs: existsAndValue(state, 'cool_down_start_ts') ? BigInt(state['cool_down_start_ts'].value) : 0n
        }
      } catch (error) {
        console.error('Error processing app data:', error);
        throw error;
      }
    }));
  } catch (error) {
    console.error('Error getting all proposals:', error);
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
  ])

  const data = results[0].status === "fulfilled" ? results[0].value : null;
  if (!data || data.params.creator !== registryClient.appAddress) {
    throw new Error("Proposal not found");
  }

  const state = results[1].status === "fulfilled" ? results[1].value : null;
  if (!state) {
    throw new Error("Proposal state not found");
  }

  if (!("valueRaw" in state.cid)) {
    throw new Error("CID not found");
  }

  const decodedCID = CID.decode(state.cid.valueRaw)
  const proposalJSON = await getProposalJSON(decodedCID.toString());

  let cid: Uint8Array<ArrayBufferLike> = new Uint8Array();
  if (state.cid && 'valueRaw' in state.cid) {
    cid = state.cid.valueRaw;
  }

  let committeeId: Uint8Array<ArrayBufferLike> = new Uint8Array();
  if (state['committee_id'] && 'valueRaw' in state['committee_id']) {
    committeeId = state['committee_id'].valueRaw;
  }

  let proposer = '';
  if (state.proposer && 'valueRaw' in state.proposer) {
    proposer = algosdk.encodeAddress(state.proposer.valueRaw);
  }

  return {
    id: data.id,
    title: existsAndValue(state, 'title') ? String(state.title.value) : '',
    cid,
    requestedAmount: existsAndValue(state, 'requested_amount') ? BigInt(state['requested_amount'].value) : 0n,
    proposer,
    fundingType: existsAndValue(state, 'funding_type') ? Number(state['funding_type'].value) as ProposalFundingType : 0,
    status: existsAndValue(state, 'status') ? Number(state.status.value) as ProposalStatus : 0,
    focus: existsAndValue(state, 'focus') ? Number(state.focus.value) as ProposalFocus : 0,
    fundingCategory: existsAndValue(state, 'funding_category') ? Number(state['funding_category'].value) as ProposalCategory : 0,
    submissionTs: existsAndValue(state, 'submission_timestamp') ? BigInt(state['submission_timestamp'].value) : 0n,
    approvals: existsAndValue(state, 'approvals') ? BigInt(state.approvals.value) : 0n,
    rejections: existsAndValue(state, 'rejections') ? BigInt(state.rejections.value) : 0n,
    nulls: existsAndValue(state, 'nulls') ? BigInt(state.nulls.value) : 0n,
    committeeVotes: existsAndValue(state, 'committee_votes') ? BigInt(state['committee_votes'].value) : 0n,
    registryAppId: existsAndValue(state, 'registry_app_id') ? BigInt(state['registry_app_id'].value) : 0n,
    finalizationTs: existsAndValue(state, 'finalization_timestamp') ? BigInt(state['finalization_timestamp'].value) : 0n,
    voteOpenTs: existsAndValue(state, 'vote_opening_timestamp') ? BigInt(state['vote_opening_timestamp'].value) : 0n,
    lockedAmount: existsAndValue(state, 'locked_amount') ? BigInt(state['locked_amount'].value) : 0n,
    committeeId,
    committeeMembers: existsAndValue(state, 'committee_members') ? BigInt(state['committee_members'].value) : 0n,
    votedMembers: existsAndValue(state, 'voted_members') ? BigInt(state['voted_members'].value) : 0n,
    coolDownStartTs: existsAndValue(state, 'cool_down_start_ts') ? BigInt(state['cool_down_start_ts'].value) : 0n,
    ...proposalJSON
  }
}

/**
 * Fetches and parses the proposal JSON from a given IPFS content identifier (CID).
 *
 * @param cid - The content identifier (CID) used to fetch the proposal JSON from IPFS.
 * @return A promise that resolves to the parsed ProposalJSON object.
 */
export async function getProposalJSON(cid: string): Promise<ProposalJSON> {
  return (await (
    await fetch(`http://127.0.0.1:8080/ipfs/${cid}`)
  ).json()) as ProposalJSON;
}

export async function getVoterBox(id: bigint, address: string): Promise<{ votes: bigint, voted: boolean }> {
  const addr = algosdk.decodeAddress(address).publicKey;
  const voterBoxName = new Uint8Array(Buffer.concat([Buffer.from('V'), addr]));

  try {
    const voterBoxValue = await algorand.app.getBoxValueFromABIType({
      appId: id,
      boxName: voterBoxName,
      type: ABIType.from('(uint64,bool)')
    });

    if (!Array.isArray(voterBoxValue)) {
      throw new Error('Voter box value is not an array');
    }

    return {
      votes: voterBoxValue[0] as bigint,
      voted: voterBoxValue[1] as boolean
    };
  } catch (error) {
    console.error('getting voter box value:', error);
    return {
      votes: BigInt(0),
      voted: false
    };
  }
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
): bigint {
  switch (category) {
    case ProposalCategory.ProposalCategorySmall:
      return durations[0];
    case ProposalCategory.ProposalCategoryMedium:
      return durations[1];
    case ProposalCategory.ProposalCategoryLarge:
      return durations[2];
    default:
      return BigInt(0);
  }
}

export type SubmitProps = {
  appId: bigint;
  cid: Uint8Array;
  data: {
    title: string;
    fundingType: ProposalFundingType;
    requestedAmount: bigint | number;
    focus: ProposalFocus;
  };
  submissionFee: bigint | number;
  address: string;
  transactionSigner: TransactionSigner;
};

export async function createProposal(
  address: string,
  data: any,
  transactionSigner: TransactionSigner,
  emptyProposal: ProposalSummaryCardDetails | null,
) {
  const proposalFee = PROPOSAL_FEE.microAlgo();
  const addr = algosdk.decodeAddress(address).publicKey;
  const proposerBoxName = new Uint8Array(
    Buffer.concat([Buffer.from("p"), addr]),
  );

  const suggestedParams = await algorand.getSuggestedParams();

  let appId: bigint = BigInt(0);
  if (!emptyProposal) {
    // open a proposal
    const result = await registryClient.send.openProposal({
      sender: address,
      signer: transactionSigner,
      args: {
        payment: algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          amount: proposalFee.microAlgos,
          from: address,
          to: registryClient.appAddress,
          suggestedParams,
        }),
      },
      boxReferences: [proposerBoxName],
      extraFee: (ALGORAND_MIN_TX_FEE * 2).microAlgos(),
    });

    // Store proposal ID if available
    if (!result.return) {
      console.error("Proposal creation failed");
      return;
    }

    console.log(`\nNew Proposal: ${result.return}\n`);
    appId = result.return;
  } else {
    appId = emptyProposal.id;
  }

  // instance a new proposal client
  const proposalClient = proposalFactory.getAppClientById({ appId });

  const { cid } = await ipfsClient.add(
    JSON.stringify(
      {
        description: data.description,
        team: data.team,
        additionalInfo: data.additionalInfo,
        openSource: data.openSource,
        adoptionMetrics: data.adoptionMetrics,
        forumLink: data.forumLink,
      },
      (_, value) =>
        typeof value === "bigint" ? value.toString() : value, // return everything else unchanged
    ),
    { cidVersion: 1 },
  );

  const requestedAmount = AlgoAmount.Algos(
    BigInt(data.requestedAmount),
  ).microAlgos;

  const proposalSubmissionFee = Math.trunc(
    Number((requestedAmount * BigInt(1_000)) / BigInt(10_000)),
  );

  console.log(`Payment Amount: ${proposalSubmissionFee}\n`);
  console.log(`Title: ${data.title}\n`);
  console.log(`Cid: ${cid.toString()}\n`);
  console.log(`Funding Type: ${data.fundingType}\n`);
  console.log(`Requested Amount: ${requestedAmount}\n`);
  console.log(`Focus: ${data.focus}\n\n`);

  await proposalClient.send.submit({
    sender: address,
    signer: transactionSigner,
    args: {
      payment: algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        amount: proposalSubmissionFee,
        from: address,
        to: proposalClient.appAddress,
        suggestedParams,
      }),
      title: data.title,
      cid: CID.asCID(cid)!.bytes,
      fundingType: Number(data.fundingType),
      requestedAmount,
      focus: Number(data.focus),
    },
    appReferences: [registryClient.appId],
  });
  console.log("Proposal submitted");
  return appId;
}

export async function updateProposal(
  activeAddress: string,
  data: any,
  transactionSigner: TransactionSigner,
  proposal: ProposalSummaryCardDetails,
) {
  const suggestedParams = await algorand.getSuggestedParams();

  // instance a new proposal client
  const proposalClient = proposalFactory.getAppClientById({
    appId: proposal.id,
  });

  const { cid } = await ipfsClient.add(
    JSON.stringify(
      {
        description: data.description,
        team: data.team,
        additionalInfo: data.additionalInfo,
        openSource: data.openSource,
        adoptionMetrics: data.adoptionMetrics,
        forumLink: data.forumLink,
      },
      (_, value) =>
        typeof value === "bigint" ? value.toString() : value, // return everything else unchanged
    ),
    { cidVersion: 1 },
  );

  const requestedAmount = AlgoAmount.Algos(
    BigInt(data.requestedAmount),
  ).microAlgos;

  const proposalSubmissionFee = Math.trunc(
    Number((requestedAmount * BigInt(1_000)) / BigInt(10_000)),
  );

  console.log(`Payment Amount: ${proposalSubmissionFee}\n`);
  console.log(`Title: ${data.title}\n`);
  console.log(`Cid: ${cid.toString()}\n`);
  console.log(`Funding Type: ${data.fundingType}\n`);
  console.log(`Requested Amount: ${requestedAmount}\n`);
  console.log(`Focus: ${data.focus}\n\n`);

  await proposalClient
    .newGroup()
    .drop({
      sender: activeAddress,
      signer: transactionSigner,
      args: {},
      appReferences: [registryClient.appId],
      accountReferences: [activeAddress],
      extraFee: (1000).microAlgos(),
    })
    .submit({
      sender: activeAddress,
      signer: transactionSigner,
      args: {
        payment: algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          amount: proposalSubmissionFee,
          from: activeAddress,
          to: proposalClient.appAddress,
          suggestedParams,
        }),
        title: data.title,
        cid: CID.asCID(cid)!.bytes,
        fundingType: Number(data.fundingType),
        requestedAmount,
        focus: Number(data.focus),
      },
      appReferences: [registryClient.appId],
    })
    .send();

  return proposal.id;
}
