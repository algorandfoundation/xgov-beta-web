import { XGovRegistryClient, XGovRegistryFactory } from '@algorandfoundation/xgov/registry';
import { ProposalClient as XGovProposalClient } from '@algorandfoundation/xgov/proposal';
import { AlgorandClient as algorand } from './algo-client'

export const RegistryAppID: bigint = BigInt(import.meta.env.PUBLIC_REGISTRY_APP_ID);

export const RegistryClient = algorand.client.getTypedAppClientById(XGovRegistryClient, {
    appId: RegistryAppID,
    // appName?: string | undefined;
    // defaultSender?: string | undefined;
    // defaultSigner?: algosdk.TransactionSigner | undefined;
    // approvalSourceMap?: algosdk.SourceMap | undefined;
    // clearSourceMap?: algosdk.SourceMap | undefined;
})

export const ProposalClient = algorand.client.getTypedAppClientById(XGovProposalClient, {
    appId: BigInt(0),
});