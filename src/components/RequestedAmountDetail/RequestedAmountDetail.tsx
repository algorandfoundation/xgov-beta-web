import { AlgorandIcon } from "../icons/AlgorandIcon";
import { TokenIcon } from "../icons/TokenIcon";

export default function RequestedAmountDetail({ requestedAmount }: { requestedAmount: bigint}) {
    return (
        <p className="inline-flex items-center text-xs md:text-lg text-algo-black dark:text-white/80 w-32">
            <TokenIcon className="stroke-algo-blue dark:stroke-algo-teal stroke-[6] size-5 ml-1 mr-3" />
            {(Number(requestedAmount) / 1_000_000).toLocaleString()}
            <AlgorandIcon className="fill-algo-black dark:fill-white/80 size-3 ml-1" />
        </p>
    )
}