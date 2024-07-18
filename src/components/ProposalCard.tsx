import { capitalizeFirstLetter } from "../functions/capitalization";
import type { ProposalCardDetails } from "../types/proposals";
import { cn } from "../functions/tailwind";

export interface ProposalCardProps {
    proposal: ProposalCardDetails;
}

export const phaseToText = {
    submission: 'Submission',
    discussion: 'Discussion',
    vote: 'Voting',
    closure: 'Closure'
};

export default function ProposalCard({ proposal }: ProposalCardProps) {
    return (
        <li className="relative bg-white border-2 border-algo-black p-4 rounded-lg max-w-3xl">
            <h3 className="text-lg text-wrap w-52 lg:w-[38rem] lg:text-2xl mt-10 mb-6 lg:mb-14 font-bold">{proposal.title}</h3>
            <p className="text-xl">{proposal.category}</p>
            <p className="text-xl">{capitalizeFirstLetter(proposal.fundingType)}</p>
            <p className="text-xl mb-6 lg:mb-14">{proposal.requestedAmount} ALGO</p>

            <div className="absolute top-0 right-0 mt-4 mr-4 flex flex-col items-end gap-4">
                <p
                    className={cn(
                        proposal.phase === 'discussion' ? 'text-algo-blue border-algo-blue' : '',
                        proposal.phase === 'vote' ? 'text-algo-teal border-algo-teal' : '',
                        "p-0.5 px-4 rounded-full lg:text-lg text-algo-blue border-2 border-algo-blue"
                    )}>
                    {phaseToText[proposal.phase]}
                </p>
                <p className="text-lg my-4 mr-2">- {proposal.proposer}</p>
            </div>

            <a className="absolute bottom-0 right-0 mb-4 mr-4 text-xl font-bold" href="/proposal">read more</a>
        </li>
    )
}