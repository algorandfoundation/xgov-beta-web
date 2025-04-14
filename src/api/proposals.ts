import type { ProposalBrief, ProposalCategory, ProposalFocus, ProposalFundingType, ProposalJSON, ProposalMainCardDetails, ProposalStatus, ProposalSummaryCardDetails } from "@/types/proposals";
import type { AppState } from "@algorandfoundation/algokit-utils/types/app";
import { AppManager } from "@algorandfoundation/algokit-utils/types/app-manager";
import algosdk, { ABIType } from "algosdk";
import { CID } from "kubo-rpc-client";
import { AlgorandClient as algorand } from "src/algorand/algo-client";
import { getProposalClientById, RegistryClient } from "src/algorand/contract-clients";

function existsAndValue(appState: AppState, key: string): boolean {
    return key in appState && 'value' in appState[key];
}

export async function getAllProposals(): Promise<ProposalSummaryCardDetails[]> {
    try {
        const response = await algorand.client.algod.accountInformation(RegistryClient.appAddress).do();
        console.log("Account info received, processing apps...");
        
        return await Promise.all(response['created-apps'].map(async (data: any): Promise<ProposalSummaryCardDetails> => {
            try {
                const state = AppManager.decodeAppState(data.params['global-state']);
                
                let cid: Uint8Array<ArrayBufferLike> = new Uint8Array();
                if (state.cid && 'valueRaw' in state.cid) {
                    cid = state.cid.valueRaw;
                }

                let committeeId: Uint8Array<ArrayBufferLike> = new Uint8Array();
                if (state['committee_id'] && 'valueRaw' in state['committee_id']) {
                    committeeId = state['committee_id'].valueRaw;
                }

                let proposer = '';
                if (state.proposer && 'valueRaw' in state.proposer) {
                    proposer = algosdk.encodeAddress(state.proposer.valueRaw);
                }

                return {
                    id: data.id,
                    title: existsAndValue(state, 'title') ? String(state.title.value) : '',
                    cid,
                    requestedAmount: existsAndValue(state, 'requested_amount') ? BigInt(state['requested_amount'].value) : 0n,
                    proposer,
                    fundingType: existsAndValue(state, 'funding_type') ? Number(state['funding_type'].value) as ProposalFundingType : 0,
                    status: existsAndValue(state, 'status') ? Number(state.status.value) as ProposalStatus : 0,
                    focus: existsAndValue(state, 'focus') ? Number(state.focus.value) as ProposalFocus : 0,
                    fundingCategory: existsAndValue(state, 'funding_category') ? Number(state['funding_category'].value) as ProposalCategory : 0,
                    submissionTs: existsAndValue(state, 'submission_timestamp') ? BigInt(state['submission_timestamp'].value) : 0n,
                    approvals: existsAndValue(state, 'approvals') ? BigInt(state.approvals.value) : 0n,
                    rejections: existsAndValue(state, 'rejections') ? BigInt(state.rejections.value) : 0n,
                    nulls: existsAndValue(state, 'nulls') ? BigInt(state.nulls.value) : 0n,
                    committeeVotes: existsAndValue(state, 'committee_votes') ? BigInt(state['committee_votes'].value) : 0n,
                    registryAppId: existsAndValue(state, 'registry_app_id') ? BigInt(state['registry_app_id'].value) : 0n,
                    finalizationTs: existsAndValue(state, 'finalization_timestamp') ? BigInt(state['finalization_timestamp'].value) : 0n,
                    voteOpenTs: existsAndValue(state, 'vote_opening_timestamp') ? BigInt(state['vote_opening_timestamp'].value) : 0n,
                    lockedAmount: existsAndValue(state, 'locked_amount') ? BigInt(state['locked_amount'].value) : 0n,
                    committeeId,
                    committeeMembers: existsAndValue(state, 'committee_members') ? BigInt(state['committee_members'].value) : 0n,
                    votedMembers: existsAndValue(state, 'voted_members') ? BigInt(state['voted_members'].value) : 0n,
                    coolDownStartTs: existsAndValue(state, 'cool_down_start_ts') ? BigInt(state['cool_down_start_ts'].value) : 0n
                }
            } catch (error) {
                console.error('Error processing app data:', error);
                throw error;
            }
        }));
    } catch (error) {
        console.error('Error getting all proposals:', error);
        throw error;
    }
}

export async function getProposalsByProposer(address: string): Promise<ProposalSummaryCardDetails[]> {
    return (await getAllProposals()).filter(proposal => proposal.proposer === address);
}

