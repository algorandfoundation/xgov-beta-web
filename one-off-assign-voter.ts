import { getAllProposals, proposalFactory } from "@/api";
import { algorand, registryClient } from "@/api/algorand";
import { ProposalStatus as PS } from "@/api/types";
import algosdk from "algosdk";

// one-off script to assign a voter to all proposals in voting state
// used for testing subscribe_xgov requests from systems like Reti
// huge pain to run, for this to work you need to add extra votes & modify the voter list length in mock-init.ts
// then comment out the vote_proposal & scrutiny calls at the end of mock-init.ts since they will fail

algorand.setSuggestedParamsCacheTimeout(0);
const adminAccount = await algorand.account.fromKmd("unencrypted-default-wallet");

// fetch proposals
const proposals = await getAllProposals();

const voters = ['ZIMIAERBYCLBSJSLKTUG2XVYGOGXU7D5LUPQQ5YKBHUIS6DHGSNIVOPLRE'];

const committeeVotes = [100]

for (let i = 1; i < proposals.length; i++) {
  const proposal = proposals[i];

  console.log('Proposal ', i, ' status: ', PS[proposal.status]);

  if (proposal.status === PS.ProposalStatusSubmitted) {

    console.log(`Proposal ${i}`);

    const proposalClient = proposalFactory.getAppClientById({ appId: proposal.id });

    for (let j = 0; j < voters.length; j++) {
      const committeeMember = voters[j];
      const votes = committeeVotes[j];

      const addr = algosdk.decodeAddress(committeeMember).publicKey;

      console.log('Committee member: ', committeeMember);
      console.log('    voting power: ', votes);
      console.log('           index: ', j);

      try {
        await proposalClient.send.assignVoters({
          sender: adminAccount.addr,
          signer: adminAccount.signer,
          args: {
            voters: [[committeeMember, votes]],
          },
          appReferences: [registryClient.appId],
          boxReferences: [
            new Uint8Array(Buffer.concat([
              Buffer.from('V'),
              addr,
            ])),
          ]
        })
        console.log('assigned voter');
      } catch (e) {
        console.error('Failed to assign voter');
        process.exit(1);
      }
    }
  }
}
