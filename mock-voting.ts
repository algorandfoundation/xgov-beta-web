import fs from "node:fs";
import { registryClient } from "@/api/algorand";
import algosdk, { ALGORAND_MIN_TX_FEE, makeBasicAccountTransactionSigner } from "algosdk";

// TODO: setup cli args for these options
const proposalId = 0n
const approve = true;

const voterFile = fs.readFileSync("./.voters.json", "utf-8");
const voters: { addr: string, secret: string }[] = JSON.parse(voterFile);

for (let i = 0; i < voters.length; i++) {

    // TODO: fetch voting power for each voter
    const actualVotingPower = 0n

    const signer = makeBasicAccountTransactionSigner({
        addr: voters[i].addr,
        sk: Buffer.from(voters[i].secret, "base64"),
    });

    await registryClient.send.voteProposal({
        sender: voters[i].addr,
        signer,
        args: {
            proposalId,
            xgovAddress: voters[i].addr,
            approvalVotes: approve ? actualVotingPower : 0n,
            rejectionVotes: approve ? 0n : actualVotingPower,
        },
        accountReferences: [voters[i].addr],
        appReferences: [proposalId],
        boxReferences: [
            new Uint8Array(Buffer.concat([Buffer.from('x'), algosdk.decodeAddress(voters[i].addr).publicKey])),
            {
                appId: proposalId, name: new Uint8Array(Buffer.concat([Buffer.from('V'),
                algosdk.decodeAddress(voters[i].addr).publicKey]))
            }],
        extraFee: (ALGORAND_MIN_TX_FEE * 100).microAlgos(),
    })
}