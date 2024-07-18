import { cn } from "../functions/tailwind";

export interface ProposalFilterProps {
    className: string;
}

export default function ProposalFilter({ className }: ProposalFilterProps) {
    return (
        <div className={cn(className, "w-full flex items-center justify-around lg:justify-start lg:gap-10")}>
            <button className="border-2 border-algo-black bg-white rounded-full text-sm lg:text-lg font-medium p-1 w-20 lg:w-40">status</button>
            <button className="border-2 border-algo-black bg-white rounded-full text-sm lg:text-lg font-medium p-1 w-20 lg:w-40">type</button>
            <button className="border-2 border-algo-black bg-white rounded-full text-sm lg:text-lg font-medium p-1 w-20 lg:w-40">amount</button>
            <button className="border-2 border-algo-black bg-white rounded-full text-sm lg:text-lg font-medium p-1 w-20 lg:w-40">category</button>
        </div>
    )
}