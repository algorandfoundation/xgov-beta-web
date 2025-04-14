import { Link } from "@/components/Link";
import { shortenAddress } from "@/functions/shortening";
import {
  ProposalStatus,
  ProposalStatusMap,
  type ProposalSummaryCardDetails,
} from "@/api";
import { useGetAllProposals, useAllXGovs } from "@/hooks";

export interface PanelStatisticsData {
  xGovs: number;
  proposals: ProposalSummaryCardDetails[];
}

export const PanelStatistics = () => {
  const proposals = useGetAllProposals();
  const xGovs = useAllXGovs();

  return (
    <>
      <h2 className="text-3xl text-wrap lg:text-4xl max-w-3xl text-algo-black dark:text-white font-bold mt-8 mb-4">
        xGovs ({xGovs.data?.length ? xGovs.data.length : 0}):
      </h2>
      <div className="text-3xl text-wrap lg:text-3xl max-w-3xl text-algo-black dark:text-white font-bold mt-8 mb-4">
        <div className="pl-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {xGovs.data &&
            xGovs.data.map((xGov, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg shadow-md bg-white dark:bg-algo-black overflow-hidden"
              >
                <p title={xGov}>{shortenAddress(xGov)}</p>
              </div>
            ))}
        </div>
      </div>
      <h2 className="text-3xl text-wrap lg:text-4xl max-w-3xl text-algo-black dark:text-white font-bold mt-8 mb-4">
        Proposals ({proposals.data ? proposals.data.length : 0}):
      </h2>
      <div className="text-3xl text-wrap lg:text-3xl max-w-3xl text-algo-black dark:text-white font-bold mt-8 mb-4">
        <div className="pl-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {proposals.data &&
            proposals.data.map((proposal) => (
              <div
                key={proposal.id.toString()}
                className="p-4 border rounded-lg shadow-md bg-white dark:bg-algo-black"
              >
                <Link
                  to={`/proposal/${proposal.id}`}
                  className="text-black-500 hover:underline"
                >
                  <h3 className="text-xl font-semibold">{proposal.title}</h3>
                </Link>
                <p
                  className={`text-sm ${proposal.status === ProposalStatus.ProposalStatusBlocked ? "text-red-500" : "text-gray-500"} dark:${proposal.status === ProposalStatus.ProposalStatusBlocked ? "text-red-400" : "text-gray-400"}`}
                >
                  Status: {ProposalStatusMap[proposal.status]}
                </p>
              </div>
            ))}
        </div>
      </div>
    </>
  );
};
