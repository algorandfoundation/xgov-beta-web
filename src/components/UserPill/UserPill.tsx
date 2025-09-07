import { shortenAddress } from "@/functions/shortening";
import { UserCircleIcon } from "../icons/UserCircleIcon";
import { Link } from "../Link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/functions/utils";

const pillVariants = cva(
  "group flex items-center rounded-full px-2.5 py-[3px] z-10",
  {
    variants: {
      variant: {
        default:
          "bg-white dark:bg-algo-black hover:bg-algo-blue dark:hover:bg-algo-teal hover:text-white",
        secondary:
          "bg-algo-blue/10 dark:bg-algo-teal/10 hover:bg-algo-blue dark:hover:bg-algo-teal text-algo-blue dark:text-white hover:text-white dark:hover:text-algo-black",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface UserPillProps extends VariantProps<typeof pillVariants> {
  nfdName?: string;
  address: string;
}

export function UserPill({ variant, address, nfdName }: UserPillProps) {
  return (
    <Link to={`/profile/${address}`} className={cn(pillVariants({ variant }))}>
      <UserCircleIcon className="size-6 -translate-x-2 group-hover:stroke-white" />
      { !!nfdName ?  nfdName : address.length === 58 ? shortenAddress(address) : address}
    </Link>
  );
}
