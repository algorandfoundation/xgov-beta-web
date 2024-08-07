import { capitalizeFirstLetter } from "../../functions/capitalization";
import { phaseToText, type ProposalSummaryCardDetails } from "../../types/proposals";
import { cn } from "../../functions/utils";
import { Link } from "@components/Link";

export interface ProposalCardProps {
    /**
     * Router Path
     */
    path?: string;
    proposal: ProposalSummaryCardDetails;
}

export function ProposalSummaryCard({ path, proposal }: ProposalCardProps) {
    return (
        <li className="relative bg-white dark:bg-algo-black border-2 border-algo-black dark:border-white text-algo-black dark:text-white p-4 rounded-lg max-w-3xl">
            <h3 className="text-lg text-wrap w-52 md:w-[20rem] lg:max-w-[38rem] lg:text-2xl mt-10 mb-6 lg:mb-14 font-bold">{proposal.title}</h3>
            <p className="text-xl">{proposal.category}</p>
            <p className="text-xl">{capitalizeFirstLetter(proposal.fundingType)}</p>
            <p className="text-xl mb-6 lg:mb-14">{proposal.requestedAmount.toLocaleString()} ALGO</p>

            <div className="absolute top-0 right-0 mt-4 mr-4 flex flex-col items-end gap-4">
                <span
                    className={cn(
                        proposal.phase === 'discussion' ? 'text-algo-blue border-algo-blue' : '',
                        proposal.phase === 'vote' ? 'text-algo-teal border-algo-teal' : '',
                        "p-0.5 px-4 rounded-full lg:text-lg border-2"
                    )}>
                    {phaseToText[proposal.phase]}
                </span>
                <p className="text-lg my-4 mr-2">- {proposal.proposer}</p>
            </div>

            <Link
                data-testid="proposol-link"
                className={cn(
                    path === `/proposal/${proposal.id}` ? 'bg-algo-blue' : '',
                    "absolute bottom-0 right-0 mb-4 mr-4 text-xl font-semi-bold hover:text-algo-teal dark:hover:text-algo-blue"
                )}
                to={`/proposal/${proposal.id}`}
            >
                Read More
            </Link>
        </li>
    )
}