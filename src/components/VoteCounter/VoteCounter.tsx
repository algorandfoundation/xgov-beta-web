import { ArrowDown, ArrowUp, Minus } from "lucide-react";

export default function VoteCounter({ approvals, rejections, nulls }: { approvals: number; rejections: number; nulls?: number }) {
    return (
        <span className="flex gap-4 py-1">
            <span className="flex gap-1">
                <dt>
                    <span className="sr-only">Upvotes</span>
                    <ArrowUp aria-hidden="true" className="size-4 md:size-6 stroke-[2] text-algo-blue dark:text-algo-teal" />
                </dt>
                <dd className="text-xs md:text-base text-algo-blue dark:text-algo-teal">{approvals.toLocaleString()}</dd>
            </span>
            {!!nulls && (
                <span className="flex gap-1">
                    <dt>
                        <span className="sr-only">Abstains</span>
                        <Minus aria-hidden="true" className="size-4 md:size-6 stroke-[2] text-algo-black dark:text-white/60" />
                    </dt>
                    <dd className="text-xs md:text-base text-algo-black dark:text-white/60">{nulls.toLocaleString()}</dd>
                </span>
            )}
            <span className="flex gap-1">
                <dt>
                    <span className="sr-only">Downvotes</span>
                    <ArrowDown aria-hidden="true" className="size-4 md:size-6 stroke-[2] text-red-500" />
                </dt>
                <dd className="text-xs md:text-base text-red-500">{rejections.toLocaleString()}</dd>
            </span>
        </span>
    )
}
