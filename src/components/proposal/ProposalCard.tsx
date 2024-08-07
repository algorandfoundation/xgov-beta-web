import { capitalizeFirstLetter } from "../../functions/capitalization";
import type { ProposalCardDetails } from "../../types/proposals";
import { cn } from "../../functions/utils";
import { Link } from "@components/Link";

export interface ProposalCardProps {
    proposal: ProposalCardDetails;
}

export const phaseToText = {
    submission: 'Submission',
    discussion: 'Discussion',
    vote: 'Voting',
    closure: 'Closure'
};

export function ProposalCard({ proposal }: ProposalCardProps) {
    const { phase, description, properties: { team, presentProposal, deliverable }, pastProposals } = proposal;

    return (
        <div className="relative bg-white dark:bg-algo-black border-2 border-algo-black dark:border-white text-algo-black dark:text-white p-4 rounded-lg max-w-3xl">
            <div className="absolute top-0 right-0 mt-4 mr-4 flex flex-col items-end gap-4">
                <span
                    className={cn(
                        phase === 'discussion' ? 'text-algo-blue border-algo-blue' : '',
                        phase === 'vote' ? 'text-algo-teal border-algo-teal' : '',
                        "p-0.5 px-4 rounded-full lg:text-lg text-algo-blue border-2 border-algo-blue"
                    )}>
                    {phaseToText[phase]}
                </span>
            </div>

            <div className="max-w-3xl">
                <h2 className="text-3xl font-bold mt-2 mb-4">Description</h2>
                <p className="text-xl dark:text-algo-blue-10">{description}</p>

                <h2 className="text-3xl font-bold my-4">About the team</h2>
                <p className="text-xl dark:text-algo-blue-10">{team}</p>

                <h2 className="text-3xl font-bold my-4">Additional Info</h2>
                <p className="text-xl dark:text-algo-blue-10">{presentProposal}</p>

                <h2 className="text-3xl font-bold my-4">Deliverables</h2>
                <p className="text-xl dark:text-algo-blue-10">{capitalizeFirstLetter(deliverable)}</p>

                <h2 className="text-3xl font-bold my-4">Past Proposals</h2>
                <ul className="text-xl dark:text-algo-blue-10 flex flex-col gap-2 ">
                    {pastProposals.map((pastProposal) => (
                        <li key={pastProposal.link} className="truncate">
                            <Link
                                key={pastProposal.link}
                                className="hover:text-algo-teal dark:hover:text-algo-blue"
                                to={pastProposal.link}
                            >
                                {pastProposal.title}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}