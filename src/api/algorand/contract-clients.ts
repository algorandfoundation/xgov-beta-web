import {
  XGovRegistryClient,
  type TypedGlobalState,
} from "@algorandfoundation/xgov/registry";
import { ProposalClient as XGovProposalClient } from "@algorandfoundation/xgov/proposal";
import { algorand } from "./algo-client";

export const RegistryAppID: bigint = BigInt(
  import.meta.env.PUBLIC_REGISTRY_APP_ID || 16324508,
);

export const registryClient = algorand.client.getTypedAppClientById(
  XGovRegistryClient,
  { appId: RegistryAppID },
);

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
