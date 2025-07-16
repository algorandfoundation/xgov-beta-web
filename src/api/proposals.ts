import type { AppState } from "@algorandfoundation/algokit-utils/types/app";
import { AppManager } from "@algorandfoundation/algokit-utils/types/app-manager";
import algosdk, {
  ABIType,
  ALGORAND_MIN_TX_FEE,
  type TransactionSigner,
} from "algosdk";
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
import { AlgoAmount } from "@algorandfoundation/algokit-utils/types/amount";
import type { TransactionStatus } from "@/components/ConfirmationModal/ConfirmationModal";

export const proposalFactory = new ProposalFactory({ algorand });

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
      .accountInformation(registryClient.appAddress)
      .do();
    console.log("Account info received, processing apps...");

    return await Promise.all(
      response["created-apps"].map(
        async (data: any): Promise<ProposalSummaryCardDetails> => {
          try {
            const state = AppManager.decodeAppState(
              data.params["global-state"],
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
              submissionTs: existsAndValue(state, "submission_timestamp")
                ? BigInt(state["submission_timestamp"].value)
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
              committeeVotes: existsAndValue(state, "committee_votes")
                ? BigInt(state["committee_votes"].value)
                : 0n,
              registryAppId: existsAndValue(state, "registry_app_id")
                ? BigInt(state["registry_app_id"].value)
                : 0n,
              finalizationTs: existsAndValue(state, "finalization_timestamp")
                ? BigInt(state["finalization_timestamp"].value)
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
 * Retrieves all proposals with status FINAL.
 *
 * This function fetches all proposals and filters them to return only those
 * with a status of FINAL.
 *
 * @return A promise that resolves to an array of ProposalSummaryCardDetails with status FINAL.
 */
export async function getFinalProposals(): Promise<
  ProposalSummaryCardDetails[]
> {
  return (await getAllProposals()).filter(
    (proposal) => proposal.status === ProposalStatus.ProposalStatusFinal,
  );
}

export async function getAllProposalsToUnassign(): Promise<
  ProposalSummaryCardDetails[]
> {
  return (await getAllProposals()).filter(
    (proposal) =>
      proposal.status === ProposalStatus.ProposalStatusFunded ||
      proposal.status === ProposalStatus.ProposalStatusBlocked ||
      proposal.status === ProposalStatus.ProposalStatusRejected,
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
    algorand.app.getBoxValue(id, new Uint8Array(Buffer.from("M"))),
  ]);

  const data = results[0].status === "fulfilled" ? results[0].value : null;
  if (!data || data.params.creator !== registryClient.appAddress) {
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
    submissionTs: existsAndValue(state, "submission_timestamp")
      ? BigInt(state["submission_timestamp"].value)
      : 0n,
    approvals: existsAndValue(state, "approvals")
      ? BigInt(state.approvals.value)
      : 0n,
    rejections: existsAndValue(state, "rejections")
      ? BigInt(state.rejections.value)
      : 0n,
    nulls: existsAndValue(state, "nulls") ? BigInt(state.nulls.value) : 0n,
    committeeVotes: existsAndValue(state, "committee_votes")
      ? BigInt(state["committee_votes"].value)
      : 0n,
    registryAppId: existsAndValue(state, "registry_app_id")
      ? BigInt(state["registry_app_id"].value)
      : 0n,
    finalizationTs: existsAndValue(state, "finalization_timestamp")
      ? BigInt(state["finalization_timestamp"].value)
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
    ...proposalMetadata,
  };
}

export async function getFinalProposal(
  id: bigint,
): Promise<ProposalMainCardDetails> {
  const proposalData = await getProposal(id);
  if (proposalData.status !== ProposalStatus.ProposalStatusFinal) {
    throw new Error("Proposal not in final state");
  }
  return proposalData;
}

export async function getProposalToUnassign(
  id: bigint,
): Promise<ProposalMainCardDetails> {
  const proposalData = await getProposal(id);
  if (
    proposalData.status !== ProposalStatus.ProposalStatusFunded &&
    proposalData.status !== ProposalStatus.ProposalStatusBlocked &&
    proposalData.status !== ProposalStatus.ProposalStatusRejected
  ) {
    throw new Error("Proposal not in unassignable state");
  }
  return proposalData;
}

export async function getVoterBox(
  id: bigint,
  address: string,
): Promise<{ votes: bigint; voted: boolean }> {
  const addr = algosdk.decodeAddress(address).publicKey;
  const voterBoxName = new Uint8Array(Buffer.concat([Buffer.from("V"), addr]));

  try {
    const voterBoxValue = await algorand.app.getBoxValueFromABIType({
      appId: id,
      boxName: voterBoxName,
      type: ABIType.from("(uint64,bool)"),
    });

    if (!Array.isArray(voterBoxValue)) {
      throw new Error("Voter box value is not an array");
    }

    return {
      votes: voterBoxValue[0] as bigint,
      voted: voterBoxValue[1] as boolean,
    };
  } catch (error) {
    console.error("getting voter box value:", error);
    return {
      votes: BigInt(0),
      voted: false,
    };
  }
}

export async function getMetadata(id: bigint): Promise<ProposalJSON> {
  const metadata = await algorand.app.getBoxValue(
    id,
    new Uint8Array(Buffer.from("M")),
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

  let voterBoxes: Uint8Array<ArrayBufferLike>[] = []
  boxes.boxes.map((box) => {
    if (new TextDecoder().decode(box.name).startsWith("V")) {
      voterBoxes.push(box.name);
    }
  });

  let addresses: string[] = [];
  (await algorand.app.getBoxValuesFromABIType({
    appId: BigInt(id),
    boxNames: voterBoxes,
    type: algosdk.ABIType.from('(uint64,bool)')
  })).map((value, i) => {
    if (Array.isArray(value) && value[1]) {
      addresses.push(algosdk.encodeAddress(Buffer.from(voterBoxes[i].slice(1))));
    }
  });

  return addresses;
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

export function getXGovQuorum(
  category: ProposalCategory,
  thresholds: [bigint, bigint, bigint],
): number {
  switch (category) {
    case ProposalCategory.ProposalCategorySmall:
      return Number(thresholds[0]) / 100;
    case ProposalCategory.ProposalCategoryMedium:
      return Number(thresholds[1]) / 100;
    case ProposalCategory.ProposalCategoryLarge:
      return Number(thresholds[2]) / 100;
    default:
      return 0;
  }
}

export function getVoteQuorum(
  category: ProposalCategory,
  thresholds: [bigint, bigint, bigint],
): number {
  switch (category) {
    case ProposalCategory.ProposalCategorySmall:
      return Number(thresholds[0]) / 100;
    case ProposalCategory.ProposalCategoryMedium:
      return Number(thresholds[1]) / 100;
    case ProposalCategory.ProposalCategoryLarge:
      return Number(thresholds[2]) / 100;
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

export async function openProposal(
  address: string,
  transactionSigner: TransactionSigner,
  setStatus: (status: TransactionStatus) => void,
) {
  const wrappedTransactionSigner = wrapTransactionSigner(transactionSigner, setStatus)
  setStatus("loading");

  try {
    const proposalFee = PROPOSAL_FEE.microAlgo();
    const addr = algosdk.decodeAddress(address).publicKey;
    const proposerBoxName = new Uint8Array(
      Buffer.concat([Buffer.from("p"), addr]),
    );

    const suggestedParams = await algorand.getSuggestedParams();

    // open a proposal
    const result = await registryClient.send.openProposal({
      sender: address,
      signer: wrappedTransactionSigner,
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
      setStatus(new Error("Proposal creation failed"));
      return;
    }

    setStatus("idle");

    return result.return;
  } catch (e: any) {
    if (e.message.includes("tried to spend")) {
      setStatus(new Error("Insufficient funds to create proposal."));
    } else {
      setStatus(new Error("Failed to create proposal."));
    }
  }
}

export function wrapTransactionSigner(
  transactionSigner: TransactionSigner,
  setStatus: (s: TransactionStatus) => void,
): TransactionSigner {
  return async function (txns, idxs) {
    setStatus("signing");
    const signed = await transactionSigner(txns, idxs);
    setStatus("sending");
    return signed
  };
}

export async function submitProposal(
  address: string,
  data: any,
  transactionSigner: TransactionSigner,
  appId: bigint,
  bps: bigint,
  setStatus: (status: TransactionStatus) => void,
) {
  const wrappedTransactionSigner = wrapTransactionSigner(transactionSigner, setStatus)
  setStatus("loading");
  try {
    const metadataBoxName = new Uint8Array(Buffer.from("M"));

    const suggestedParams = await algorand.getSuggestedParams();

    // instance a new proposal client
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

    const submitGroup = proposalClient.newGroup().submit({
      sender: address,
      signer: wrappedTransactionSigner,
      args: {
        payment: algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          amount: proposalSubmissionFee,
          from: address,
          to: proposalClient.appAddress,
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
      submitGroup.uploadMetadata({
        sender: address,
        signer: wrappedTransactionSigner,
        args: {
          payload: chunk,
          isFirstInGroup: index === 0,
        },
        appReferences: [registryClient.appId],
        boxReferences: [metadataBoxName, metadataBoxName],
      });
    });

    await submitGroup.send();
    setStatus("idle");
  } catch (e: any) {
    if (e.message.includes("tried to spend")) {
      setStatus(new Error("Insufficient funds to submit proposal."));
    } else {
      setStatus(new Error("Failed to submit proposal."));
    }
  }
}

// export async function createProposal(
//   address: string,
//   data: any,
//   transactionSigner: TransactionSigner,
//   emptyProposal: ProposalSummaryCardDetails | null,
//   bps: bigint,
//   setCreateProposalLoading: (state: boolean) => void,
// ) {
//   setCreateProposalLoading(true);
//   try {
//     const proposalFee = PROPOSAL_FEE.microAlgo();
//     const addr = algosdk.decodeAddress(address).publicKey;
//     const proposerBoxName = new Uint8Array(
//       Buffer.concat([Buffer.from("p"), addr]),
//     );
//     const metadataBoxName = new Uint8Array(Buffer.from("M"));

//     const suggestedParams = await algorand.getSuggestedParams();

//     let appId: bigint = BigInt(0);
//     if (!emptyProposal) {
//       // open a proposal
//       const result = await registryClient.send.openProposal({
//         sender: address,
//         signer: transactionSigner,
//         args: {
//           payment: algosdk.makePaymentTxnWithSuggestedParamsFromObject({
//             amount: proposalFee.microAlgos,
//             from: address,
//             to: registryClient.appAddress,
//             suggestedParams,
//           }),
//         },
//         boxReferences: [proposerBoxName],
//         extraFee: (ALGORAND_MIN_TX_FEE * 2).microAlgos(),
//       });

//       // Store proposal ID if available
//       if (!result.return) {
//         console.error("Proposal creation failed");
//         setCreateProposalLoading(false);
//         return;
//       }

//       console.log(`\nNew Proposal: ${result.return}\n`);
//       appId = result.return;
//     } else {
//       appId = emptyProposal.id;
//     }

//     // instance a new proposal client
//     const proposalClient = proposalFactory.getAppClientById({ appId });

//     const metadata = new Uint8Array(Buffer.from(JSON.stringify(
//       {
//         description: data.description,
//         team: data.team,
//         additionalInfo: data.additionalInfo,
//         openSource: data.openSource,
//         adoptionMetrics: data.adoptionMetrics,
//         forumLink: data.forumLink,
//       },
//       (_, value) =>
//         typeof value === "bigint" ? value.toString() : value, // return everything else unchanged
//     )))

//     let chunkedMetadata: Uint8Array<ArrayBuffer>[] = []
//     for (let j = 0; j < metadata.length; j += 2041) {
//       const chunk = metadata.slice(j, j + 2041);
//       chunkedMetadata.push(chunk);
//     }

//     const requestedAmount = AlgoAmount.Algos(
//       BigInt(data.requestedAmount),
//     ).microAlgos;

//     const proposalSubmissionFee = Math.trunc(
//       Number((requestedAmount * bps) / BigInt(10_000)),
//     );

//     const submitGroup = proposalClient
//       .newGroup()
//       .submit({
//         sender: address,
//         signer: transactionSigner,
//         args: {
//           payment: algosdk.makePaymentTxnWithSuggestedParamsFromObject({
//             amount: proposalSubmissionFee,
//             from: address,
//             to: proposalClient.appAddress,
//             suggestedParams,
//           }),
//           title: data.title,
//           fundingType: Number(data.fundingType),
//           requestedAmount,
//           focus: Number(data.focus),
//         },
//         appReferences: [registryClient.appId],
//       });

//     chunkedMetadata.map((chunk, index) => {
//       submitGroup.uploadMetadata({
//         sender: address,
//         signer: transactionSigner,
//         args: {
//           payload: chunk,
//           isFirstInGroup: index === 0,
//         },
//         appReferences: [registryClient.appId],
//         boxReferences: [metadataBoxName, metadataBoxName]
//       })
//     })

//     console.log('metadata.length', metadata.length);

//     await submitGroup.send()

//     console.log("Proposal submitted");

//     return appId;
//   } catch (e) {
//     console.error(e)
//   }
//   setCreateProposalLoading(false);
// }

export async function updateMetadata(
  activeAddress: string,
  data: any,
  innerTransactionSigner: TransactionSigner,
  proposal: ProposalSummaryCardDetails,
  setStatus: (status: TransactionStatus) => void,
) {
  const transactionSigner = wrapTransactionSigner(innerTransactionSigner, setStatus);

  setStatus("loading");

  try {
    const metadataBoxName = new Uint8Array(Buffer.from("M"));

    // instance a new proposal client
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

    const resubmitGroup = proposalClient.newGroup();

    chunkedMetadata.map((chunk, index) => {
      resubmitGroup.uploadMetadata({
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
        resubmitGroup.opUp({
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

    await resubmitGroup.send();
    setStatus("idle");
    return proposal.id;
  } catch (e: any) {
    if (e.message.includes("tried to spend")) {
      setStatus(new Error("Insufficient funds to update proposal metadata."));
    } else {
      setStatus(new Error("Failed to update proposal metadata."));
    }
  }
}

export async function callScrutinize(
  address: string,
  appId: bigint,
  proposer: string,
  transactionSigner: TransactionSigner,
) {
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

  try {
    await registryClient
      .newGroup()
      .isProposal({
        sender: address,
        signer: transactionSigner,
        args: { proposalId: appId },
        appReferences: [appId]
      })
      .addTransaction(scrutiny, transactionSigner)
      .send()
  } catch (e) {
    console.warn(`While calling scrutiny(${appId}):`, (e as Error).message)
  }
}

export async function callFinalize(proposalId: bigint) {
  console.log("Staring finalize call", proposalId);
  const response = await fetch("/api/assign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      proposalIds: [proposalId],
    }),
  });
  console.log("Finished finalize call");
  const data = await response.json();
  console.log("Finalize data:", data);
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

// export async function resubmitProposal(
//   activeAddress: string,
//   data: any,
//   transactionSigner: TransactionSigner,
//   proposal: ProposalSummaryCardDetails,
//   bps: bigint,
//   setResubmitProposalLoading: (state: boolean) => void,
// ) {
//   setResubmitProposalLoading(true);

//   try {
//     const metadataBoxName = new Uint8Array(Buffer.from("M"))
//     const suggestedParams = await algorand.getSuggestedParams();

//     // instance a new proposal client
//     const proposalClient = proposalFactory.getAppClientById({
//       appId: proposal.id,
//     });

//     const metadata = new Uint8Array(Buffer.from(JSON.stringify(
//       {
//         description: data.description,
//         team: data.team,
//         additionalInfo: data.additionalInfo,
//         openSource: data.openSource,
//         adoptionMetrics: data.adoptionMetrics,
//         forumLink: data.forumLink,
//       },
//       (_, value) =>
//         typeof value === "bigint" ? value.toString() : value, // return everything else unchanged
//     )))

//     let chunkedMetadata: Uint8Array<ArrayBuffer>[] = []
//     for (let j = 0; j < metadata.length; j += 2041) {
//       const chunk = metadata.slice(j, j + 2041);
//       chunkedMetadata.push(chunk);
//     }

//     const requestedAmount = AlgoAmount.Algos(
//       BigInt(data.requestedAmount),
//     ).microAlgos;

//     const proposalSubmissionFee = Math.trunc(
//       Number((requestedAmount * bps) / BigInt(10_000)),
//     );

//     const resubmitGroup = proposalClient
//       .newGroup()
//       .drop({
//         sender: activeAddress,
//         signer: transactionSigner,
//         args: {},
//         appReferences: [registryClient.appId],
//         accountReferences: [activeAddress],
//         extraFee: (1000).microAlgos(),
//       })
//       .submit({
//         sender: activeAddress,
//         signer: transactionSigner,
//         args: {
//           payment: algosdk.makePaymentTxnWithSuggestedParamsFromObject({
//             amount: proposalSubmissionFee,
//             from: activeAddress,
//             to: proposalClient.appAddress,
//             suggestedParams,
//           }),
//           title: data.title,
//           fundingType: Number(data.fundingType),
//           requestedAmount,
//           focus: Number(data.focus),
//         },
//         appReferences: [registryClient.appId],
//       })

//     chunkedMetadata.map((chunk, index) => {
//       resubmitGroup.uploadMetadata({
//         sender: activeAddress,
//         signer: transactionSigner,
//         args: {
//           payload: chunk,
//           isFirstInGroup: index === 0,
//         },
//         appReferences: [registryClient.appId],
//         boxReferences: [metadataBoxName, metadataBoxName],
//       })
//     })

//     await resubmitGroup.send()

//     console.log("Proposal updated");

//     return proposal.id;
//   } catch (e) {
//     console.log(e)
//   }
//   setResubmitProposalLoading(false);
// }
