import { FocusMap } from "@/types/proposals";
import { TargetIcon } from "../icons/TargetIcon";


export default function FocusDetail({ focus }: { focus: keyof typeof FocusMap }) {
    return (
        <p className="flex items-center gap-2 text-xs md:text-lg text-algo-black dark:text-white/80">
            <TargetIcon className="stroke-algo-blue dark:stroke-algo-teal stroke-[6] size-5 ml-1 mr-1" />
            {FocusMap[focus]}
        </p>
    )
}