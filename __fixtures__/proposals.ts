import {
    ProposalFocus,
    ProposalFundingType,
    type ProposalJSON,
    type ProposalStatus,
    ProposalStatus as PS
} from "../src/types/proposals";

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
