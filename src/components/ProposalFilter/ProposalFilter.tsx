import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { capitalizeFirstLetter } from "@/functions/capitalization"
import { cn } from "@/functions/utils"
import { useState } from "react"
import { AlgoShapeIcon11 } from "../icons/AlgoShapeIcon11";

export interface ProposalFilterProps {
    className?: string;
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
        <button
            className={cn(
                "relative group flex justify-center items-center hover:bg-algo-blue dark:hover:bg-algo-teal size-10 rounded-full transition",
                className
            )}
        >
            <AlgoShapeIcon11 className="absolute opacity-0 translate-y-2 translate-x-2 fill-algo-blue-40 dark:fill-algo-teal-40 group-hover:opacity-100 group-hover:translate-y-1 group-hover:translate-x-1 rotate-180 size-6 transition duration-500" />
            <AlgoShapeIcon11 className="absolute translate-y-1 translate-x-1 fill-algo-blue-40 dark:fill-algo-teal-40 group-hover:fill-white dark:group-hover:fill-algo-black group-hover:translate-y-0 group-hover:translate-x-0 rotate-180 size-6 transition duration-500" />
            <AlgoShapeIcon11 className="fill-algo-blue dark:fill-algo-teal group-hover:fill-white dark:group-hover:fill-algo-black group-hover:opacity-0 group-hover:-translate-y-1 group-hover:-translate-x-1 rotate-180 size-6 transition duration-500" />
        </button>
    )

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

function ProposalFilterDropDown({ title, options }: { title: string, options: string[] }) {
    const [selected, setSelected] = useState<number>(0)

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className={cn(
                    selected ? 'border-algo-teal dark:border-algo-blue text-algo-teal dark:text-algo-blue' : 'border-algo-black dark:border-white text-algo-black dark:text-white',
                    "border-2 bg-white dark:bg-algo-black rounded-full text-sm lg:text-lg font-medium p-1 w-20 lg:w-40 focus-visible:outline-none"
                )}>
                    {title}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40">
                <DropdownMenuCheckboxItem
                    disabled={selected === 0}
                    onCheckedChange={() => setSelected(0)}
                >
                    None
                </DropdownMenuCheckboxItem>
                {
                    options.map((option, index) => (
                        <DropdownMenuCheckboxItem
                            key={option}
                            checked={selected === (index + 1)}
                            onCheckedChange={() => setSelected(i => (i === (index + 1) ? 0 : (index + 1)))}
                        >
                            {capitalizeFirstLetter(option)}
                        </DropdownMenuCheckboxItem>
                    ))
                }
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
