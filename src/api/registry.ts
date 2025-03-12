
import type { ProposerBoxState } from "@/types/proposer";
import type { TypedGlobalState } from "@algorandfoundation/xgov/registry";
import algosdk, { ABIType } from "algosdk";
import { algod, AlgorandClient as algorand } from 'src/algorand/algo-client';
import { RegistryClient } from "src/algorand/contract-clients";

console.log('registry app id', import.meta.env.PUBLIC_REGISTRY_APP_ID);
const registryAppID: number = import.meta.env.PUBLIC_REGISTRY_APP_ID;

export async function getGlobalState(): Promise<TypedGlobalState | undefined> {
    try {
        return await RegistryClient.getState();
    } catch (e) {
        console.error('failed to fetch global registry contract state', e);
        return {} as TypedGlobalState;
    }
}

export async function getIsXGov(address: string): Promise<{ isXGov: boolean, votingAddress: string }> {
    const addr = algosdk.decodeAddress(address).publicKey;
    const xGovBoxName = new Uint8Array(Buffer.concat([Buffer.from('x'), addr]));
    
    try {
        const xgovBoxValue = await algod.getApplicationBoxByName(registryAppID, xGovBoxName).do();

        let votingAddress: string = ''
        if (!!xgovBoxValue && !!xgovBoxValue.value) {
            votingAddress = algosdk.encodeAddress(xgovBoxValue.value);
        }

        return {
            isXGov: true,
            votingAddress,
        }
    } catch (e) {
        console.error(e);
        return {
            isXGov: false,
            votingAddress: '',
        }
    }
}

export async function getIsProposer(address: string): Promise<{ isProposer: boolean } & ProposerBoxState> {
    const addr = algosdk.decodeAddress(address).publicKey;
    const proposerBoxName = new Uint8Array(Buffer.concat([Buffer.from('p'), addr]));

    try {
        const proposerBoxValue = await algorand.app.getBoxValueFromABIType({
            appId: BigInt(registryAppID),
            boxName: proposerBoxName,
            type: ABIType.from('(bool,bool,uint64)')
        });

        if (!Array.isArray(proposerBoxValue) || proposerBoxValue.length !== 3) {
            return {
                isProposer: false,
                activeProposal: false,
                kycStatus: false,
                kycExpiring: BigInt(0)
            }            
        }

        return {
            isProposer: true,
            activeProposal: (proposerBoxValue[0] as boolean),
            kycStatus: (proposerBoxValue[1] as boolean),
            kycExpiring: (proposerBoxValue[2] as bigint),
        }
    } catch (e) {
        console.error(e);
        return {
            isProposer: false,
            activeProposal: false,
            kycStatus: false,
            kycExpiring: BigInt(0),
        }
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

export async function getAllSubscribedXGovs(): Promise<string[]> {
    const boxes = await algorand.client.algod.getApplicationBoxes(registryAppID).do();

    const xGovBoxes = boxes.boxes.filter((box) => {
        const boxName = new TextDecoder().decode(box.name);
        return boxName.startsWith('x');
    });

    return xGovBoxes.map((box) => {
        return algosdk.encodeAddress(Buffer.from(box.name.slice(1)));
    });
}
