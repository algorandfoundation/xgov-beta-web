
import type { ProposalInfoCardDetails } from "@types/proposals";
import { capitalizeFirstLetter } from "@functions/capitalization";
import { Link } from "@components/Link";

export interface ProposalProps {
    proposal: ProposalInfoCardDetails;
}

export function ProposalInfoCard({ proposal: { discussionLink, fundingType, category, license, requestedAmount }}: ProposalProps) {
    return (
        <div className="relative bg-white dark:bg-algo-black border-2 border-algo-black dark:border-white text-algo-black dark:text-white p-4 rounded-lg max-w-xl lg:min-w-[36rem]">
            <div className="max-w-3xl">
                <h2 className="text-xl font-bold mt-2 mb-4">Discussion Link</h2>
                <Link className="text-xl font-normal dark:text-algo-blue-10 hover:text-algo-teal dark:hover:text-algo-blue" to={discussionLink}>{discussionLink}</Link>

                <h2 className="text-xl font-bold my-4">Funding Type</h2>
                <p className="text-xl font-normal dark:text-algo-blue-10">{capitalizeFirstLetter(fundingType)}</p>

                <h2 className="text-xl font-bold my-4">Category</h2>
                <p className="text-xl font-normal dark:text-algo-blue-10">{category}</p>

                <h2 className="text-xl font-bold my-4">License</h2>
                <p className="text-xl font-normal dark:text-algo-blue-10">{capitalizeFirstLetter(license)}</p>

                <h2 className="text-xl font-bold my-4">Ask</h2>
                <p className="text-xl font-normal dark:text-algo-blue-10 mb-6 lg:mb-14">{requestedAmount.toLocaleString()} ALGO</p>
            </div>
        </div>
    )
}