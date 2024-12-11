import { XGovRegistryClient } from '@algorandfoundation/xgov/registry';
import { ProposalClient as XGovProposalClient } from '@algorandfoundation/xgov/proposal';
import { AlgorandClient as algorand } from './algo-client'

export const RegistryAppID: bigint = BigInt(import.meta.env.PUBLIC_REGISTRY_APP_ID);

export const RegistryClient = algorand.client.getTypedAppClientById(XGovRegistryClient, { appId: RegistryAppID })

export function getProposalClientById(appId: bigint) {
    return algorand.client.getTypedAppClientById(XGovProposalClient, { appId })
}