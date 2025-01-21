import { cva, type VariantProps } from "class-variance-authority";
import { AlgorandIcon } from "../icons/AlgorandIcon";
import { TokenIcon } from "../icons/TokenIcon";
import { cn } from "@/functions/utils";

const detailVariants = cva(
    "inline-flex items-center text-xs md:text-lg w-32",
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
);

const tokenIconVariants = cva(
    "stroke-[6] size-5 ml-1 mr-3",
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
);

const algoIconVariants = cva(
    "size-3 md:size-4 ml-1",
    {
        variants: {
            variant: {
                default: "fill-algo-black dark:fill-white/80",
                secondary: "dark:fill-algo-black"
            },
        },
        defaultVariants: {
            variant: "default"
        },
    }
);

export interface RequestedAmountDetailProps extends VariantProps<typeof detailVariants> {
    requestedAmount: bigint;
}

export default function RequestedAmountDetail({ variant, requestedAmount }: RequestedAmountDetailProps) {
    return (
        <p className={cn(detailVariants({ variant }))}>
            <TokenIcon className={cn(tokenIconVariants({ variant }))} />
            {(Number(requestedAmount) / 1_000_000).toLocaleString()}
            <AlgorandIcon className={cn(algoIconVariants({ variant }))} />
        </p>
    )
}