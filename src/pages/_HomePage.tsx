import { Page } from "../components/Page.tsx";
import { ProposalFilter } from "@/components/ProposalFilter/ProposalFilter.tsx";
import { ProposalList } from "@/components/ProposalList/ProposalList.tsx";
import { Link } from "react-router-dom";
import type { ComponentType } from "react";
import type { LinkProps } from "../components/Link.tsx";
import { useQuery } from "@tanstack/react-query";
import { getAllProposals } from "src/api/proposals.ts";

const title = 'xGov';

export function HomePage() {
    
    const proposals = useQuery({ queryKey: ['getAllProposals'], queryFn: getAllProposals })

    return (
        <Page title={title} LinkComponent={Link as unknown as ComponentType<LinkProps>}>
            <div>
                <ProposalFilter className="-mb-[32px] lg:-mb-[40px]" />
                <h1 className="text-3xl text-wrap lg:text-4xl max-w-4xl text-algo-black dark:text-white font-bold mt-16 mb-8">Active Proposals</h1>
                {
                    !!proposals.data && <ProposalList proposals={proposals.data} />
                }
            </div>
            <div className="lg:justify-self-end lg:min-w-[36rem]">
                <h1 className="text-3xl text-wrap lg:text-4xl max-w-4xl text-algo-black dark:text-white font-bold mt-16 mb-8">Current Cohort</h1>
            </div>
        </Page>
    )
}