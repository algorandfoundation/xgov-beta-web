import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { capitalizeFirstLetter } from "@/functions/capitalization"
import { cn } from "@/functions/utils"
import { useState } from "react"

export interface ProposalFilterProps {
    className: string;
    onFilterChange?: (filters: { [key: string]: string[] }) => void;
}

export const filters: { [key: string]: string[] } = {
    status: ['discussion', 'voting', 'submission', 'closure'],
    type: ['Proactive', 'Retroactive'],
    amount: ['0-1000', '1000-10000', '10000-100000', '100000+'],
    category: ['DeFi', 'Education', 'Libraries', 'NFT'],
};

export const calcInRange = (amount: bigint, stringRange: string) => {
    if ((stringRange == '0-1000') && (amount >= 0 && amount <= 1000*10e6)) {
            return true 
    }

    if ((stringRange == '1000-10000') && (amount >= 1000*10e6 && amount <= 10000*10e6)) {
            return true 
        }

    if ((stringRange == '10000-100000') && (amount >= 10000*10e6 && amount <= 100000*10e6)) {
            return true 
    }
    if ((stringRange == '100000+') && (amount >= 100000*10e6)) {
            return true 
    }
    return false
}

export function ProposalFilter({ className, onFilterChange }: ProposalFilterProps) {
    const [selectedFilters, setSelectedFilters] = useState<{ [key: string]: string[] }>({});

    const handleFilterChange = (filter: string, value: string) => {
        setSelectedFilters(prev => {
            const newFilters = { ...prev };
            if (!newFilters[filter]) {
                newFilters[filter] = [];
            }
            if (newFilters[filter].includes(value)) {
                newFilters[filter] = newFilters[filter].filter(v => v !== value);
            } else {
                newFilters[filter].push(value);
            }
            if (newFilters[filter].length === 0) {
                delete newFilters[filter];
            }
            if (onFilterChange) {
                onFilterChange(newFilters);
            }
            return newFilters;
        });
    };

    const handleRemoveFilter = (filter: string, value: string) => {
        setSelectedFilters(prev => {
            const newFilters = { ...prev };
            if (newFilters[filter]) {
                newFilters[filter] = newFilters[filter].filter(v => v !== value);
                if (newFilters[filter].length === 0) {
                    delete newFilters[filter];
                }
            }
            if (onFilterChange) {
                onFilterChange(newFilters);
            }
            return newFilters;
        });
    };

    return (
        <div className={cn(className, "w-full flex flex-col items-center lg:items-start")}>
            <div className="w-full flex items-center justify-around lg:justify-start lg:gap-10">
                {
                    Object.keys(filters).map(filter => (
                        <ProposalFilterDropDown
                            key={filter}
                            title={filter}
                            options={filters[filter]}
                            selectedFilters={selectedFilters}
                            onFilterChange={handleFilterChange}
                        />
                    ))
                }
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
                {Object.keys(selectedFilters).map(filter => (
                    selectedFilters[filter].map(value => (
                        <div key={`${filter}-${value}`} className="flex items-center bg-gray-200 dark:bg-gray-700 p-2 rounded">
                            <span className="mr-2">{capitalizeFirstLetter(filter)}: {capitalizeFirstLetter(value)}</span>
                            <button
                                className="text-red-500"
                                onClick={() => handleRemoveFilter(filter, value)}
                            >
                                x
                            </button>
                        </div>
                    ))
                ))}
            </div>
        </div>
    )
}

function ProposalFilterDropDown({ title, options, selectedFilters, onFilterChange }: { title: string, options: string[], selectedFilters: { [key: string]: string[] }, onFilterChange: (filter: string, value: string) => void }) {
    const selected = selectedFilters[title] || [];

    const handleClearFilter = () => {
        selected.forEach(option => onFilterChange(title, option));
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className={cn(
                    selected.length ? 'border-algo-teal dark:border-algo-blue text-algo-teal dark:text-algo-blue' : 'border-algo-black dark:border-white text-algo-black dark:text-white',
                    "border-2 bg-white dark:bg-algo-black rounded-full text-sm lg:text-lg font-medium p-1 w-20 lg:w-40 focus-visible:outline-none"
                )}>
                    {title}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40">
                <DropdownMenuCheckboxItem
                    disabled={selected.length === 0}
                    onClick={handleClearFilter}
                >
                    None
                </DropdownMenuCheckboxItem>
                {
                    options.map((option) => (
                        <DropdownMenuCheckboxItem
                            key={option}
                            checked={selected.includes(option)}
                            onCheckedChange={() => onFilterChange(title, option)}
                        >
                            {capitalizeFirstLetter(option)}
                        </DropdownMenuCheckboxItem>
                    ))
                }
            </DropdownMenuContent>
        </DropdownMenu>
    )
}