export async function getProposal(id: bigint): Promise<ProposalMainCardDetails> {
    const proposalClient = getProposalClientById(id);

    const results = await Promise.allSettled([
        algorand.client.algod.getApplicationByID(Number(id)).do(),
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

    if (!('valueRaw' in state.cid)) {
        throw new Error('CID not found');
    }

    const decodedCID = CID.decode(state.cid.valueRaw)
    const proposalJSON = await getProposalJSON(decodedCID.toString());

    let cid: Uint8Array<ArrayBufferLike> = new Uint8Array();
    if (state.cid && 'valueRaw' in state.cid) {
        cid = state.cid.valueRaw;
    }

    let committeeId: Uint8Array<ArrayBufferLike> = new Uint8Array();
    if (state['committee_id'] && 'valueRaw' in state['committee_id']) {
        committeeId = state['committee_id'].valueRaw;
    }

    let proposer = '';
    if (state.proposer && 'valueRaw' in state.proposer) {
        proposer = algosdk.encodeAddress(state.proposer.valueRaw);
    }

    return {
        id: data.id,
        title: existsAndValue(state, 'title') ? String(state.title.value) : '',
        cid,
        requestedAmount: existsAndValue(state, 'requested_amount') ? BigInt(state['requested_amount'].value) : 0n,
        proposer,
        fundingType: existsAndValue(state, 'funding_type') ? Number(state['funding_type'].value) as ProposalFundingType : 0,
        status: existsAndValue(state, 'status') ? Number(state.status.value) as ProposalStatus : 0,
        focus: existsAndValue(state, 'focus') ? Number(state.focus.value) as ProposalFocus : 0,
        fundingCategory: existsAndValue(state, 'funding_category') ? Number(state['funding_category'].value) as ProposalCategory : 0,
        submissionTs: existsAndValue(state, 'submission_timestamp') ? BigInt(state['submission_timestamp'].value) : 0n,
        approvals: existsAndValue(state, 'approvals') ? BigInt(state.approvals.value) : 0n,
        rejections: existsAndValue(state, 'rejections') ? BigInt(state.rejections.value) : 0n,
        nulls: existsAndValue(state, 'nulls') ? BigInt(state.nulls.value) : 0n,
        committeeVotes: existsAndValue(state, 'committee_votes') ? BigInt(state['committee_votes'].value) : 0n,
        registryAppId: existsAndValue(state, 'registry_app_id') ? BigInt(state['registry_app_id'].value) : 0n,
        finalizationTs: existsAndValue(state, 'finalization_timestamp') ? BigInt(state['finalization_timestamp'].value) : 0n,
        voteOpenTs: existsAndValue(state, 'vote_opening_timestamp') ? BigInt(state['vote_opening_timestamp'].value) : 0n,
        lockedAmount: existsAndValue(state, 'locked_amount') ? BigInt(state['locked_amount'].value) : 0n,
        committeeId,
        committeeMembers: existsAndValue(state, 'committee_members') ? BigInt(state['committee_members'].value) : 0n,
        votedMembers: existsAndValue(state, 'voted_members') ? BigInt(state['voted_members'].value) : 0n,
        coolDownStartTs: existsAndValue(state, 'cool_down_start_ts') ? BigInt(state['cool_down_start_ts'].value) : 0n,
        ...proposalJSON
    }
}

export async function getProposalJSON(cid: string): Promise<ProposalJSON> {
    return await (await fetch(`http://${cid}.ipfs.localhost:8080/`)).json() as ProposalJSON;
}

export async function getProposalBrief(ids: bigint[]): Promise<ProposalBrief[]> {
    return (await Promise.all(ids.map(id => getProposal(id)))).map(proposal => ({ id: proposal.id, status: proposal.status, title: proposal.title }));
}

export async function getVoterBox(id: bigint, address: string): Promise<{ votes: bigint, voted: boolean }> {
    const addr = algosdk.decodeAddress(address).publicKey;
    const voterBoxName = new Uint8Array(Buffer.concat([Buffer.from('V'), addr]));

    try {
        const voterBoxValue = await algorand.app.getBoxValueFromABIType({
            appId: id,
            boxName: voterBoxName,
            type: ABIType.from('(uint64,bool)')
        });

        if (!Array.isArray(voterBoxValue)) {
            throw new Error('Voter box value is not an array');
        }
        
        return {
            votes: voterBoxValue[0] as bigint,
            voted: voterBoxValue[1] as boolean
        };
    } catch (error) {
        console.error('getting voter box value:', error);
        return {
            votes: BigInt(0),
            voted: false
        };
    }
}