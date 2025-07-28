import { env } from '@/constants'
import algosdk, {
  ABIType,
  ALGORAND_MIN_TX_FEE,
  makePaymentTxnWithSuggestedParamsFromObject,
  encodeAddress
} from "algosdk";
import type { RegistryGlobalState } from "./types";
import { algod, algorand, network, RegistryAppID, registryClient } from "./algorand";
import type { ProposerBoxValue, XGovBoxValue, XGovRegistryComposer } from '@algorandfoundation/xgov/registry';
import { fundingLogicSig, fundingLogicSigSigner } from '@/api/testnet-funding-logicsig';
import type { TransactionHandlerProps } from '@/api/types/transaction_state';
import { wrapTransactionSigner } from '@/hooks/useTransactionState';
import { Buffer } from "buffer";
import { sleep } from './nfd';
if (globalThis.Buffer === undefined) {
  globalThis.Buffer = Buffer;
}

console.log("registry app id", env.PUBLIC_REGISTRY_APP_ID);
const registryAppID: number = env.PUBLIC_REGISTRY_APP_ID;

export function proposerBoxName(address: string): Uint8Array {
  return new Uint8Array(
    Buffer.concat([
      Buffer.from("p"),
      algosdk.decodeAddress(address).publicKey,
    ]),
  );
}

export function xGovBoxName(address: string): Uint8Array {
  return new Uint8Array(
    Buffer.concat([
      Buffer.from("x"),
      algosdk.decodeAddress(address).publicKey,
    ]),
  );
}

