import { shortenAddress } from "@/functions/shortening";
import { UserCircleIcon } from "../icons/UserCircleIcon";
import { Link } from "../Link";

export default function UserPill({ address }: { address: string }) {
    return (
        <Link
            to={`/profile/${address}`}
            className="group flex items-center bg-white dark:bg-algo-black hover:bg-algo-blue dark:hover:bg-algo-teal hover:text-white rounded-full px-2.5 py-[3px] transition z-10"
        >
            <UserCircleIcon className="size-6 -translate-x-2 group-hover:stroke-white" />
            {address.length === 58 ? shortenAddress(address) : address}
        </Link>
    )
}