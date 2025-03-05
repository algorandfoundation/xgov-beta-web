import { ThumbsDownIcon } from "../icons/ThumbsDownIcon";
import { ThumbsUpIcon } from "../icons/ThumbsUpIcon";

export default function VoteCounter() {
    return (
        <span className="flex gap-2 py-1">
            <span className="flex gap-1">
                <dt>
                    <span className="sr-only">Upvotes</span>
                    <ThumbsUpIcon aria-hidden="true" className="size-4 md:size-6 stroke-[2] text-algo-blue dark:text-algo-teal group-hover:text-white" />
                </dt>
                <dd className="text-xs md:text-base text-algo-blue dark:text-algo-teal group-hover:text-white">7</dd>
            </span>
            <span className="flex gap-1">
                <dt>
                    <span className="sr-only">Downvotes</span>
                    <ThumbsDownIcon aria-hidden="true" className="size-4 md:size-6 stroke-[2] text-algo-black dark:text-white/60 group-hover:text-white" />
                </dt>
                <dd className="text-xs md:text-base text-algo-black dark:text-white/60 group-hover:text-white">7</dd>
            </span>
        </span>
    )
}