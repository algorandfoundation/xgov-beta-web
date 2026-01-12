import {
  XGovRegistryClient,
  type TypedGlobalState,
} from "@algorandfoundation/xgov/registry";
import { ProposalClient as XGovProposalClient } from "@algorandfoundation/xgov/proposal";
import { algorand } from "./algo-client";
import { env } from "@/constants";
import type { AlgorandClient } from "@algorandfoundation/algokit-utils";
import { CouncilClient } from "@algorandfoundation/xgov/council";

const DEFAULT_REGISTRY_APP_ID = 0;
export const RegistryAppID: bigint = BigInt(
  env.PUBLIC_REGISTRY_APP_ID !== "<REPLACE_WITH_REGISTRY_APP_ID>"
    ? env.PUBLIC_REGISTRY_APP_ID || DEFAULT_REGISTRY_APP_ID
    : DEFAULT_REGISTRY_APP_ID,
);

const DEFAULT_COUNCIL_APP_ID = 0;
export const CouncilAppID: bigint = BigInt(
  env.PUBLIC_COUNCIL_APP_ID !== "<REPLACE_WITH_COUNCIL_APP_ID>"
    ? env.PUBLIC_COUNCIL_APP_ID || DEFAULT_COUNCIL_APP_ID
    : DEFAULT_COUNCIL_APP_ID,
);

export const registryClient = enrichRegistryClient(
  algorand.client.getTypedAppClientById(XGovRegistryClient, {
    appId: RegistryAppID,
  }),
);

export function getRegistryClient(
  algorand: AlgorandClient,
): XGovRegistryClient {
  const registryClient = algorand.client.getTypedAppClientById(
    XGovRegistryClient,
    {
      appId: RegistryAppID,
    },
  );
  return enrichRegistryClient(registryClient);
}

function enrichRegistryClient(registryClient: XGovRegistryClient) {
  registryClient.getState = async function (): Promise<TypedGlobalState> {
    return (
      await registryClient
        .newGroup()
        .getState({
          sender: registryClient.appAddress.toString(),
          args: {},
        })
        .simulate({
          skipSignatures: true,
        })
    ).returns[0] as TypedGlobalState;
  };
  return registryClient;
}

export function getProposalClientById(appId: bigint, algorandClient: AlgorandClient = algorand): XGovProposalClient {
  return algorandClient.client.getTypedAppClientById(XGovProposalClient, { appId });
}

export const councilClient = algorand.client.getTypedAppClientById(
  CouncilClient,
  { appId: CouncilAppID },
);
