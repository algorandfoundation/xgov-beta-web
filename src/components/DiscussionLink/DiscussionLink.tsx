import { ChatBubbleLeftIcon } from "../icons/ChatBubbleLeftIcon";
import { Link } from "../Link";

export function DiscussionLink({ to = 'https://forum.algorand.co', postCount = 0 }: { to: string | undefined, postCount: number }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-2 px-2 py-1 bg-white dark:bg-algo-black hover:bg-algo-blue dark:hover:bg-algo-teal rounded-full z-10"
    >
      <dt>
        <span className="sr-only">Total comments</span>
        <ChatBubbleLeftIcon
          aria-hidden="true"
          className="size-4 md:size-6 stroke-[2] text-algo-blue dark:text-algo-teal group-hover:text-white"
        />
      </dt>
      {
        postCount > 0 && (
          <dd className="text-xs md:text-base text-algo-blue dark:text-algo-teal group-hover:text-white">
            {postCount}
          </dd>
        )
      }
    </Link>
  );
}
