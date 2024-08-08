import { Page } from "../components/Page.tsx";
import { ProposalFilter } from "@/components/Proposal/Filter";
import { ProposalList } from "@/components/Proposal/List";
import { Link } from "react-router-dom";
import type { ComponentType } from "react";
import type { LinkProps } from "../components/Link.tsx";

// mock data
import { mockProposals } from "@/components/Proposal/List/List.stories.tsx";

const title = 'xGov';

export function HomePage() {
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