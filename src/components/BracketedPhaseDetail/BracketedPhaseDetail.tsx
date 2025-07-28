import { capitalizeFirstLetter } from "@/functions/capitalization";
import { cn } from "@/functions/utils";

export function BracketedPhaseDetail({ phase }: { phase: string }) {
  return (
    <span className="flex-grow-0 font-semibold inline-flex items-center">
      <span className="text-2xl  text-algo-blue-50 dark:text-algo-teal-50">
        [
      </span>
      <span
        className={cn(
          phase === "Empty" ? "text-algo-black-60" : "",
          phase === "Discussion" ? "text-algo-black dark:text-white" : "",
          phase === "Voting" ? "text-algo-orange dark:text-algo-yellow" : "",
          ["Approved", "Reviewed", "Funded"].includes(phase) ? "text-algo-blue dark:text-algo-teal" : "",
          ["Rejected", "Blocked", "Deleted"].includes(phase) ? "text-algo-red" : "",
          "p-0.5 px-1.5 text-base lg:text-lg",
        )}
      >
        {capitalizeFirstLetter(phase)}
      </span>
      <span className="text-2xl text-algo-blue-50 dark:text-algo-teal-50">
        ]
      </span>
    </span>
  );
}
