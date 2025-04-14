import { CheckIcon, XIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/functions/utils";

export interface MajorityApprovedPillProps {
    approved: boolean
    className?: string
    label: string
}

export default function MajorityApprovedPill({ approved, className, label, ...contentProps }: MajorityApprovedPillProps) {
    return (
        <Popover>
            <PopoverTrigger
                className={cn('text-muted-foreground hover:text-foreground', className)}
                aria-label={`Info: ${label}`}
            >
                <div
                    className="group flex items-center gap-2 bg-algo-blue/10 hover:bg-algo-blue hover:text-white dark:text-white dark:bg-algo-teal/10 dark:hover:bg-algo-teal dark:hover:text-algo-black py-0.5 pl-0.5 pr-3 rounded-full"
                >
                    {
                        approved
                            ? (
                                <div className="p-0.5 bg-algo-teal-10 dark:bg-algo-teal/10 dark:group-hover:bg-algo-black/40 rounded-full">
                                    <CheckIcon className="size-5 p-1 text-algo-teal" />
                                </div>
                            ) : (
                                <div className="p-0.5 bg-red-500/10 rounded-full">
                                    <XIcon className="size-5 p-1 text-red-500" />
                                </div>
                            )
                    }
                    <h2 className="text-xs font-bold">
                        Majority Approved
                    </h2>
                </div>
            </PopoverTrigger>
            <PopoverContent
                side="top"
                sideOffset={8}
                className="text-sm"
                role="tooltip"
                {...contentProps}
            >
                Whether the relative majority of Approved over Rejected votes has been reached. Abstain votes do not affect the relative majority.
            </PopoverContent>
        </Popover>
    )
}