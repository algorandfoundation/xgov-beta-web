import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { capitalizeFirstLetter } from "@/functions/capitalization"
import { cn } from "@/functions/utils"
import { useState } from "react"

export function ProposalFilterDropDown({ title, options }: { title: string, options: string[] }) {
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
