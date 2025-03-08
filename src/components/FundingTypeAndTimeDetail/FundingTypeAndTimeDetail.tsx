import { ProposalFundingType, ProposalFundingTypeMap } from "@/types/proposals";

export default function FundingTypeAndTimeDetail({ fundingType, time }: {  fundingType: ProposalFundingType, time: string }) {
    return (
        <div className="flex items-center gap-2 md:gap-4 text-xs md:text-lg text-algo-black dark:text-white/80">
            {ProposalFundingTypeMap[fundingType]}
            <span className="font-bold text-algo-blue dark:text-algo-teal">//</span>
            <p className="w-10 text-nowrap md:w-16 text-end">
                <time dateTime="2023-01-23T22:34Z">{time}</time>
            </p>
        </div>
    )
}