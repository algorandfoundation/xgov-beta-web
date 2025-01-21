import { shortenAddress } from "@/functions/shortening";
import { UserCircleIcon } from "../icons/UserCircleIcon";
import { Link } from "../Link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/functions/utils";

const pillVariants = cva(
    "group flex items-center rounded-full px-2.5 py-[3px] transition z-10",
    {
        variants: {
            variant: {
                default: "bg-white dark:bg-algo-black hover:bg-algo-blue dark:hover:bg-algo-teal hover:text-white",
                secondary: "bg-white dark:bg-algo-black hover:bg-algo-blue-30 dark:hover:bg-algo-teal hover:text-white"
            },
        },
        defaultVariants: {
            variant: "default"
        },
    }
)

export interface UserPillProps extends VariantProps<typeof pillVariants> {
    address: string
}

export default function UserPill({ variant, address }: UserPillProps) {
    return (
        <Link
            to={`/profile/${address}`}
            className={cn(pillVariants({ variant }))}
        >
            <UserCircleIcon className="size-6 -translate-x-2 group-hover:stroke-white" />
            {address.length === 58 ? shortenAddress(address) : address}
        </Link>
    )
}