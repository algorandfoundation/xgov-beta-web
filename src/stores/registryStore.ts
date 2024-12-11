import algosdk, { ABIType } from 'algosdk';
import { map } from 'nanostores';
import { algod, AlgorandClient as algorand } from 'src/algorand/algo-client';
import { Buffer } from 'buffer';

import { RegistryClient } from 'src/algorand/contract-clients';

console.log('registry app id', import.meta.env.PUBLIC_REGISTRY_APP_ID);
const registryAppID: number = import.meta.env.PUBLIC_REGISTRY_APP_ID;

export interface ProposerBoxState {
    activeProposal: boolean;
    kycStatus: boolean;
    kycExpiring: bigint;
}

export interface RegistryContractStore {
    globalState: any;
    proposers: { [key: string]: ProposerBoxState };
    isXGov: boolean;
    votingAddress: string;
    isProposer: boolean;
    proposer?: ProposerBoxState;
}

export const $registryContractStore = map<RegistryContractStore>({
    globalState: false,
    proposers: {},
    isXGov: false,
    votingAddress: '',
    isProposer: false,
});

export async function initRegistryContractStore() {
    try {
        const state = await RegistryClient.appClient.getGlobalState();
        $registryContractStore.setKey('globalState', state);
    } catch (e) {
        console.error('failed to fetch global registry contract state', e);
    }
}

export async function initAddressRegistryContractStore(address: string) {
    const addr = algosdk.decodeAddress(address).publicKey;
    const xGovBoxName = new Uint8Array(Buffer.concat([Buffer.from('x'), addr]));
    const proposerBoxName = new Uint8Array(Buffer.concat([Buffer.from('p'), addr]));

    try {
        const results = await Promise.allSettled([
            algod.getApplicationBoxByName(Number(registryAppID), xGovBoxName).do(),
            algorand.app.getBoxValueFromABIType({
                appId: BigInt(registryAppID),
                boxName: proposerBoxName,
                type: ABIType.from('(bool,bool,uint64)')
            }),
            getAllProposers(),
        ]);
    
        const xgovBoxValue = results[0].status === 'fulfilled' ? results[0].value : null;

        let votingAddress: string = ''
        if (!!xgovBoxValue && !!xgovBoxValue.value) {
            votingAddress = algosdk.encodeAddress(xgovBoxValue.value);
        }

        const proposerBoxValue = results[1].status === 'fulfilled' ? results[1].value : null;

        let proposer: ProposerBoxState;
        if (Array.isArray(proposerBoxValue) && proposerBoxValue.length === 3) {
            proposer = {
                activeProposal: (proposerBoxValue[0] as boolean),
                kycStatus: (proposerBoxValue[1] as boolean),
                kycExpiring: (proposerBoxValue[2] as bigint),
            }
        } else {
            proposer = {
                activeProposal: false,
                kycStatus: false,
                kycExpiring: BigInt(0),
            }
        }

        const proposers = results[2].status === 'fulfilled' ? results[2].value : {};

        $registryContractStore.set({
            globalState: $registryContractStore.value?.globalState,
            proposers,
            isXGov: results[0].status === 'fulfilled',
            votingAddress,
            isProposer: results[1].status === 'fulfilled',
            proposer
        });
    } catch (e) {
        $registryContractStore.set({
            globalState: $registryContractStore.value?.globalState,
            proposers: {},
            isXGov: false,
            votingAddress: '',
            isProposer: false,
        });
    }
}

export async function checkIsXGov(address: string) {
    const addr = algosdk.decodeAddress(address).publicKey;
    const xGovBoxName = new Uint8Array(Buffer.concat([Buffer.from('x'), addr]));
    
    try {
        const xgovBoxValue = await algod.getApplicationBoxByName(registryAppID, xGovBoxName).do();

        let votingAddress: string = ''
        if (!!xgovBoxValue && !!xgovBoxValue.value) {
            votingAddress = algosdk.encodeAddress(xgovBoxValue.value);
        }

        $registryContractStore.setKey('isXGov', true);
        $registryContractStore.setKey('votingAddress', votingAddress);
    } catch (e) {
        console.error(e);
    }
}

export async function getAllProposers(): Promise<{ [key: string]: ProposerBoxState }> {
    const proposers: { [key: string]: ProposerBoxState } = {};
    const boxes = await algorand.client.algod.getApplicationBoxes(registryAppID).do();
    
    for (const box of boxes.boxes) {
        if (box.name[0] !== 112) {
            continue;
        }

        const proposerBoxValue = await algorand.app.getBoxValueFromABIType({
            appId: BigInt(registryAppID),
            boxName: box.name,
            type: ABIType.from('(bool,bool,uint64)')
        });

        if (!Array.isArray(proposerBoxValue) || proposerBoxValue.length !== 3) {
            throw new Error('invalid proposer box value');
        } 

        const proposer: ProposerBoxState = {
            activeProposal: (proposerBoxValue[0] as boolean),
            kycStatus: (proposerBoxValue[1] as boolean),
            kycExpiring: (proposerBoxValue[2] as bigint),
        }

        const addr = algosdk.encodeAddress(Buffer.from(box.name.slice(1)));

        proposers[addr] = proposer;
    }

    return proposers;
}

export function setIsXGov(isXGov: boolean) {
    $registryContractStore.setKey('isXGov', isXGov);
}

export function setVotingAddress(address: string) {
    $registryContractStore.setKey('votingAddress', address);
}

export function setIsProposer(isProposer: boolean) {
    $registryContractStore.setKey('isProposer', isProposer);
}