import { cn } from "@functions/utils";
import { ProposalFilterDropDown } from "./ProposalFilterDropdown";

export interface ProposalFilterProps {
    className: string;
}

const filterOptions = {
    status: ['discussion', 'voting', 'submission', 'closure'],
    type: ['Proactive', 'Retroactive'],
    amount: ['0-1000', '1000-10000', '10000-100000', '100000+'],
    category: ['DeFi', 'Education', 'Libraries', 'NFT']
};

export function ProposalFilter({ className }: ProposalFilterProps) {
    return (
        <div className={cn(className, "w-full flex items-center justify-around lg:justify-start lg:gap-10")}>
            <ProposalFilterDropDown title="status" options={filterOptions.status} />
            <ProposalFilterDropDown title="type" options={filterOptions.type} />
            <ProposalFilterDropDown title="amount" options={filterOptions.amount} />
            <ProposalFilterDropDown title="category" options={filterOptions.category} />
        </div>
    )
}