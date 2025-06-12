import {env} from '@/constants'
import algosdk, {
  ABIType,
  ALGORAND_MIN_TX_FEE,
  makePaymentTxnWithSuggestedParamsFromObject,
  type TransactionSigner,
  encodeAddress
} from "algosdk";

import type { ProposerBoxState, RegistryGlobalState } from "./types";
import { algorand, RegistryAppID, registryClient } from "./algorand";

console.log("registry app id", env.PUBLIC_REGISTRY_APP_ID);
const registryAppID: number = env.PUBLIC_REGISTRY_APP_ID;

import { Buffer } from "buffer";
if (globalThis.Buffer === undefined) {
  globalThis.Buffer = Buffer;
}

export async function getGlobalState(): Promise<RegistryGlobalState | undefined> {
  try {
    const state = await registryClient.state.global.getAll()
    return {
      ...state,
      committeeManager: !!state.committeeManager ? encodeAddress(state.committeeManager.asByteArray()!) : '',
      committeePublisher: !!state.committeePublisher ? encodeAddress(state.committeePublisher.asByteArray()!) : '',
      kycProvider: !!state.kycProvider ? encodeAddress(state.kycProvider.asByteArray()!) : '',
      xgovManager: !!state.xgovManager ? encodeAddress(state.xgovManager.asByteArray()!) : '',
      xgovPayor: !!state.xgovPayor ? encodeAddress(state.xgovPayor.asByteArray()!) : '',
      xgovReviewer: !!state.xgovReviewer ? encodeAddress(state.xgovReviewer.asByteArray()!) : '',
      xgovSubscriber: !!state.xgovSubscriber ? encodeAddress(state.xgovSubscriber.asByteArray()!) : '',
    }

  } catch (e) {
    console.error("failed to fetch global registry contract state", e);
    return {} as RegistryGlobalState;
  }
}

export async function getIsXGov(
  address: string,
): Promise<{ isXGov: boolean; votingAddress: string }> {
  const addr = algosdk.decodeAddress(address).publicKey;
  const xGovBoxName = new Uint8Array(Buffer.concat([Buffer.from("x"), addr]));

  try {
    const xgovBoxValue = await algorand.app.getBoxValueFromABIType({
      appId: BigInt(registryAppID),
      boxName: xGovBoxName,
      type: ABIType.from("(address,uint64,uint64)"),
    });

    let votingAddress: string = "";
    if (!!xgovBoxValue && Array.isArray(xgovBoxValue)) {
      votingAddress = xgovBoxValue[0] as string;
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

    const addr = encodeAddress(Buffer.from(box.name.slice(1)));

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
    return encodeAddress(Buffer.from(box.name.slice(1)));
  });
}

export async function signup(
  address: string,
  transactionSigner: TransactionSigner,
  amount: bigint,
) {
  const suggestedParams = await algorand.getSuggestedParams();

  const payment = makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: algosdk.getApplicationAddress(RegistryAppID),
    amount,
    suggestedParams,
  });

  let builder: XGovRegistryComposer<any> = registryClient.newGroup();

  if (network === "testnet") {
    builder = builder.addTransaction(
      await registryClient.algorand.createTransaction.payment({
        sender: fundingLogicSig.address(),
        receiver: address,
        amount: (100).algos(),
      }),
      fundingLogicSigSigner,
    );
  }

  builder = builder.subscribeProposer({
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

  return builder.send();
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
