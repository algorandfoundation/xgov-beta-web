
import { Link } from "@/components/Link";
import type { ProposalSummaryCardDetails } from "@/types/proposals";


export interface panelStatisticsData {
  xGovs: number
  proposals: ProposalSummaryCardDetails[]
}

export const PanelStatistics = (data: panelStatisticsData) => {
  return (
    <>
      <h2 className="text-3xl text-wrap lg:text-4xl max-w-3xl text-algo-black dark:text-white font-bold mt-8 mb-4">
        xGovs: {data.xGovs}
      </h2>
      <h2 className="text-3xl text-wrap lg:text-4xl max-w-3xl text-algo-black dark:text-white font-bold mt-8 mb-4">
        Proposals ({data.proposals.length}):
      </h2>
      <div className="text-3xl text-wrap lg:text-3xl max-w-3xl text-algo-black dark:text-white font-bold mt-8 mb-4">
        <div className="pl-4">
          {data.proposals.map((proposal) => (
            <div key={proposal.id} className="mb-2">
              <Link to={`/proposal/${proposal.id}`} className="text-black-500 hover:underline">
                {proposal.title}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </>
  )
};