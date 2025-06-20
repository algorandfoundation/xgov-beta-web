import fs from "node:fs";
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers' // Add this import
import { algorand, registryClient } from "@/api/algorand";
import algosdk, { ALGORAND_MIN_TX_FEE, makeBasicAccountTransactionSigner } from "algosdk";
import { committeeIdToSafeFileName} from './scripts/utils'

type CommitteeInfo = {
    xGovs: {
        address: string;
        votes: number;
    }[],
    metadata: {
        name: string;
        description: string;
        createdAt: string;
    }
}

const { proposalId, approve, votersFile, committeeDir } = await yargs(hideBin(process.argv)).options({
    proposalId: { type: 'number', demandOption: true, alias: 'id' },
    approve: { type: 'boolean', demandOption: true, default: true, alias: 'a' },
    votersFile: { type: 'string', default: "./.voters.json" },
    committeeDir: { type: 'string', default: "./src/pages/api/committees-dev" }
}).argv

const votingFile = fs.readFileSync(votersFile, "utf-8");
const voters: { addr: string, secret: string }[] = JSON.parse(votingFile);

console.log('registry client', registryClient.appId);

const committeeBytes = await registryClient.state.global.committeeId()
const committeeByteArray = committeeBytes.asByteArray()
if (!committeeByteArray) {
    throw new Error('Committee ID not found')
}
const committeeId = committeeIdToSafeFileName(Buffer.from(committeeByteArray))

const committeeFile = fs.readFileSync(`${committeeDir}/${committeeId}.json`, "utf-8");
const committeeInfo: CommitteeInfo = JSON.parse(committeeFile);
const xgovs = committeeInfo.xGovs

let group = registryClient.newGroup()

for (let i = 0; i < voters.length; i++) {

    const actualVotingPower = xgovs.find(x => x.address === voters[i].addr)?.votes ?? 0;

    const account = algorand.account.fromMnemonic(voters[i].secret);

    group.voteProposal({
        sender: voters[i].addr,
        signer: account.signer,
        args: {
            proposalId,
            xgovAddress: voters[i].addr,
            approvalVotes: approve ? actualVotingPower : 0n,
            rejectionVotes: approve ? 0n : actualVotingPower,
        },
        accountReferences: [voters[i].addr],
        appReferences: [BigInt(proposalId)],
        boxReferences: [
            new Uint8Array(Buffer.concat([Buffer.from('x'), algosdk.decodeAddress(voters[i].addr).publicKey])),
            {
                appId: BigInt(proposalId), name: new Uint8Array(Buffer.concat([Buffer.from('V'),
                algosdk.decodeAddress(voters[i].addr).publicKey]))
            }],
        extraFee: (ALGORAND_MIN_TX_FEE).microAlgos(),
    })

    const groupFullOrLast = (await (await group.composer()).count()) === 16 || i === (voters.length - 1)
    if (groupFullOrLast) {
        await group.send({ suppressLog: true });
        group = registryClient.newGroup();
    }
}