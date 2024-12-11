import algosdk, { ALGORAND_MIN_TX_FEE } from 'algosdk';
import { XGovRegistryFactory } from '@algorandfoundation/xgov/registry';
import type { TransactionSignerAccount } from '@algorandfoundation/algokit-utils/types/account';
import { AlgorandClient as algorand } from './algo-client'
import { create } from 'kubo-rpc-client';
import { ProposalFactory } from '@algorandfoundation/xgov';
import { ProposalFundingCategory, ProposalFundingType, type ProposalJSON, type ProposalStatus } from '@/types/proposals';
import { ProposalStatus as PS } from '@/types/proposals';

export interface MockProposalCreationData {
    status: ProposalStatus;
    title: string;
    proposalJson: ProposalJSON;
    // status: ProposalStatus;
    // category: ProposalCategory;
    fundingType: ProposalFundingType;
    requestedAmount: number;
}

export const mockProposals: MockProposalCreationData[] = [
    {
        status: PS.ProposalStatusFinal,
        title: 'Auto-Compounding Farms',
        proposalJson: {
            description: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            team: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            additionalInfo: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            openSource: true,
            category: ProposalFundingCategory.FundingCategoryDeFi,
            adoptionMetrics: ['1000 users', '1000 transactions'],
            pastProposalLinks: [],
            forumLink: 'https://forum.algorand.org/',
        },
        fundingType: ProposalFundingType.Retroactive,
        requestedAmount: 75_000,
    },
    {
        status: PS.ProposalStatusVoting,
        title: 'Tealscript interactive developer course Tealscript interactive developer course',
        proposalJson: {
            description: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            team: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            additionalInfo: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            openSource: true,
            category: ProposalFundingCategory.FundingCategoryEducation,
            pastProposalLinks: [],
            forumLink: 'https://forum.algorand.org/',
        },
        fundingType: ProposalFundingType.Proactive,
        requestedAmount: 30_000,
    },
    {
        status: PS.ProposalStatusVoting,
        title: 'Use-Wallet',
        proposalJson: {
            description: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            team: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            additionalInfo: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            openSource: true,
            category: ProposalFundingCategory.FundingCategoryLibraries,
            pastProposalLinks: [],
            forumLink: 'https://forum.algorand.org/',
        },
        fundingType: ProposalFundingType.Retroactive,
        requestedAmount: 75_000,
    },
    {
        status: PS.ProposalStatusFinal,
        title: 'AlgoNFT Marketplace',
        proposalJson: {
            description: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            team: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            additionalInfo: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            openSource: true,
            category: ProposalFundingCategory.FundingCategoryNFT,
            pastProposalLinks: [],
            forumLink: 'https://forum.algorand.org/',
        },
        fundingType: ProposalFundingType.Proactive,
        requestedAmount: 50_000,
    },
    {
        status: PS.ProposalStatusFinal,
        title: 'AlgoSwap',
        proposalJson: {
            description: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            team: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            additionalInfo: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            openSource: true,
            category: ProposalFundingCategory.FundingCategoryDeFi,
            pastProposalLinks: [],
            forumLink: 'https://forum.algorand.org/',
        },
        fundingType: ProposalFundingType.Retroactive,
        requestedAmount: 100_000,
    }
]

const XGOV_FEE = BigInt(1_000_000);
const PROPOSER_FEE = BigInt(10_000_000);
const PROPOSAL_FEE = BigInt(100_000_000);
const PROPOSAL_PUBLISHING_BPS = BigInt(1_000);
const PROPOSAL_COMMITMENT_BPS = BigInt(1_000);
const MIN_REQUESTED_AMOUNT = BigInt(1_000);

const MAX_REQUESTED_AMOUNT_SMALL = BigInt(100_000_000_000);
const MAX_REQUESTED_AMOUNT_MEDIUM = BigInt(1_000_000_000_000);
const MAX_REQUESTED_AMOUNT_LARGE = BigInt(10_000_000_000_000);

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
const QUORUM_LARGE = BigInt(300);

