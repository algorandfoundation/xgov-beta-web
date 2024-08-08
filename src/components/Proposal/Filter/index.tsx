import { cn } from "@/functions/utils";
import { ProposalFilterDropDown } from "./Dropdown";

export interface ProposalFilterProps {
    className: string;
    onFilterChange?: (filter: string, value: string) => void;
}

export const filters: { [key: string]: string[] } = {
    status: ['discussion', 'voting', 'submission', 'closure'],
    type: ['Proactive', 'Retroactive'],
    amount: ['0-1000', '1000-10000', '10000-100000', '100000+'],
    category: ['DeFi', 'Education', 'Libraries', 'NFT'],
};

export function ProposalFilter({ className }: ProposalFilterProps) {
    return (
        <div className={cn(className, "w-full flex items-center justify-around lg:justify-start lg:gap-10")}>
            {
                Object.keys(filters).map(filter => (
                    <ProposalFilterDropDown key={filter} title={filter} options={filters[filter]} />
                ))
            }
        </div>
    )
}