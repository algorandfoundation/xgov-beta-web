import { FocusMap, ProposalFocus } from "@/types/proposals";
import { TargetIcon } from "../icons/TargetIcon";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/functions/utils";

const detailVariants = cva(
    "flex items-center gap-2 text-xs md:text-lg",
    {
        variants: {
            variant: {
                default: "text-algo-black dark:text-white/80",
                secondary: "text-white dark:text-algo-black"
            },
        },
        defaultVariants: {
            variant: "default"
        },
    }
)

const iconVariants = cva(
    "stroke-[6] size-5 ml-1 mr-1",
    {
        variants: {
            variant: {
                default: "stroke-algo-blue dark:stroke-algo-teal",
                secondary: "stroke-white dark:stroke-algo-teal"
            },
        },
        defaultVariants: {
            variant: "default"
        },
    }
)

export interface FocusDetailProps extends VariantProps<typeof detailVariants> {
    focus: ProposalFocus;
}

export default function FocusDetail({ variant, focus }: FocusDetailProps) {
    return (
        <p className={cn(detailVariants({ variant }))}>
            <TargetIcon className={cn(iconVariants({ variant }))} />
            {FocusMap[focus]}
        </p>
    )
}