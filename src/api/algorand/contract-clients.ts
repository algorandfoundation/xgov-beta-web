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
import { signup } from "../registry";


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


export async function subscribeXgov(
  activeAddress: string | null,
  transactionSigner: algosdk.TransactionSigner,
  setSubscribeXGovLoading: (value: React.SetStateAction<boolean>) => void,
  xgovFee: bigint | undefined,
  refetch: (options?: RefetchOptions) => Promise<QueryObserverResult<any, Error>>
) {
  setSubscribeXGovLoading(true);

  if (!activeAddress || !transactionSigner) {
    console.error("No active address or transaction signer");
    setSubscribeXGovLoading(false);
    return;
  }

  if (!xgovFee) {
    console.error("xgovFee is not set");
    setSubscribeXGovLoading(false);
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
      new Uint8Array(
        Buffer.concat([
          Buffer.from("x"),
          algosdk.decodeAddress(activeAddress).publicKey,
        ]),
      ),
    ],
  });

  await builder.send().catch((e: Error) => {
    console.error(`Error calling the contract: ${e.message}`);
    setSubscribeXGovLoading(false);
    return;
  });

  refetch();
  setSubscribeXGovLoading(false);
};

export async function subscribeProposer(
  activeAddress: string | null,
  transactionSigner: algosdk.TransactionSigner,
  setSubscribeProposerLoading: React.Dispatch<React.SetStateAction<boolean>>,
  amount: bigint,
  refetch: (options?: RefetchOptions) => Promise<QueryObserverResult<any, Error>>
) {
    setSubscribeProposerLoading(true);

    if (!activeAddress || !transactionSigner) {
      console.error("No active address or transaction signer");
      setSubscribeProposerLoading(false);
      return;
    }

    await signup(activeAddress, transactionSigner, amount).catch((e: Error) => {
      console.error(`Error calling the contract: ${e.message}`);
      setSubscribeProposerLoading(false);
      return;
    });

    refetch();
    setSubscribeProposerLoading(false);
  };