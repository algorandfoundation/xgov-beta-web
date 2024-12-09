import algosdk, { ALGORAND_MIN_TX_FEE } from 'algosdk';
import { XGovRegistryFactory } from '@algorandfoundation/xgov/registry';
import type { TransactionSignerAccount } from '@algorandfoundation/algokit-utils/types/account';
import { AlgorandClient as algorand } from './algo-client'

const XGOV_FEE = BigInt(1_000_000);
const PROPOSER_FEE = BigInt(10_000_000);
const PROPOSAL_FEE = BigInt(100_000_000);
const PROPOSAL_PUBLISHING_BPS = BigInt(1_000);
const PROPOSAL_COMMITTMENT_BPS = BigInt(1_000);
const MIN_REQUESTED_AMOUNT = BigInt(1_000);

const MAX_REQUESTED_AMOUNT_SMALL = BigInt(100_000_000);
const MAX_REQUESTED_AMOUNT_MEDIUM = BigInt(1_000_000_000);
const MAX_REQUESTED_AMOUNT_LARGE = BigInt(10_000_000_000);

const DISCUSSION_DURATION_SMALL = BigInt(86400);
const DISCUSSION_DURATION_MEDIUM = BigInt(172800);
const DISCUSSION_DURATION_LARGE = BigInt(259200);
const DISCUSSION_DURATION_XLARGE = BigInt(345600);

const VOTING_DURATION_SMALL = BigInt(86400);
const VOTING_DURATION_MEDIUM = BigInt(172800);
const VOTING_DURATION_LARGE = BigInt(259200);
const VOTING_DURATION_XLARGE = BigInt(345600);

const COOL_DOWN_DURATION = BigInt(86400);
const STALE_PROPOSAL_DURATION = BigInt(86400 * 14);

const QUORUM_SMALL = BigInt(100);
const QUORUM_MEDIUM = BigInt(200);
const QURUM_LARGE = BigInt(300);

const WEIGHTED_QUORUM_SMALL = BigInt(200);
const WEIGHTED_QUORUM_MEDIUM = BigInt(300);
const WEIGHTED_QUORUM_LARGE = BigInt(400);

export async function initializeMockEnvironment(numAccounts: number = 5) {
    // Generate admin account (the one that creates the registry)
    const fundAmount = (10).algo();
    const adminAccount = algorand.account.random();
    console.log('admin account', adminAccount.addr);
    const dispenser = await algorand.account.dispenserFromEnvironment();

    await algorand.account.ensureFunded(
        adminAccount.addr,
        dispenser,
        fundAmount,
    );

    // Create the registry
    const registryMinter = new XGovRegistryFactory({
        algorand,
        defaultSender: adminAccount.addr,
        defaultSigner: adminAccount.signer,
        
    });

    const results = await registryMinter.send.create.create();
    const registryClient = results.appClient;

    // Fund the registry
    await registryClient.appClient.fundAppAccount({
        sender: dispenser.addr,
        amount: (10_000_000).microAlgos(), // 10 Algos
    });

    // Generate KYC provider account
    const kycProvider = algorand.account.random();
    console.log('kyc provider', kycProvider.addr);

    await algorand.account.ensureFunded(
        kycProvider.addr,
        dispenser,
        fundAmount,
    );

    // Set KYC provider
    await registryClient.send.setKycProvider({
        sender: adminAccount.addr,
        args: {
            provider: kycProvider.addr,
        },
    });

    // 963000
    await registryClient.send.configXgovRegistry({
        sender: adminAccount.addr,
        args: {
            config: {
                xgovFee: XGOV_FEE,
                proposerFee: PROPOSER_FEE,
                proposalFee: PROPOSAL_FEE,
                proposalPublishingBps: PROPOSAL_PUBLISHING_BPS,
                proposalCommitmentBps: PROPOSAL_COMMITTMENT_BPS,
                minRequestedAmount: MIN_REQUESTED_AMOUNT,
                maxRequestedAmount: [
                    MAX_REQUESTED_AMOUNT_SMALL,
                    MAX_REQUESTED_AMOUNT_MEDIUM,
                    MAX_REQUESTED_AMOUNT_LARGE,
                ],
                discussionDuration: [
                    DISCUSSION_DURATION_SMALL,
                    DISCUSSION_DURATION_MEDIUM,
                    DISCUSSION_DURATION_LARGE,
                    DISCUSSION_DURATION_XLARGE,
                ],
                votingDuration: [
                    VOTING_DURATION_SMALL,
                    VOTING_DURATION_MEDIUM,
                    VOTING_DURATION_LARGE,
                    VOTING_DURATION_XLARGE,
                ],
                coolDownDuration: COOL_DOWN_DURATION,
                staleProposalDuration: STALE_PROPOSAL_DURATION,
                quorum: [
                    QUORUM_SMALL,
                    QUORUM_MEDIUM,
                    QURUM_LARGE,
                ],
                weightedQuorum: [
                    WEIGHTED_QUORUM_SMALL,
                    WEIGHTED_QUORUM_MEDIUM,
                    WEIGHTED_QUORUM_LARGE
                ],
            }
        },
    })


    // Generate and setup mock proposer accounts
    const proposerAccounts: (TransactionSignerAccount & { account: algosdk.Account; })[] = [];
    const proposalIds: bigint[] = [];
    const proposerFee = (PROPOSER_FEE).microAlgo();
    const proposalFee = (PROPOSAL_FEE).microAlgo();

    // get suggestedparams
    const suggestedParams = await algorand.getSuggestedParams();

    const oneYearFromNow = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

    for (let i = 0; i < numAccounts; i++) {
        const account = algorand.account.random();
        console.log('proposer account', account.addr);

        await algorand.account.ensureFunded(
            account.addr,
            dispenser,
            (120).algo(),
        );

        proposerAccounts.push(account);
        const addr = algosdk.decodeAddress(account.addr).publicKey;
        const proposerBoxName = new Uint8Array(Buffer.concat([Buffer.from('p'), addr]));

        // Subscribe as proposer
        await registryClient.send.subscribeProposer({
            sender: account.addr,
            args: {
                payment: algosdk.makePaymentTxnWithSuggestedParamsFromObject({
                    amount: proposerFee.microAlgos,
                    from: account.addr,
                    to: registryClient.appAddress,
                    suggestedParams,
                }),
            },
            boxReferences: [ proposerBoxName ]
        });

        // Approve proposer KYC
        await registryClient.send.setProposerKyc({
            sender: kycProvider.addr,
            args: {
                proposer: account.addr,
                kycStatus: true,
                kycExpiring: BigInt(oneYearFromNow),
            },
            boxReferences: [ proposerBoxName ]
        });

        // Create a proposal
        const result = await registryClient.send.openProposal({
            sender: account.addr,
            args: {
                payment: algosdk.makePaymentTxnWithSuggestedParamsFromObject({
                    amount: proposalFee.microAlgos,
                    from: account.addr,
                    to: registryClient.appAddress,
                    suggestedParams,
                }),
            },
            boxReferences: [ proposerBoxName ],
            extraFee: (ALGORAND_MIN_TX_FEE * 2).microAlgos(),
        });

        // Store proposal ID if available
        if (result.return) {
            proposalIds.push(result.return);
        }
    }

    return {
        adminAccount,
        kycProvider,
        proposerAccounts,
        proposalIds,
    };
}
