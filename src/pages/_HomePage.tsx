import { Page } from "../components/Page.tsx";
import { filterAmountMap, filters, ProposalFilter } from "@/components/ProposalFilter/ProposalFilter.tsx";
import { type ComponentType } from "react";
import { Link, type LinkProps } from "../components/Link.tsx";
import { useGetAllProposals } from "src/hooks/useProposals.ts";
import { FocusReverseMap, ProposalFundingTypeReverseMap, ProposalStatusMap, ProposalStatusReverseMap, type ProposalSummaryCardDetails } from "@/types/proposals.ts";
import { Hero } from "@/components/Hero/Hero.tsx";
import HeroAnimation from "@/components/HeroAnimation/HeroAnimation.tsx";
import ProposalListHeader from "@/components/ProposalListHeader/ProposalListHeader.tsx";
import { useRegistry } from "src/hooks/useRegistry.ts";
import { InfinityMirrorButton } from "@/components/button/InfinityMirrorButton/InfinityMirrorButton.tsx";
import { useSearchParams } from "react-router-dom";
import ProposalList from "@/components/ProposalList/ProposalList.tsx";

const title = 'Algorand xGov';
const filterKeys = Object.keys(filters);

const proposalFilter = (proposal: ProposalSummaryCardDetails, searchParams: URLSearchParams): boolean => {
    let passes = true;
    filterKeys.forEach((key) => {
        const value = searchParams.get(key) as string;
        if (value) {
            switch(key) {
                case 'status':
                    if (proposal.status !== ProposalStatusReverseMap[value]) {
                        passes = false;
                    }
                    break;
                case 'type':
                    if (proposal.fundingType !== ProposalFundingTypeReverseMap[value]) {
                        passes = false;
                    }
                    break;
                case 'amount':
                    const values = filterAmountMap[value];                        

                    if (values.length === 1) {
                        if (proposal.requestedAmount < values[0]) {
                            passes = false;
                        }
                    } else if (values.length === 2) {
                        if (proposal.requestedAmount < values[0] || proposal.requestedAmount > values[1]) {
                            passes = false;
                        }
                    }                    
                    break;    
                case 'focus':
                    if (proposal.focus !== FocusReverseMap[value]) {
                        passes = false;
                    }
                    break;
            }
        }
    });
    return passes;
}

export function HomePage() {
    const [searchParams] = useSearchParams();
    const registry = useRegistry();
    const proposalsQuery = useGetAllProposals();

    const proposals = proposalsQuery.data?.filter(
        (proposal) => proposalFilter(proposal, searchParams)
    );

    return (
        <>
            <HeroAnimation />
            <Page title={title} LinkComponent={Link as unknown as ComponentType<LinkProps>}>
                <Hero
                    title={title}
                    description="xGov is a decentralized platform powered by Algorand smart contracts that enables community-driven funding for innovative projects and ideas. Through transparent governance, it empowers the Algorand ecosystem to collectively evaluate and support impactful initiatives."
                    xgovs={4_800}
                    proposals={proposalsQuery.data?.length || 0}
                    treasury={Number(registry.data?.outstandingFunds) || 0}
                    votes={8_329}
                />
                <div className="mt-10">
                    <ProposalListHeader title="Active Proposals">
                        <ProposalFilter />
                        <Link to='/new/proposal'>
                            <InfinityMirrorButton variant='secondary'>
                                New Proposal
                            </InfinityMirrorButton>
                        </Link>
                    </ProposalListHeader>
                    {
                        !!proposals && proposals.length > 0
                            ? <ProposalList proposals={proposals} />
                            : <p className="h-80 text-algo-blue dark:text-algo-teal flex justify-center items-center">No Proposals Yet</p>
                    }
                </div>
            </Page>
        </>
    )
}