const WEIGHTED_QUORUM_SMALL = BigInt(200);
const WEIGHTED_QUORUM_MEDIUM = BigInt(300);
const WEIGHTED_QUORUM_LARGE = BigInt(400);



export async function initializeMockEnvironment(mockProposals: MockProposalCreationData[]) {

    const ipfsClient = create();
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
                proposalCommitmentBps: PROPOSAL_COMMITMENT_BPS,
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
                    QUORUM_LARGE,
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

    const proposalFactory = new ProposalFactory({ algorand });

    for (let i = 0; i < mockProposals.length; i++) {
        const account = algorand.account.random();
        console.log('proposer account', account.addr);

        await algorand.account.ensureFunded(
            account.addr,
            dispenser,
            (1000000).algo(),
        );

        proposerAccounts.push(account);
        const addr = algosdk.decodeAddress(account.addr).publicKey;
        const proposerBoxName = new Uint8Array(Buffer.concat([Buffer.from('p'), addr]));

        // Subscribe as proposer
        await registryClient.send.subscribeProposer({
            sender: account.addr,
            signer: account.signer,
            args: {
                payment: algosdk.makePaymentTxnWithSuggestedParamsFromObject({
                    amount: proposerFee.microAlgos,
                    from: account.addr,
                    to: registryClient.appAddress,
                    suggestedParams,
                }),
            },
            boxReferences: [proposerBoxName]
        });

        // Approve proposer KYC
        await registryClient.send.setProposerKyc({
            sender: kycProvider.addr,
            signer: kycProvider.signer,
            args: {
                proposer: account.addr,
                kycStatus: true,
                kycExpiring: BigInt(oneYearFromNow),
            },
            boxReferences: [proposerBoxName]
        });

        // Create a proposal
        const result = await registryClient.send.openProposal({
            sender: account.addr,
            signer: account.signer,
            args: {
                payment: algosdk.makePaymentTxnWithSuggestedParamsFromObject({
                    amount: proposalFee.microAlgos,
                    from: account.addr,
                    to: registryClient.appAddress,
                    suggestedParams,
                }),
            },
            boxReferences: [proposerBoxName],
            extraFee: (ALGORAND_MIN_TX_FEE * 2).microAlgos(),
        });

        // Store proposal ID if available
        if (!result.return) {
            console.error('Proposal creation failed');
            return;
        }

        console.log(`\nNew Proposal: ${result.return}\n`)

        proposalIds.push(result.return);

        // instance a new proposal client
        const proposalClient = proposalFactory.getAppClientById({ appId: result.return });

        const { cid } = await ipfsClient.add(JSON.stringify(mockProposals[i].proposalJson), { cidVersion: 1 });

        const proposalSubmissionFee = Math.trunc(Number(
            ((mockProposals[i].requestedAmount).algos().microAlgos * BigInt(1_000)) / BigInt(10_000)
        ));

        console.log(`Payment Amount: ${proposalSubmissionFee}\n`);
        console.log(`Title: ${mockProposals[i].title}\n`);
        console.log(`Cid: ${cid.toString()}\n`);
        console.log(`Funding Type: ${mockProposals[i].fundingType}\n`);
        console.log(`Requested Amount: ${(mockProposals[i].requestedAmount).algos().microAlgos}\n\n`);

        await proposalClient.send.submit({
            sender: account.addr,
            signer: account.signer,
            args: {
                payment: algosdk.makePaymentTxnWithSuggestedParamsFromObject({
                    amount: proposalSubmissionFee,
                    from: account.addr,
                    to: proposalClient.appAddress,
                    suggestedParams,
                }),
                title: mockProposals[i].title,
                cid: new Uint8Array(Buffer.from(cid.toString())),
                fundingType: mockProposals[i].fundingType,
                requestedAmount: (mockProposals[i].requestedAmount).algos().microAlgos,
            },
            appReferences: [registryClient.appId],
        });

        await proposalClient.send.finalize({
            sender: account.addr,
            signer: account.signer,
            args: {}
        });
    }

    return {
        adminAccount,
        kycProvider,
        proposerAccounts,
        proposalIds,
    };
}
