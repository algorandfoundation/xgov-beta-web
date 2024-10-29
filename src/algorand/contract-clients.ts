import { XGovRegistryClient } from '@algorandfoundation/xgov/registry';
import { ProposalClient as XGovProposalClient } from '@algorandfoundation/xgov/proposal';
import { algod } from './algo-client';

export const RegistryAppID: bigint = BigInt(import.meta.env.PUBLIC_REGISTRY_APP_ID);

export const RegistryClient = new XGovRegistryClient(
    {
        resolveBy: 'id',
        id: RegistryAppID,
    },
    algod,
);

export const ProposalClient = new XGovProposalClient(
    {
        resolveBy: 'id',
        id: 0,
    },
    algod,
);