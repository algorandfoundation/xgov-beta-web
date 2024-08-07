import type { ProposalSummaryCardDetails } from "../types/proposals.ts";
import { Page } from "../components/Page.tsx";
import { ProposalFilter } from "@components/proposal/ProposalFilter.tsx";
import { ProposalList } from "@components/proposal/ProposalList.tsx";
import { Link } from "react-router-dom";
import type { ComponentType } from "react";
import type { LinkProps } from "../components/Link.tsx";

const title = 'xGov';
const mockProposals: ProposalSummaryCardDetails[] = [
    {
        id: 1,
        title: "Auto-Compounding Farms",
        phase: "discussion",
        category: "DeFi",
        fundingType: "retroactive",
        requestedAmount: 75_000,
        proposer: "CompX",
    },
    {
        id: 2,
        title: "Tealscript interactive developer course Tealscript interactive developer course",
        phase: "vote",
        category: "Education",
        fundingType: "proactive",
        requestedAmount: 30_000,
        proposer: "AgorApp",
    },
    {
        id: 3,
        title: "Use-Wallet",
        phase: "vote",
        category: "Libraries",
        fundingType: "retroactive",
        requestedAmount: 75_000,
        proposer: "TxnLab",
    },
    {
        id: 4,
        title: "AlgoNFT Marketplace",
        phase: "submission",
        category: "NFT",
        fundingType: "proactive",
        requestedAmount: 50_000,
        proposer: "NFTify",
    },
    {
        id: 5,
        title: "AlgoSwap",
        phase: "closure",
        category: "DeFi",
        fundingType: "retroactive",
        requestedAmount: 100_000,
        proposer: "SwapX",
    },
];

export function HomePage() {
    // TODO: Handle Home Page Operations
    return (
        <Page title={title} LinkComponent={Link as unknown as ComponentType<LinkProps>}>
            <div>
                <ProposalFilter className="-mb-[32px] lg:-mb-[40px]" />
                <h1 className="text-3xl text-wrap lg:text-4xl max-w-4xl text-algo-black dark:text-white font-bold mt-16 mb-8">Active Proposals</h1>
                <ProposalList proposals={mockProposals} />
            </div>
            <div className="lg:justify-self-end lg:min-w-[36rem]">
                <h1 className="text-3xl text-wrap lg:text-4xl max-w-4xl text-algo-black dark:text-white font-bold mt-16 mb-8">Current Cohort</h1>
            </div>
        </Page>
    )
}