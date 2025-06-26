import {
  XGovRegistryClient,
  type TypedGlobalState,
} from "@algorandfoundation/xgov/registry";
import { ProposalClient as XGovProposalClient } from "@algorandfoundation/xgov/proposal";
import { algorand } from "./algo-client";
import { env } from "@/constants";
import type { AlgorandClient } from "@algorandfoundation/algokit-utils";

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
