import fs from "node:fs";
import yargs from 'yargs'
import { registryClient } from "@/api/algorand";
import algosdk, { ALGORAND_MIN_TX_FEE, makeBasicAccountTransactionSigner } from "algosdk";

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

const { proposalId, approve } = await yargs().options({
    proposalId: { number: true, demandOption: true },
    approve: { boolean: true, demandOption: true },
}).argv

const voterFile = fs.readFileSync("./.voters.json", "utf-8");
const voters: { addr: string, secret: string }[] = JSON.parse(voterFile);

const committeeId = (await registryClient.state.global.committeeId()).asString()

const committeeFile = fs.readFileSync(`./public/committees/${committeeId}.json`, "utf-8");
const committeeInfo: CommitteeInfo = JSON.parse(committeeFile);
const xgovs = committeeInfo.xGovs

let group = registryClient.newGroup()

for (let i = 0; i < voters.length; i++) {

    const actualVotingPower = xgovs.find(x => x.address === voters[i].addr)?.votes ?? 0;

    const signer = makeBasicAccountTransactionSigner({
        addr: voters[i].addr,
        sk: Buffer.from(voters[i].secret, "base64"),
    });

    group.voteProposal({
        sender: voters[i].addr,
        signer,
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