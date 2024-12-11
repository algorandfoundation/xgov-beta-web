import type { ProposalJSON, ProposalMainCardDetails, ProposalSummaryCardDetails } from "@/types/proposals";
import { AppManager } from "@algorandfoundation/algokit-utils/types/app-manager";
import algosdk from "algosdk";
import { AlgorandClient as algorand } from "src/algorand/algo-client";
import { getProposalClientById, RegistryClient } from "src/algorand/contract-clients";

export async function getAllProposals(): Promise<ProposalSummaryCardDetails[]> {
    const response = await algorand.client.algod.accountInformation(RegistryClient.appAddress).do();
    return await Promise.all(response['created-apps'].map(async (data: any): Promise<ProposalSummaryCardDetails> => {
        const state = AppManager.decodeAppState(data.params['global-state'])

        const cid = String(state.cid.value);

        let proposer = 'valueRaw' in state.proposer
        ? algosdk.encodeAddress(state.proposer.valueRaw)
        : '';

        const downstreamData = await Promise.allSettled([
            getProposalJSON(cid),
            Promise.reject('Not implemented')
            // getNonFungibleDomainName(proposer),
        ]);

        const proposalJSON = downstreamData[0].status === 'fulfilled'
            ? downstreamData[0].value
            : null;
        
        if (!proposalJSON) {
            throw new Error('Proposal JSON not found');
        }

        proposer = downstreamData[1].status === 'fulfilled'
            ? downstreamData[1].value
            : proposer;

        return {
            id: data.id,
            title: String(state.title.value),
            cid,
            requestedAmount: BigInt(state['requested_amount'].value),
            proposer,
            fundingType: Number(state['funding_type'].value),
            status: Number(state.status.value),
            category: proposalJSON.category
        }
    }));
}

export async function getProposalsByProposer(address: string): Promise<ProposalSummaryCardDetails[]> {
    return (await getAllProposals()).filter(proposal => proposal.proposer === address);
}

export async function getProposal(id: bigint): Promise<ProposalMainCardDetails> {
    const proposalClient = getProposalClientById(id);

    const results = await Promise.allSettled([
        algorand.client.algod.getApplicationByID(Number(id)).do(),
        // .accountInformation(proposalClient.appAddress).do(),
        proposalClient.appClient.getGlobalState(),
    ])

    const data = results[0].status === 'fulfilled' ? results[0].value : null;
    if (!data || data.params.creator !== RegistryClient.appAddress) {
        throw new Error('Proposal not found');
    }

    const state = results[1].status === 'fulfilled' ? results[1].value : null;
    if (!state) {
        throw new Error('Proposal state not found');
    }

    const cid = String(state.cid.value);
    const proposalJSON = await getProposalJSON(cid);

    const proposer = 'valueRaw' in state.proposer
        ? algosdk.encodeAddress(state.proposer.valueRaw)
        : '';

    return {
        id: data.id,
        title: String(state.title.value),
        cid,
        requestedAmount: BigInt(state['requested_amount'].value),
        proposer,
        fundingType: Number(state['funding_type'].value),
        status: Number(state.status.value),
        ...proposalJSON
    }
}

export async function getProposalJSON(cid: string): Promise<ProposalJSON> {
    return await (await fetch(`http://${cid}.ipfs.localhost:8080/`)).json() as ProposalJSON;
}