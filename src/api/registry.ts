import type { TypedGlobalState } from "@algorandfoundation/xgov/registry";
import {env} from '@/constants'
import algosdk, {
  ABIType,
  ALGORAND_MIN_TX_FEE,
  makePaymentTxnWithSuggestedParamsFromObject,
  type TransactionSigner,
} from "algosdk";

import type { ProposerBoxState } from "./types";
import { algod, algorand, RegistryAppID, registryClient } from "./algorand";

console.log("registry app id", env.PUBLIC_REGISTRY_APP_ID);
const registryAppID: number = env.PUBLIC_REGISTRY_APP_ID;

import { Buffer } from "buffer";
if (globalThis.Buffer === undefined) {
  globalThis.Buffer = Buffer;
}
export async function getGlobalState(): Promise<TypedGlobalState | undefined> {
  try {
    return await registryClient.getState();
  } catch (e) {
    console.error("failed to fetch global registry contract state", e);
    return {} as TypedGlobalState;
  }
}

export async function getIsXGov(
  address: string,
): Promise<{ isXGov: boolean; votingAddress: string }> {
  const addr = algosdk.decodeAddress(address).publicKey;
  const xGovBoxName = new Uint8Array(Buffer.concat([Buffer.from("x"), addr]));

  try {
    const xgovBoxValue = await algod
      .getApplicationBoxByName(registryAppID, xGovBoxName)
      .do();

    let votingAddress: string = "";
    if (!!xgovBoxValue && !!xgovBoxValue.value) {
      votingAddress = algosdk.encodeAddress(xgovBoxValue.value);
    }

    return {
      isXGov: true,
      votingAddress,
    };
  } catch (e) {
    console.error(e);
    return {
      isXGov: false,
      votingAddress: "",
    };
  }
}

export async function getIsProposer(
  address: string,
): Promise<{ isProposer: boolean } & ProposerBoxState> {
  const addr = algosdk.decodeAddress(address).publicKey;
  const proposerBoxName = new Uint8Array(
    Buffer.concat([Buffer.from("p"), addr]),
  );

  try {
    const proposerBoxValue = await algorand.app.getBoxValueFromABIType({
      appId: BigInt(registryAppID),
      boxName: proposerBoxName,
      type: ABIType.from("(bool,bool,uint64)"),
    });

    if (!Array.isArray(proposerBoxValue) || proposerBoxValue.length !== 3) {
      return {
        isProposer: false,
        activeProposal: false,
        kycStatus: false,
        kycExpiring: BigInt(0),
      };
    }

    return {
      isProposer: true,
      activeProposal: proposerBoxValue[0] as boolean,
      kycStatus: proposerBoxValue[1] as boolean,
      kycExpiring: proposerBoxValue[2] as bigint,
    };
  } catch (e) {
    console.error(e);
    return {
      isProposer: false,
      activeProposal: false,
      kycStatus: false,
      kycExpiring: BigInt(0),
    };
  }
}

export async function getAllProposers(): Promise<{
  [key: string]: ProposerBoxState;
}> {
  const proposers: { [key: string]: ProposerBoxState } = {};
  const boxes = await algorand.client.algod
    .getApplicationBoxes(registryAppID)
    .do();

  for (const box of boxes.boxes) {
    if (box.name[0] !== 112) {
      continue;
    }

    const proposerBoxValue = await algorand.app.getBoxValueFromABIType({
      appId: BigInt(registryAppID),
      boxName: box.name,
      type: ABIType.from("(bool,bool,uint64)"),
    });

    if (!Array.isArray(proposerBoxValue) || proposerBoxValue.length !== 3) {
      throw new Error("invalid proposer box value");
    }

    const proposer: ProposerBoxState = {
      activeProposal: proposerBoxValue[0] as boolean,
      kycStatus: proposerBoxValue[1] as boolean,
      kycExpiring: proposerBoxValue[2] as bigint,
    };

    const addr = algosdk.encodeAddress(Buffer.from(box.name.slice(1)));

    proposers[addr] = proposer;
  }

  return proposers;
}

export async function getAllSubscribedXGovs(): Promise<string[]> {
  const boxes = await algorand.client.algod
    .getApplicationBoxes(registryAppID)
    .do();

  const xGovBoxes = boxes.boxes.filter((box) => {
    const boxName = new TextDecoder().decode(box.name);
    return boxName.startsWith("x");
  });

  return xGovBoxes.map((box) => {
    return algosdk.encodeAddress(Buffer.from(box.name.slice(1)));
  });
}

export async function signup(
  address: string,
  transactionSigner: TransactionSigner,
) {
  const suggestedParams = await algorand.getSuggestedParams();

  const payment = makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: algosdk.getApplicationAddress(RegistryAppID),
    amount: 10_000_000,
    suggestedParams,
  });

  return registryClient.send.subscribeProposer({
    sender: address,
    signer: transactionSigner,
    args: { payment },
    boxReferences: [
      new Uint8Array(
        Buffer.concat([
          Buffer.from("p"),
          algosdk.decodeAddress(address).publicKey,
        ]),
      ),
    ],
  });
}

export async function unsubscribe(
  address: string,
  transactionSigner: TransactionSigner,
) {
  return registryClient.send.unsubscribeXgov({
    sender: address,
    signer: transactionSigner,
    args: {
      xgovAddress: address,
    },
    extraFee: ALGORAND_MIN_TX_FEE.microAlgos(),
    boxReferences: [
      new Uint8Array(
        Buffer.concat([
          Buffer.from("x"),
          algosdk.decodeAddress(address).publicKey,
        ]),
      ),
    ],
  });
}
