import { capitalizeFirstLetter } from "@/functions/capitalization";
import { cn } from "@/functions/utils";

export default function BracketedPhaseDetail({ phase }: { phase: string }) {
    return (
        <span className="flex-grow-0 font-semibold inline-flex items-center">
            <span className="text-2xl  text-algo-blue-50 dark:text-algo-teal-50">[</span>
            <span
                className={cn(
                    phase === 'Draft' ? 'text-algo-black-60' : '',
                    phase === 'Submission' ? 'text-algo-blue dark:text-algo-teal' : '',
                    phase === 'Discussion' ? 'text-algo-blue dark:text-algo-teal' : '',
                    phase === 'Voting' ? 'text-algo-teal dark:text-algo-blue-30' : '',

                    "p-0.5 px-1.5 text-base lg:text-lg"
                )}>

                {capitalizeFirstLetter(phase)}

            </span>
            <span className="text-2xl text-algo-blue-50 dark:text-algo-teal-50">]</span>
        </span>
    )
}