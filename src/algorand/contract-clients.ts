import { XGovRegistryClient, type TypedGlobalState } from '@algorandfoundation/xgov/registry';
import { ProposalClient as XGovProposalClient } from '@algorandfoundation/xgov/proposal';
import { AlgorandClient as algorand } from './algo-client'

import { FEE_SINK } from 'src/constants';

export const RegistryAppID: bigint = BigInt(import.meta.env.PUBLIC_REGISTRY_APP_ID || 16324508);

export const RegistryClient = algorand.client.getTypedAppClientById(XGovRegistryClient, { appId: RegistryAppID })

RegistryClient.getState = async function (): Promise<TypedGlobalState> {
    return (await RegistryClient
        .newGroup()
        .getState({
            sender: RegistryClient.appAddress,
            args: {},
        })
        .simulate({
            skipSignatures: true,
        })
    ).returns[0] as TypedGlobalState;
}

export function getProposalClientById(appId: bigint) {
    return algorand.client.getTypedAppClientById(XGovProposalClient, {
        appId,
        defaultSender: FEE_SINK
    })
}
