import { AppManager } from "@algorandfoundation/algokit-utils/types/app-manager";
import { AlgoAmount } from "@algorandfoundation/algokit-utils/types/amount";
import algosdk, { ALGORAND_MIN_TX_FEE, type TransactionSigner } from "algosdk";
import { CID } from "kubo-rpc-client";

import { ProposalFactory } from "@algorandfoundation/xgov";

import {
  type ProposalBrief,
  ProposalCategory,
  ProposalFocus,
  ProposalFundingType,
  type ProposalJSON,
  type ProposalMainCardDetails,
  type ProposalSummaryCardDetails,
} from "@/api/types";

import {
  algorand,
  getProposalClientById,
  registryClient,
} from "@/api/algorand";

import { PROPOSAL_FEE } from "@/constants.ts";
import { ipfsClient } from "@/api/ipfs.ts";

export const proposalFactory = new ProposalFactory({ algorand });

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
  const response = await algorand.client.algod
    .accountInformation(registryClient.appAddress)
    .do();
  return await Promise.all(
    response["created-apps"].map(
      async (data: any): Promise<ProposalSummaryCardDetails> => {
        const state = AppManager.decodeAppState(data.params["global-state"]);

        const cid = String(state.cid.value);

        let proposer =
          "valueRaw" in state.proposer
            ? algosdk.encodeAddress(state.proposer.valueRaw)
            : "";

        return {
          id: data.id,
          title: String(state.title.value),
          cid,
          requestedAmount: BigInt(state["requested_amount"].value),
          proposer,
          fundingType: Number(state["funding_type"].value),
          status: Number(state.status.value),
          focus: Number(state.focus.value),
          category: Number(state["funding_category"].value),
          submissionTime: Number(state["submission_timestamp"].value),
        };
      },
    ),
  );
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
    // .accountInformation(proposalClient.appAddress).do(),
    proposalClient.appClient.getGlobalState(),
  ]);

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

  const cid = CID.decode(state.cid.valueRaw);
  const proposalJSON = await getProposalJSON(cid.toString());

  const proposer =
    "valueRaw" in state.proposer
      ? algosdk.encodeAddress(state.proposer.valueRaw)
      : "";

  const ret = {
    id: data.id,
    title: String(state.title.value),
    cid: cid.toString(),
    requestedAmount: BigInt(state["requested_amount"].value),
    proposer,
    fundingType: Number(state["funding_type"].value),
    status: Number(state.status.value),
    focus: Number(state.focus.value),
    category: Number(state["funding_category"].value),
    submissionTime: Number(state["submission_timestamp"].value),
    ...proposalJSON,
  };

  return ret;
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
