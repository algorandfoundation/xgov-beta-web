import { ProposalFundingType, ProposalFundingTypeMap } from "@/api";
import { ArrowRightIcon } from "../icons/ArrowRightIcon";
import { ArrowUTurnLeftIcon } from "../icons/ArrowUTurnLeftIcon";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/functions";

const detailVariants = cva("flex items-center gap-2 text-xs md:text-lg", {
  variants: {
    variant: {
      default: "text-algo-black dark:text-white/80",
      secondary: "text-white dark:text-algo-black",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const iconVariants = cva("size-5", {
  variants: {
    variant: {
      default: "stroke-algo-blue dark:stroke-algo-teal",
      secondary: "stroke-white dark:stroke-algo-teal",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface FundingTypeDetailProps
  extends VariantProps<typeof detailVariants> {
  fundingType: ProposalFundingType;
}

export function FundingTypeDetail({
  variant,
  fundingType,
}: FundingTypeDetailProps) {
  return (
    <p className={cn(detailVariants({ variant }))}>
      {fundingType === ProposalFundingType.Proactive ? (
        <ArrowRightIcon className={cn(iconVariants({ variant }))} />
      ) : (
        <ArrowUTurnLeftIcon className={cn(iconVariants({ variant }))} />
      )}
      {ProposalFundingTypeMap[fundingType]}
    </p>
  );
}
