import { ChatBubbleLeftIcon } from "../icons/ChatBubbleLeftIcon";
import { CheckCircleIcon } from "../icons/CheckCircleIcon";
import { Link } from "../Link";

export default function DiscussionLink({ to }: { to: string }) {
    return (
        <Link
            to={to}
            className="group flex items-center gap-2 px-2 py-1 bg-white dark:bg-algo-black hover:bg-algo-blue dark:hover:bg-algo-teal rounded-full z-10"
        >
            <dt>
                <span className="sr-only">Total comments</span>
                <ChatBubbleLeftIcon aria-hidden="true" className="size-4 md:size-6 stroke-[2] text-algo-blue dark:text-algo-teal group-hover:text-white" />
            </dt>
            <dd className="text-xs md:text-base text-algo-blue dark:text-algo-teal group-hover:text-white">7</dd>
        </Link>
    )
}