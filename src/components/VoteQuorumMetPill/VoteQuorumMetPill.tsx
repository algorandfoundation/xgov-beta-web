import { CheckIcon, XIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/functions/utils";

export interface VoteQuorumMetPillProps {
    approved: boolean
    quorumRequirement: number
    votesHave: number
    votesNeed: number
    className?: string
    label: string
}

export default function VoteQuorumMetPill({ approved, quorumRequirement, votesHave, votesNeed, className, label, ...contentProps }: VoteQuorumMetPillProps) {
    return (
        <Popover>
            <PopoverTrigger
                className={cn('text-muted-foreground hover:text-foreground', className)}
                aria-label={`Info: ${label}`}
            >
                <div className="group flex items-center gap-2 bg-algo-blue/10 hover:bg-algo-blue hover:text-white dark:text-white dark:bg-algo-teal/10 dark:hover:bg-algo-teal dark:hover:text-algo-black py-0.5 pl-0.5 pr-3 rounded-full">
                    {
                        approved
                            ? (
                                <div className="p-0.5 bg-algo-teal-10 dark:bg-algo-teal/10 dark:group-hover:bg-algo-black/40 rounded-full">
                                    <CheckIcon className="size-5 p-1 text-algo-teal" />
                                </div>
                            ) : (
                                <div className="p-0.5 bg-algo-red/10 rounded-full">
                                    <XIcon className="size-5 p-1 text-algo-red" />
                                </div>
                            )
                    }
                    <h2 className="[font-size:0.5rem] md:text-xs font-bold">
                        Vote Quorum
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
                Whether a weighted quorum of all xGov Committee voting power (1 vote) is reached.
                This Proposal needs a vote quorum of {quorumRequirement}% and currently has {(votesHave ?? 0).toLocaleString()} out of {(votesNeed ?? 0).toLocaleString()} required votes.
            </PopoverContent>
        </Popover>
    )
}