export async function getGlobalState(): Promise<RegistryGlobalState | undefined> {
  try {
    const state = await registryClient.state.global.getAll()
    return {
      ...state,
      committeeManager: !!state.committeeManager ? encodeAddress(state.committeeManager.asByteArray()!) : '',
      xgovDaemon: !!state.xgovDaemon ? encodeAddress(state.xgovDaemon.asByteArray()!) : '',
      kycProvider: !!state.kycProvider ? encodeAddress(state.kycProvider.asByteArray()!) : '',
      xgovManager: !!state.xgovManager ? encodeAddress(state.xgovManager.asByteArray()!) : '',
      xgovPayor: !!state.xgovPayor ? encodeAddress(state.xgovPayor.asByteArray()!) : '',
      xgovCouncil: !!state.xgovCouncil ? encodeAddress(state.xgovCouncil.asByteArray()!) : '',
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
  try {
    const xgovBoxValue = (await registryClient.newGroup().getXgovBox({
      sender: address,
      args: {
        xgovAddress: address,
      },
      boxReferences: [
        xGovBoxName(address),
      ],
    }).simulate({
      skipSignatures: true,
    })).returns[0] as XGovBoxValue;

    return {
      isXGov: true,
      votingAddress: xgovBoxValue.votingAddress,
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
): Promise<{ isProposer: boolean } & ProposerBoxValue> {
  try {
    const proposerBoxValue = (await registryClient.newGroup().getProposerBox({
      sender: address,
      args: {
        proposerAddress: address,
      },
      boxReferences: [
        proposerBoxName(address),
      ],
    }).simulate({
      skipSignatures: true,
    })).returns[0] as ProposerBoxValue;

    return {
      isProposer: true,
      activeProposal: proposerBoxValue.activeProposal,
      kycStatus: proposerBoxValue.kycStatus,
      kycExpiring: proposerBoxValue.kycExpiring,
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
  [key: string]: ProposerBoxValue;
}> {
  const proposers: { [key: string]: ProposerBoxValue } = {};
  const boxes = await algorand.client.algod
    .getApplicationBoxes(registryAppID)
    .do();

  for (const box of boxes.boxes) {
    if (box.name[0] !== 112) {
      continue;
    }

    const addr = encodeAddress(Buffer.from(box.name.slice(1)));

    const proposerBoxValue = await getIsProposer(addr);

    proposers[addr] = proposerBoxValue;
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

export interface SubscribeXGovProps extends TransactionHandlerProps {
  xgovFee?: bigint
}

export async function subscribeXgov({
  activeAddress,
  innerSigner,
  setStatus,
  refetch,
  xgovFee,
}: SubscribeXGovProps) {
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

  if (!xgovFee) {
    setStatus(new Error("xgovFee is not set"));
    return;
  }

  const suggestedParams = await algorand.getSuggestedParams();

  const payment = makePaymentTxnWithSuggestedParamsFromObject({
    from: activeAddress,
    to: algosdk.getApplicationAddress(RegistryAppID),
    amount: xgovFee,
    suggestedParams,
  });

  let builder: XGovRegistryComposer<any> = registryClient.newGroup();

  if (network === "testnet") {
    builder = builder.addTransaction(
      await registryClient.algorand.createTransaction.payment({
        sender: fundingLogicSig.address(),
        receiver: activeAddress,
        amount: (100).algos(),
      }),
      fundingLogicSigSigner,
    );
  }

  builder = builder.subscribeXgov({
    sender: activeAddress,
    signer: transactionSigner,
    args: {
      payment,
      votingAddress: activeAddress,
    },
    boxReferences: [
      xGovBoxName(activeAddress),
    ],
  });

  try {
    await builder.send();
    setStatus("confirmed");
    await sleep(800);
    setStatus("idle");
    await Promise.all(refetch.map(r => r()));
  } catch (e: any) {
    console.error("Error during subscribeXgov:", e.message);
    setStatus(new Error(`Failed to subscribe to be a xGov`));
    return;
  }
};

export async function unsubscribeXgov({
  activeAddress,
  innerSigner,
  setStatus,
  refetch,
}: TransactionHandlerProps): Promise<void> {
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
    await registryClient.send.unsubscribeXgov({
      sender: activeAddress,
      signer: transactionSigner,
      args: {
        xgovAddress: activeAddress,
      },
      extraFee: ALGORAND_MIN_TX_FEE.microAlgos(),
      boxReferences: [
        xGovBoxName(activeAddress),
      ],
    });
  } catch (e: any) {
    console.error("Error during unsubscribeXgov:", e.message);
    setStatus(new Error(`Failed to unsubscribe from xGov`));
    return;
  }

  setStatus("confirmed");
  await sleep(800);
  setStatus("idle");
  await Promise.all(refetch.map(r => r()));
}

export interface SubscribeProposerProps extends TransactionHandlerProps {
  amount: bigint
}

export async function subscribeProposer({
  activeAddress,
  innerSigner,
  setStatus,
  refetch,
  amount,
}: SubscribeProposerProps) {
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

  const suggestedParams = await algorand.getSuggestedParams();

  const payment = makePaymentTxnWithSuggestedParamsFromObject({
    from: activeAddress,
    to: algosdk.getApplicationAddress(RegistryAppID),
    amount,
    suggestedParams,
  });

  let builder: XGovRegistryComposer<any> = registryClient.newGroup();

  if (network === "testnet") {
    builder = builder.addTransaction(
      await registryClient.algorand.createTransaction.payment({
        sender: fundingLogicSig.address(),
        receiver: activeAddress,
        amount: (100).algos(),
      }),
      fundingLogicSigSigner,
    );
  }

  builder = builder.subscribeProposer({
    sender: activeAddress,
    signer: transactionSigner,
    args: { payment },
    boxReferences: [
      proposerBoxName(activeAddress),
    ],
  });

  try {
    await builder.send();
  } catch (e: any) {
    console.error("Error during subscribeProposer:", e.message);
    setStatus(new Error(`Failed to subscribe to be a proposer`));
    return;
  }

  setStatus("confirmed");
  await sleep(800);
  setStatus("idle");
  await Promise.all(refetch.map(r => r()));
}

export interface SetVotingAddressProps extends TransactionHandlerProps {
  newAddress: string
}

export async function setVotingAddress({
  activeAddress,
  innerSigner,
  setStatus,
  refetch,
  newAddress,
}: SetVotingAddressProps): Promise<void> {
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
    await registryClient.send.setVotingAccount({
      sender: activeAddress,
      signer: transactionSigner,
      args: {
        xgovAddress: activeAddress,
        votingAddress: newAddress,
      },
      boxReferences: [
        xGovBoxName(activeAddress),
      ],
    });
  } catch (e: any) {
    console.error("Error during setVotingAddress:", e.message);
    setStatus(new Error('Failed to set voting address'));
    return;
  }

  setStatus("confirmed");
  await sleep(800);
  setStatus("idle");
  await Promise.all(refetch.map(r => r()));
}

export type SetProposerKYCNoWallet = Omit<SetProposerKYCProps, "innerSigner" | "activeAddress">

export interface SetProposerKYCProps extends TransactionHandlerProps {
  proposalAddress: string;
  kycStatus: boolean;
  expiration: number;
}

export async function setProposerKYC({
  activeAddress,
  innerSigner,
  setStatus,
  refetch,
  proposalAddress,
  kycStatus,
  expiration
}: SetProposerKYCProps) {
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
    // fund proposers on testnet if they have < 200A balance
    let shouldFund = false;
    if (network === "testnet" && kycStatus === true) {
      const { amount } = await algod.accountInformation(proposalAddress).do();
      if (amount < 200_000_000) {
        shouldFund = true;
      }
    }

    let builder = registryClient.newGroup().setProposerKyc({
      sender: activeAddress,
      signer: transactionSigner,
      args: {
        proposer: proposalAddress,
        kycStatus: kycStatus,
        kycExpiring: expiration,
      },
      boxReferences: [proposerBoxName(proposalAddress)],
    });

    if (shouldFund) {
      builder = builder.addTransaction(
        await registryClient.algorand.createTransaction.payment({
          sender: activeAddress,
          receiver: proposalAddress,
          amount: (200).algos(),
        }),
        transactionSigner,
      );
    }

    const { confirmations: [confirmation] } = await builder.send();

    if (
      confirmation.confirmedRound !== undefined &&
      confirmation.confirmedRound > 0 &&
      confirmation.poolError === ""
    ) {
      setStatus("confirmed");
      await sleep(800);
      setStatus("idle");
      await Promise.all(refetch.map(r => r()));
      return;
    }

    setStatus(new Error("Failed to confirm transaction submission"));
  } catch (e: any) {
    console.error("Error during setVotingAddress:", e.message);
    setStatus(new Error(`Failed to set proposer KYC`));
    return;
  }
}
