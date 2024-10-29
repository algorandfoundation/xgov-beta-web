import algosdk, { ABIType } from 'algosdk';
import { map } from 'nanostores';
import { algod } from 'src/algorand/algo-client';
import { Buffer } from 'buffer';
import { RegistryClient } from 'src/algorand/contract-clients';
import { getAppBoxValueFromABIType } from '@algorandfoundation/algokit-utils';

console.log('registry app id', import.meta.env.PUBLIC_REGISTRY_APP_ID);
const registryAppID: number = import.meta.env.PUBLIC_REGISTRY_APP_ID;

export interface ProposerBoxState {
    activeProposal: boolean;
    kycStatus: boolean;
    kycExpiring: bigint;
}

export interface RegistryContractStore {
    registryAppID: number;
    globalState: any;
    isXGov: boolean;
    votingAddress: string;
    isProposer: boolean;
    proposer?: ProposerBoxState;
}

export const $registryContractStore = map<RegistryContractStore>({
    registryAppID: registryAppID,
    globalState: false,
    isXGov: false,
    votingAddress: '',
    isProposer: false,
});

export async function initRegistryContractStore() {
    try {
        const state = await RegistryClient.getGlobalState();
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
            algod.getApplicationBoxByName(registryAppID, xGovBoxName).do(),
            getAppBoxValueFromABIType(
                {
                    appId: registryAppID,
                    boxName: proposerBoxName,
                    type: ABIType.from('(bool,bool,uint64)')
                },
                algod
            )
        ]);
    
        const xgovBoxValue = results[0].status === 'fulfilled' ? results[0].value : null;
        console.log('xgov box', xgovBoxValue);

        let votingAddress: string = ''
        if (!!xgovBoxValue && !!xgovBoxValue.value) {
            votingAddress = algosdk.encodeAddress(xgovBoxValue.value);
        }

        const proposerBoxValue = results[1].status === 'fulfilled' ? results[1].value : null;
        console.log('proposer box', proposerBoxValue);

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

        $registryContractStore.set({
            registryAppID: registryAppID,
            globalState: $registryContractStore.value?.globalState,
            isXGov: results[0].status === 'fulfilled',
            votingAddress,
            isProposer: results[1].status === 'fulfilled',
            proposer
        });
    } catch (e) {
        $registryContractStore.set({
            registryAppID: registryAppID,
            globalState: $registryContractStore.value?.globalState,
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

export function setIsXGov(isXGov: boolean) {
    $registryContractStore.setKey('isXGov', isXGov);
}

export function setVotingAddress(address: string) {
    $registryContractStore.setKey('votingAddress', address);
}

export function setIsProposer(isProposer: boolean) {
    $registryContractStore.setKey('isProposer', isProposer);
}