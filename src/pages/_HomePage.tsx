import { Page } from "../components/Page";
import { calcInRange, ProposalFilter } from "@/components/ProposalFilter/ProposalFilter";
import { ProposalList } from "@/components/ProposalList/ProposalList";
import { Link } from "react-router-dom";
import { type ComponentType, useState, useEffect } from "react";
import type { LinkProps } from "../components/Link";
import { useGetAllProposals } from "src/hooks/useProposals";
import { FocusMap, ProposalFundingTypeMap, statusToPhase, type ProposalSummaryCardDetails } from "@/types/proposals";

const title = 'xGov';

export function HomePage() {
    const { data: proposalsData } = useGetAllProposals();
    const [filteredProposals, setFilteredProposals] = useState<ProposalSummaryCardDetails[]>([]);

    useEffect(() => {
        if (proposalsData) {
            setFilteredProposals(proposalsData);
        }
    }, [proposalsData]);

    const handleFilterChange = (selectedFilters: { [key: string]: string[] }) => {
        if (!proposalsData) return;
    
        if (Object.keys(selectedFilters).length === 0) {
            setFilteredProposals(proposalsData);
            return;
        }
    
        let filtered: ProposalSummaryCardDetails[] = [];
        const addedProposalIds = new Set<bigint>();
    
        const statusFilters = selectedFilters['status'] || [];
        const typeFilters = selectedFilters['type'] || [];
        const amountFilters = selectedFilters['amount'] || [];
        const categoryFilters = selectedFilters['category'] || [];
    
        proposalsData.forEach(proposal => {
            const matchesStatus = statusFilters.length > 0 ? statusFilters.includes(statusToPhase[proposal.status]) : true;
            const matchesType = typeFilters.length > 0 ? typeFilters.includes(ProposalFundingTypeMap[proposal.fundingType]) : true;
            const matchesAmount = amountFilters.length > 0 ? amountFilters.some(range => calcInRange(proposal.requestedAmount, range)) : true;
            const matchesCategory = categoryFilters.length > 0 ? categoryFilters.includes(FocusMap[proposal.focus]) : true;
    
            if ((matchesStatus && matchesType && matchesAmount && matchesCategory) && !addedProposalIds.has(proposal.id)) {
                filtered.push(proposal);
                addedProposalIds.add(proposal.id);
            }
        });
    
        setFilteredProposals(filtered);
    };

    return (
        <Page title={title} LinkComponent={Link as unknown as ComponentType<LinkProps>}>
            <div>
                <ProposalFilter className="-mb-[32px] lg:-mb-[40px]" onFilterChange={handleFilterChange} />
                <h1 className="text-3xl text-wrap lg:text-4xl max-w-4xl text-algo-black dark:text-white font-bold mt-16 mb-8">Active Proposals</h1>
                {
                    !!filteredProposals.length ? (
                        <ProposalList proposals={filteredProposals} />
                    ) : (
                        <p className="text-algo-black dark:text-white">No proposals match the selected filters.</p>
                    )
                }
            </div>
            <div className="lg:justify-self-end lg:min-w-[36rem]">
                <h1 className="text-3xl text-wrap lg:text-4xl max-w-4xl text-algo-black dark:text-white font-bold mt-16 mb-8">Current Cohort</h1>
            </div>
        </Page>
    )
}