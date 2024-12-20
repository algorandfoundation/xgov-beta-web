import { FocusMap, isProposalInfoCardDetails, isProposalSummaryCardDetails, ProposalCategoryMap, ProposalFundingTypeMap, statusToPhase, type ProposalCardDetails, type ProposalInfoCardDetails, type ProposalMainCardDetails, type ProposalSummaryCardDetails } from "@/types/proposals";
import { cn } from "@/functions/utils";
import { Link } from "@/components/Link";
import { shortenAddress } from "@/functions/shortening";
import { capitalizeFirstLetter } from "@/functions/capitalization";

export interface ProposalCardProps {
    /**
     * Router Path
     */
    path?: string;
    proposal: ProposalCardDetails;
    mini?: boolean;
}

export function ProposalCard({ proposal, path = '', mini = false }: ProposalCardProps) {

    if (isProposalInfoCardDetails(proposal)) {
        return (
            <ProposalInfoCard proposal={proposal} />
        )
    }

    if (isProposalSummaryCardDetails(proposal)) {
        if (mini) {
            return (
                <MyProposalSummaryCard path={path} proposal={proposal} />
            )
        }

        return (
            <ProposalSummaryCard path={path} proposal={proposal} />
        )
    }

    // implicitly main card
    const { status, description, team, additionalInfo, pastProposalLinks } = proposal as ProposalMainCardDetails;

    const phase = statusToPhase[status];

    return (
        <li role="listitem" className="list-none relative bg-white dark:bg-algo-black border-2 border-algo-black dark:border-white text-algo-black dark:text-white p-4 rounded-lg max-w-3xl">
            <div className="absolute top-0 right-0 mt-4 mr-4 flex flex-col items-end gap-4">
                <div>
                    <span className="text-xl">[</span>
                    <span
                        className={cn(
                            phase === 'draft' ? 'text-algo-black-60' : '',
                            phase === 'submission' ? 'text-algo-blue dark:text-algo-teal' : '',
                            phase === 'discussion' ? 'text-algo-blue dark:text-algo-teal' : '',
                            phase === 'voting' ? 'text-algo-teal' : '',

                            "p-0.5 px-1 lg:text-lg"
                        )}>

                        {capitalizeFirstLetter(phase)}

                    </span>
                    <span className="text-xl">]</span>
                </div>
            </div>

            <div className="max-w-3xl">
                <h2 className="text-3xl font-bold mt-2 mb-4">Description</h2>
                <p className="text-xl dark:text-algo-blue-10">{description}</p>

                <h2 className="text-3xl font-bold my-4">About the team</h2>
                <p className="text-xl dark:text-algo-blue-10">{team}</p>

                <h2 className="text-3xl font-bold my-4">Additional Info</h2>
                <p className="text-xl dark:text-algo-blue-10">{additionalInfo}</p>

                {/* <h2 className="text-3xl font-bold my-4">Deliverables</h2>
                <p className="text-xl dark:text-algo-blue-10">{capitalizeFirstLetter(deliverable)}</p> */}

                {
                    !!pastProposalLinks && !!pastProposalLinks.length && (
                        <>
                            <h2 className="text-3xl font-bold my-4">Past Proposals</h2>
                            <ul className="text-xl dark:text-algo-blue-10 flex flex-col gap-2 ">
                                {pastProposalLinks.map((pastProposal) => (
                                    <li key={pastProposal} className="truncate">
                                        <Link
                                            key={pastProposal}
                                            className="hover:text-algo-teal dark:hover:text-algo-blue"
                                            to={'/proposal/' + pastProposal}
                                        >
                                            {pastProposal.toString()}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )
                }
            </div>
        </li>
    )
}

interface ProposalSummaryCardProps {
    /**
     * Router Path
     */
    path?: string;
    proposal: ProposalSummaryCardDetails;
}

function ProposalSummaryCard({
    path,
    proposal: {
        id,
        title,
        status,
        focus,
        fundingType,
        requestedAmount,
        proposer
    }
}: ProposalSummaryCardProps) {

    const phase = statusToPhase[status];

    return (
        <li role="listitem" className="list-none relative flex bg-white dark:bg-algo-black border-2 border-algo-black dark:border-white text-algo-black dark:text-white p-4 rounded-lg max-w-3xl">
            <div className="flex-1 flex flex-col justify-center">
                <h3 className="text-lg text-wrap lg:text-2xl mb-3 lg:mb-6 font-bold">{title}</h3>
                <p className="text-xl">{FocusMap[focus]}</p>
                <p className="text-xl">{ProposalFundingTypeMap[fundingType]}</p>
                <p className="text-xl">{(Number(requestedAmount) / 1_000_000).toLocaleString()} ALGO</p>
            </div>

            <div className="flex flex-col items-end">
                <div>
                    <span className="text-xl">[</span>
                    <span
                        className={cn(
                            phase === 'draft' ? 'text-algo-black-60' : '',
                            phase === 'submission' ? 'text-algo-blue dark:text-algo-teal' : '',
                            phase === 'discussion' ? 'text-algo-blue dark:text-algo-teal' : '',
                            phase === 'voting' ? 'text-algo-teal' : '',

                            "p-0.5 px-1 lg:text-lg"
                        )}>

                        {capitalizeFirstLetter(phase)}

                    </span>
                    <span className="text-xl">]</span>
                </div>
                <p className="text-lg my-1 mr-2">- {proposer.length === 58 ? shortenAddress(proposer) : proposer}</p>
            </div>

            <Link
                data-testid="proposol-link"
                className={cn(
                    path === `/proposal/${id}` ? 'bg-algo-blue' : '',
                    "absolute bottom-0 right-0 mb-4 mr-4 text-xl font-semi-bold hover:text-algo-teal dark:hover:text-algo-blue"
                )}
                to={`/proposal/${Number(id)}`}
            >
                Read More
            </Link>
        </li>
    )
}

interface MyProposalSummaryCardProps {
    /**
     * Router Path
     */
    path?: string;
    proposal: ProposalInfoCardDetails;
}



function MyProposalSummaryCard({
    path,
    proposal: {
        id,
        title,
        status,
        focus,
        fundingType,
        requestedAmount,
    }
}: ProposalSummaryCardProps) {

    const phase = statusToPhase[status];

    return (
        <li className="bg-white hover:bg-algo-teal-10 dark:hover:bg-algo-blue-50 dark:bg-algo-black border-2 border-algo-black hover:border-algo-teal dark:border-white dark:hover:border-algo-blue-40 text-algo-black dark:text-white rounded-lg max-w-3xl">
            <div className="p-2">
                <Link to={`/proposal/${id}`}>
                    <div className="flex items-center">
                        <h3 className="text-lg w-full font-bold truncate">{title}</h3>
                        <div>
                            <span className="text-xl">[</span>
                            <span
                                className={cn(
                                    phase === 'draft' ? 'text-algo-black-60' : '',
                                    phase === 'submission' ? 'text-algo-blue dark:text-algo-teal' : '',
                                    phase === 'discussion' ? 'text-algo-blue dark:text-algo-teal' : '',
                                    phase === 'voting' ? 'text-algo-teal' : '',
                                    "p-0.5 px-1 lg:text-lg"
                                )}>

                                {capitalizeFirstLetter(phase)}

                            </span>
                            <span className="text-xl">]</span>
                        </div>
                    </div>

                    <div className="w-full flex items-center justify-between gap-4">
                        <div className="flex">
                            <span className="w-36 text-lg font-normal">{focus}</span>
                            <span className="w-36 text-lg font-normal">{ProposalFundingTypeMap[fundingType]}</span>
                            <span className="text-lg font-normal">{requestedAmount.toLocaleString()} ALGO</span>
                        </div>
                    </div>
                </Link>
            </div>
        </li>
    )
}

interface ProposalProps {
    proposal: ProposalInfoCardDetails;
}

function ProposalInfoCard({ proposal: { forumLink, fundingType, focus, openSource, requestedAmount } }: ProposalProps) {
    return (
        <li role="listitem" className="list-none relative bg-white dark:bg-algo-black border-2 border-algo-black dark:border-white text-algo-black dark:text-white p-4 rounded-lg max-w-xl lg:min-w-[36rem]">
            <div className="max-w-3xl">
                <h2 className="text-xl font-bold mt-2 mb-4">Discussion Link</h2>
                <Link className="text-xl font-normal dark:text-algo-blue-10 hover:text-algo-teal dark:hover:text-algo-blue" to={forumLink}>{forumLink}</Link>

                <h2 className="text-xl font-bold my-4">Funding Type</h2>
                <p className="text-xl font-normal dark:text-algo-blue-10">{ProposalFundingTypeMap[fundingType]}</p>

                <h2 className="text-xl font-bold my-4">Category</h2>
                <p className="text-xl font-normal dark:text-algo-blue-10">{FocusMap[focus]}</p>

                <h2 className="text-xl font-bold my-4">Open Source?</h2>
                <p className="text-xl font-normal dark:text-algo-blue-10">{openSource ? '✅' : '❌'}</p>

                <h2 className="text-xl font-bold my-4">Ask</h2>
                <p className="text-xl font-normal dark:text-algo-blue-10 mb-6 lg:mb-14">{(Number(requestedAmount) / 1_000_000).toLocaleString()} ALGO</p>
            </div>
        </li>
    )
}