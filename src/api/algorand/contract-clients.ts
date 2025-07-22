import {
  XGovRegistryClient,
  type TypedGlobalState,
  type XGovRegistryComposer,
} from "@algorandfoundation/xgov/registry";
import { ProposalClient as XGovProposalClient } from "@algorandfoundation/xgov/proposal";
import { algorand, network } from "./algo-client";
import { env } from "@/constants";
import type { AlgorandClient } from "@algorandfoundation/algokit-utils";
import algosdk from "algosdk";
import { makePaymentTxnWithSuggestedParamsFromObject } from "algosdk";
import {
  fundingLogicSig,
  fundingLogicSigSigner,
} from "@/api/testnet-funding-logicsig";
import type { QueryObserverResult, RefetchOptions } from "@tanstack/react-query";
import { signup, unsubscribe } from "../registry";
import { wrapTransactionSigner, type TransactionState } from "@/hooks/useTransactionState";


const DEFAULT_REGISTRY_APP_ID = 16324508;
export const RegistryAppID: bigint = BigInt(
  env.PUBLIC_REGISTRY_APP_ID !== "<REPLACE_WITH_APPLICATION_ID>"
    ? env.PUBLIC_REGISTRY_APP_ID || DEFAULT_REGISTRY_APP_ID
    : DEFAULT_REGISTRY_APP_ID,
);

export const registryClient = algorand.client.getTypedAppClientById(
  XGovRegistryClient,
  { appId: RegistryAppID },
);

export function getRegistryClient(
  algorand: AlgorandClient,
): XGovRegistryClient {
  return algorand.client.getTypedAppClientById(XGovRegistryClient, {
    appId: RegistryAppID,
  });
}

// TODO: make prototype of the ProposalClient
registryClient.getState = async function (): Promise<TypedGlobalState> {
  return (
    await registryClient
      .newGroup()
      .getState({
        sender: registryClient.appAddress,
        args: {},
      })
      .simulate({
        skipSignatures: true,
      })
  ).returns[0] as TypedGlobalState;
};

export function getProposalClientById(appId: bigint) {
  return algorand.client.getTypedAppClientById(XGovProposalClient, { appId });
}

export async function setVotingAddress(
  activeAddress: string | null,
  transactionSigner: algosdk.TransactionSigner,
  setStatus: React.Dispatch<React.SetStateAction<TransactionState>>,
  address: string,
  refetch: (options?: RefetchOptions) => Promise<QueryObserverResult<any, Error>>
): Promise<void> {
  if (!transactionSigner) return;

  const wrappedTransactionSigner = wrapTransactionSigner(
    transactionSigner,
    setStatus,
  );

  setStatus("loading");

  if (!activeAddress || !wrappedTransactionSigner) {
    setStatus(new Error("No active address or transaction signer"));
    return;
  }

  try {
    await registryClient.send.setVotingAccount({
      sender: activeAddress,
      signer: wrappedTransactionSigner,
      args: {
        xgovAddress: activeAddress,
        votingAddress: address,
      },
      boxReferences: [
        new Uint8Array(
          Buffer.concat([
            Buffer.from("x"),
            algosdk.decodeAddress(activeAddress).publicKey,
          ]),
        ),
      ],
    });

    setStatus("confirmed");
    setTimeout(() => {
      setStatus("idle");
    }, 800);

  } catch (e) {
    setStatus(new Error(`Error: ${(e as Error).message}`));
    return;
  }

  refetch();
}

export async function subscribeXgov(
  activeAddress: string | null,
  transactionSigner: algosdk.TransactionSigner,
  setStatus: React.Dispatch<React.SetStateAction<TransactionState>>,
  xgovFee: bigint | undefined,
  refetch: (options?: RefetchOptions) => Promise<QueryObserverResult<any, Error>>
) {
  if (!transactionSigner) return;

  const wrappedTransactionSigner = wrapTransactionSigner(
    transactionSigner,
    setStatus,
  );

  setStatus("loading");

  if (!activeAddress || !wrappedTransactionSigner) {
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
    signer: wrappedTransactionSigner,
    args: {
      payment,
      votingAddress: activeAddress,
    },
    boxReferences: [
      new Uint8Array(
        Buffer.concat([
          Buffer.from("x"),
          algosdk.decodeAddress(activeAddress).publicKey,
        ]),
      ),
    ],
  });

  try {
    await builder.send();
    setStatus("confirmed");
    setTimeout(() => {
      setStatus("idle");
    }, 800);

  } catch (e) {
    setStatus(new Error((e as Error).message));
  }

  refetch();
};

export async function unsubscribeXgov(
  activeAddress: string | null,
  transactionSigner: algosdk.TransactionSigner,
  setStatus: React.Dispatch<React.SetStateAction<TransactionState>>,
  refetch: ((options?: RefetchOptions) => Promise<QueryObserverResult<any, Error>>)[]
): Promise<void> {
  if (!transactionSigner) return;

  const wrappedTransactionSigner = wrapTransactionSigner(
    transactionSigner,
    setStatus,
  );

  setStatus("loading");

  if (!activeAddress || !wrappedTransactionSigner) {
    setStatus(new Error("No active address or transaction signer"));
    return;
  }

  await unsubscribe(activeAddress, wrappedTransactionSigner).catch((e: Error) => {
    console.error(`Error calling the contract: ${e.message}`);
    setStatus(new Error(`Error: ${(e as Error).message}`));
    return
  });

  Promise.all(refetch);
}

export async function subscribeProposer(
  activeAddress: string | null,
  transactionSigner: algosdk.TransactionSigner,
  setStatus: React.Dispatch<React.SetStateAction<TransactionState>>,
  amount: bigint,
  refetch: (options?: RefetchOptions) => Promise<QueryObserverResult<any, Error>>
) {
  if (!transactionSigner) return;

  const wrappedTransactionSigner = wrapTransactionSigner(
    transactionSigner,
    setStatus,
  );

  setStatus("loading");

  if (!activeAddress || !wrappedTransactionSigner) {
    setStatus(new Error("No active address or transaction signer"));
    return;
  }

  await signup(activeAddress, wrappedTransactionSigner, amount).catch((e: Error) => {
    console.error(`Error calling the contract: ${e.message}`);
    setStatus(new Error(`Error: ${(e as Error).message}`));
    return
  });

  refetch();
};