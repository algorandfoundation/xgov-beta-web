import algosdk, { ALGORAND_MIN_TX_FEE } from 'algosdk';
import { XGovRegistryFactory } from '@algorandfoundation/xgov/registry';
import type { TransactionSignerAccount } from '@algorandfoundation/algokit-utils/types/account';
import { AlgorandClient as algorand } from './algo-client'
import { create } from 'kubo-rpc-client';
import { ProposalFactory } from '@algorandfoundation/xgov';
import { ProposalFocus, ProposalFundingType, type ProposalJSON, type ProposalStatus } from '@/types/proposals';
import { ProposalStatus as PS } from '@/types/proposals';

export interface MockProposalCreationData {
    status: ProposalStatus;
    title: string;
    proposalJson: ProposalJSON;
    fundingType: ProposalFundingType;
    requestedAmount: number;
    focus: ProposalFocus;
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
            adoptionMetrics: ['1000 users', '1000 transactions'],
            pastProposalLinks: [
                BigInt(1), BigInt(2), BigInt(3)
            ],
            forumLink: 'https://forum.algorand.org/',
        },
        fundingType: ProposalFundingType.Retroactive,
        requestedAmount: 75_000,
        focus: ProposalFocus.FocusDeFi,
    },
    {
        status: PS.ProposalStatusVoting,
        title: 'Tealscript interactive developer course Tealscript interactive developer course',
        proposalJson: {
            description: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            team: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            additionalInfo: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            openSource: true,
            pastProposalLinks: [],
            forumLink: 'https://forum.algorand.org/',
        },
        fundingType: ProposalFundingType.Proactive,
        requestedAmount: 30_000,
        focus: ProposalFocus.FocusEducation,
    },
    {
        status: PS.ProposalStatusVoting,
        title: 'Use-Wallet',
        proposalJson: {
            description: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            team: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            additionalInfo: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            openSource: true,
            pastProposalLinks: [],
            forumLink: 'https://forum.algorand.org/',
        },
        fundingType: ProposalFundingType.Retroactive,
        requestedAmount: 75_000,
        focus: ProposalFocus.FocusLibraries,
    },
    {
        status: PS.ProposalStatusFinal,
        title: 'AlgoNFT Marketplace',
        proposalJson: {
            description: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            team: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            additionalInfo: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            openSource: true,
            pastProposalLinks: [],
            forumLink: 'https://forum.algorand.org/',
        },
        fundingType: ProposalFundingType.Proactive,
        requestedAmount: 50_000,
        focus: ProposalFocus.FocusNFT,
    },
    {
        status: PS.ProposalStatusFinal,
        title: 'AlgoSwap',
        proposalJson: {
            description: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            team: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            additionalInfo: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            openSource: true,
            pastProposalLinks: [],
            forumLink: 'https://forum.algorand.org/',
        },
        fundingType: ProposalFundingType.Retroactive,
        requestedAmount: 100_000,
        focus: ProposalFocus.FocusDeFi,
    },
    {
        status: PS.ProposalStatusFinal,
        title: 'Auto-Compounding Farms',
        proposalJson: {
            description: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            team: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            additionalInfo: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            openSource: true,
            adoptionMetrics: ['1000 users', '1000 transactions'],
            pastProposalLinks: [
                BigInt(1), BigInt(2), BigInt(3)
            ],
            forumLink: 'https://forum.algorand.org/',
        },
        fundingType: ProposalFundingType.Retroactive,
        requestedAmount: 75_000,
        focus: ProposalFocus.FocusDeFi,
    },
    {
        status: PS.ProposalStatusVoting,
        title: 'Tealscript interactive developer course Tealscript interactive developer course',
        proposalJson: {
            description: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            team: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            additionalInfo: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            openSource: true,
            pastProposalLinks: [],
            forumLink: 'https://forum.algorand.org/',
        },
        fundingType: ProposalFundingType.Proactive,
        requestedAmount: 30_000,
        focus: ProposalFocus.FocusEducation,
    },
    {
        status: PS.ProposalStatusVoting,
        title: 'Use-Wallet',
        proposalJson: {
            description: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            team: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            additionalInfo: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            openSource: true,
            pastProposalLinks: [],
            forumLink: 'https://forum.algorand.org/',
        },
        fundingType: ProposalFundingType.Retroactive,
        requestedAmount: 75_000,
        focus: ProposalFocus.FocusLibraries,
    },
    {
        status: PS.ProposalStatusFinal,
        title: 'AlgoNFT Marketplace',
        proposalJson: {
            description: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            team: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            additionalInfo: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            openSource: true,
            pastProposalLinks: [],
            forumLink: 'https://forum.algorand.org/',
        },
        fundingType: ProposalFundingType.Proactive,
        requestedAmount: 50_000,
        focus: ProposalFocus.FocusNFT,
    },
    {
        status: PS.ProposalStatusFinal,
        title: 'AlgoSwap',
        proposalJson: {
            description: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            team: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            additionalInfo: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            openSource: true,
            pastProposalLinks: [],
            forumLink: 'https://forum.algorand.org/',
        },
        fundingType: ProposalFundingType.Retroactive,
        requestedAmount: 100_000,
        focus: ProposalFocus.FocusDeFi,
    },
    {
        status: PS.ProposalStatusFinal,
        title: 'Auto-Compounding Farms',
        proposalJson: {
            description: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            team: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            additionalInfo: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            openSource: true,
            adoptionMetrics: ['1000 users', '1000 transactions'],
            pastProposalLinks: [
                BigInt(1), BigInt(2), BigInt(3)
            ],
            forumLink: 'https://forum.algorand.org/',
        },
        fundingType: ProposalFundingType.Retroactive,
        requestedAmount: 75_000,
        focus: ProposalFocus.FocusDeFi,
    },
    {
        status: PS.ProposalStatusVoting,
        title: 'Tealscript interactive developer course Tealscript interactive developer course',
        proposalJson: {
            description: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            team: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            additionalInfo: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            openSource: true,
            pastProposalLinks: [],
            forumLink: 'https://forum.algorand.org/',
        },
        fundingType: ProposalFundingType.Proactive,
        requestedAmount: 30_000,
        focus: ProposalFocus.FocusEducation,
    },
    {
        status: PS.ProposalStatusVoting,
        title: 'Use-Wallet',
        proposalJson: {
            description: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            team: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            additionalInfo: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            openSource: true,
            pastProposalLinks: [],
            forumLink: 'https://forum.algorand.org/',
        },
        fundingType: ProposalFundingType.Retroactive,
        requestedAmount: 75_000,
        focus: ProposalFocus.FocusLibraries,
    },
    {
        status: PS.ProposalStatusFinal,
        title: 'AlgoNFT Marketplace',
        proposalJson: {
            description: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            team: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            additionalInfo: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            openSource: true,
            pastProposalLinks: [],
            forumLink: 'https://forum.algorand.org/',
        },
        fundingType: ProposalFundingType.Proactive,
        requestedAmount: 50_000,
        focus: ProposalFocus.FocusNFT,
    },
    {
        status: PS.ProposalStatusFinal,
        title: 'AlgoSwap',
        proposalJson: {
            description: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            team: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            additionalInfo: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
            openSource: true,
            pastProposalLinks: [],
            forumLink: 'https://forum.algorand.org/',
        },
        fundingType: ProposalFundingType.Retroactive,
        requestedAmount: 100_000,
        focus: ProposalFocus.FocusDeFi,
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

async function getLastRound(): Promise<number> {
    return (await algorand.client.algod.status().do())['last-round'];
}

async function getLatestTimestamp(): Promise<number> {
    const lastRound = await getLastRound();
    const block = (await algorand.client.algod.block(lastRound).do());
    return block.block.ts;
}

export async function roundWarp(to: number = 0) {
    algorand.setSuggestedParamsCacheTimeout(0);
    const dispenser = await algorand.account.dispenserFromEnvironment();
    let nRounds;
    if (to !== 0) {
        const lastRound = await getLastRound();

        if (to < lastRound) {
            throw new Error(`Cannot warp to the past: ${to} < ${lastRound}`);
        }

        nRounds = to - lastRound;
    } else {
        nRounds = 1;
    }

    for (let i = 0; i < nRounds; i++) {
        await algorand.send.payment({
            sender: dispenser.addr,
            signer: dispenser.signer,
            receiver: dispenser.addr,
            amount: (0).microAlgo(),
        })
    }
}

export async function timeWarp(to: number) {
    algorand.setSuggestedParamsCacheTimeout(0);
    const current = (await getLatestTimestamp());
    await algorand.client.algod.setBlockOffsetTimestamp(to - current).do();
    await roundWarp()
    await algorand.client.algod.setBlockOffsetTimestamp(0).do();
}

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
        amount: (100).algos(),
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

    await registryClient.send.setCommitteeManager({
        sender: adminAccount.addr,
        signer: adminAccount.signer,
        args: {
            manager: adminAccount.addr,
        }
    });

    await registryClient.send.setCommitteePublisher({
        sender: adminAccount.addr,
        signer: adminAccount.signer,
        args: {
            publisher: adminAccount.addr,
        }
    });

    await registryClient.send.declareCommittee({
        sender: adminAccount.addr,
        signer: adminAccount.signer,
        args: {
            cid: new Uint8Array(Buffer.from('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')),
            size: 1,
            votes: 10,
        },
    })

    const committeeMembers = [
        algorand.account.random()
    ];

    for (const committeeMember of committeeMembers) {
        await algorand.account.ensureFunded(
            committeeMember.addr,
            dispenser,
            fundAmount,
        );

        await registryClient.send.subscribeXgov({
            sender: committeeMember.addr,
            signer: committeeMember.signer,
            args: {
                votingAddress: committeeMember.addr,
                payment: algosdk.makePaymentTxnWithSuggestedParamsFromObject({
                    amount: 1_000_000,
                    from: committeeMember.addr,
                    to: registryClient.appAddress,
                    suggestedParams: await algorand.getSuggestedParams(),
                }),
            },
            boxReferences: [
                new Uint8Array(Buffer.concat([
                    Buffer.from('x'),
                    algosdk.decodeAddress(committeeMember.addr).publicKey,
                ])),
            ]
        });
    }

    // Generate and setup mock proposer accounts
    const proposerAccounts: (TransactionSignerAccount & { account: algosdk.Account; })[] = [];
    const proposalIds: bigint[] = [];
    const proposerFee = (PROPOSER_FEE).microAlgo();
    const proposalFee = (PROPOSAL_FEE).microAlgo();

    // get suggestedparams
    const suggestedParams = await algorand.getSuggestedParams();

    const oneYearFromNow = await getLatestTimestamp() + 365 * 24 * 60 * 60;

    const proposalFactory = new ProposalFactory({ algorand });

    for (let i = 0; i < mockProposals.length; i++) {
        const account = algorand.account.random();
        console.log('\nproposer account', account.addr);

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

        try {
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
        } catch (e) {
            console.error('Failed to approve proposer KYC');
            return;
        }

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

        const { cid } = await ipfsClient.add(JSON.stringify(
            mockProposals[i].proposalJson,
            (_, value) => (
                typeof value === 'bigint'
                    ? value.toString()
                    : value // return everything else unchanged
            )
        ), { cidVersion: 1 });

        const proposalSubmissionFee = Math.trunc(Number(
            ((mockProposals[i].requestedAmount).algos().microAlgos * BigInt(1_000)) / BigInt(10_000)
        ));

        console.log(`Payment Amount: ${proposalSubmissionFee}\n`);
        console.log(`Title: ${mockProposals[i].title}\n`);
        console.log(`Cid: ${cid.toString()}\n`);
        console.log(`Funding Type: ${mockProposals[i].fundingType}\n`);
        console.log(`Requested Amount: ${(mockProposals[i].requestedAmount).algos().microAlgos}\n`);
        console.log(`Focus: ${mockProposals[i].focus}\n\n`);

        try {
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
                    cid: cid.bytes,
                    fundingType: mockProposals[i].fundingType,
                    requestedAmount: (mockProposals[i].requestedAmount).algos().microAlgos,
                    focus: mockProposals[i].focus,
                },
                appReferences: [registryClient.appId],
            });
        } catch (e) {
            console.log(e);

            console.error('Failed to submit proposal');

            return;
        }
    }

    const ts = (await getLatestTimestamp()) + (86400 * 5)
    await timeWarp(ts);
    console.log('finished time warp, new ts: ', await getLatestTimestamp());

    for (let i = 0; i < mockProposals.length; i++) {
        // const proposal = mockProposals[i];
        // if (proposal.status === PS.ProposalStatusFinal) {
        const proposalClient = proposalFactory.getAppClientById({ appId: proposalIds[i] });

        await proposalClient.send.finalize({
            sender: proposerAccounts[i].addr,
            signer: proposerAccounts[i].signer,
            args: {},
            appReferences: [registryClient.appId],
            accountReferences: [adminAccount.addr],
            extraFee: (ALGORAND_MIN_TX_FEE).microAlgos(),
        });
        // }
    }

    for (let i = 0; i < mockProposals.length; i++) {
        const proposal = mockProposals[i];
        if (proposal.status === PS.ProposalStatusVoting) {
            const proposalClient = proposalFactory.getAppClientById({ appId: proposalIds[i] });
            for (const committeeMember of committeeMembers) {

                const addr = algosdk.decodeAddress(committeeMember.addr).publicKey;

                await proposalClient.send.assignVoter({
                    sender: adminAccount.addr,
                    signer: adminAccount.signer,
                    args: {
                        voter: committeeMember.addr,
                        votingPower: 10,
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
            }
        }
    }

    return {
        adminAccount,
        kycProvider,
        proposerAccounts,
        proposalIds,
    };
}
