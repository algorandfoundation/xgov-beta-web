import algosdk, { ABIType, encodeAddress, encodeUint64 } from "algosdk";
import { algod, algorand, network, CouncilAppID, registryClient, councilClient, RegistryAppID } from "./algorand";
import { env } from "@/constants";
import { wrapTransactionSigner } from "@/hooks/useTransactionState";
import type { TransactionHandlerProps } from "./types/transaction_state";
import { sleep } from "./nfd";

const councilAppID: number = env.PUBLIC_COUNCIL_APP_ID;

export function CouncilMemberBoxName(address: string): Uint8Array {
  return new Uint8Array(
    Buffer.concat([
      Buffer.from("M"),
      algosdk.decodeAddress(address).publicKey,
    ]),
  );
}

export function CouncilVoteBoxName(proposalId: number): Uint8Array {
  return new Uint8Array(
    Buffer.concat([
      Buffer.from("V"),
      encodeUint64(proposalId),
    ]),
  );
}

export async function getAllCouncilMembers(): Promise<string[]> {
  const boxes = await algorand.client.algod
    .getApplicationBoxes(councilAppID)
    .do();

  console.log('boxes: ', boxes)

  const memberBoxes = boxes.boxes.filter((box) => {
    const boxName = new TextDecoder().decode(box.name);
    return boxName.startsWith("M");
  });

  return memberBoxes.map((box) => {
    return encodeAddress(Buffer.from(box.name.slice(1)));
  });
}

export async function isCouncilMember(address: string): Promise<boolean> {
  const allMembers = await getAllCouncilMembers();
  return allMembers.includes(address);
}

export async function getCouncilVotes(proposalId: number): Promise<{ address: string, block: boolean }[]> {
  const voteBoxName = CouncilVoteBoxName(proposalId);
  try {
    const voteBoxValue = await algorand.app.getBoxValueFromABIType({
      appId: BigInt(councilAppID),
      boxName: voteBoxName,
      type: ABIType.from("(address,bool)[]"),
    });

    if (!Array.isArray(voteBoxValue)) {
      throw new Error("Vote box value is not an array");
    }

    // Transform the raw vote data into the expected format
    return voteBoxValue.map((vote) => {
      const voteArray = vote as [string, boolean];
      return {
        address: voteArray[0],
        block: voteArray[1]
      };
    });
  } catch (error) {
    console.error("getting voter box value:", error);
    return []
  }
}

export interface CouncilVoteProps extends TransactionHandlerProps {
  appId: bigint;
  block: boolean;
  lastVoter: boolean;
}

export async function councilVote({
  activeAddress,
  innerSigner,
  setStatus,
  refetch,
  appId,
  block,
  lastVoter
}: CouncilVoteProps) {
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
    const res = await councilClient.send.vote({
      sender: activeAddress,
      signer: transactionSigner,
      args: {
        proposalId: appId,
        block
      },
      appReferences: [appId, RegistryAppID],
      boxReferences: [
        CouncilVoteBoxName(Number(appId)),
        CouncilMemberBoxName(activeAddress)
      ],
      extraFee: lastVoter ? (2_000).microAlgo() : (1_000).microAlgo()
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

    console.error("Vote failed:", res);
    setStatus(new Error("Failed to vote."));
  } catch (e: any) {
    console.error("Error during voting:", e.message);
    setStatus(new Error("An error occurred while voting."));
    return;
  }
}