import { Page } from "@components/Page";
import type { ProposalCardDetails, ProposalInfoCardDetails } from "@types/proposals";
import { ProposalCard } from "@components/proposal/ProposalCard";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@components/ui/breadcrumb";
import { ProposalInfoCard } from "@components/proposal/ProposalInfoCard";
import { type ComponentType } from "react";

const title = 'xGov';
const mockProposal: ProposalCardDetails & { pastProposals: { title: string, link: string }[] } = {
    id: 1,
    title: "Auto-Compounding Farms",
    description: "This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users",
    phase: "discussion",
    proposer: "CompX",
    properties: {
        openSource: true,
        focus: 'defi',
        deliveryDate: '2023-01-01',
        team: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
        experience: 'CompX has been delivering impact via auto-compounding farms for years',
        presentProposal: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
        deliverable: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users ',
        futureBlueprint: 'CompX will continue to deliver impact via auto-compounding farms',
        benefits: 'Algorand users will benefit from the impact delivered by CompX',
    },
    pastProposals: [
        { title: 'Tealscript interactive developer course Tealscript interactive developer course', link: '/proposals/2' },
        { title: 'Use-Wallet', link: '/proposals/3' },
        { title: 'AlgoNFT Marketplace', link: '/proposals/4' },
    ],
};

const mockProposalInfo: ProposalInfoCardDetails = {
    discussionLink: 'https://proposal-discussion-link-here.com',
    fundingType: 'retroactive',
    category: 'DeFi',
    license: 'MIT',
    requestedAmount: 75_000,
};

function ProposalCardAndTitle() {
    return (
        <>
            <h1 className="text-3xl text-wrap lg:text-4xl max-w-4xl text-algo-black dark:text-white font-bold mt-16 mb-8 ">
                Info
            </h1>
            <ProposalInfoCard proposal={mockProposalInfo} />
        </>
    )
}

export function ProposalPage() {
    // const { activeAddress } = useWallet();
    // TODO: Get NFD name using the activeAddress

    return (
        <Page
            title={title}
            Sidebar={ProposalCardAndTitle as unknown as ComponentType}
        >
            <div>
                <Breadcrumb className="-mb-[20px]">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/">Home</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/">Proposal</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{mockProposal.id}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-3xl text-wrap lg:text-4xl max-w-3xl text-algo-black dark:text-white font-bold mt-16 mb-8 ">
                    {mockProposal.title} - {mockProposal.proposer}
                </h1>
                <ProposalCard proposal={mockProposal} />
            </div>
        </Page>
    )
}