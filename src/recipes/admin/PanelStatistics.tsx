import { Link } from "@/components/Link";
import {
  ProposalStatus,
  ProposalStatusMap,
  type ProposalSummaryCardDetails,
} from "@/api";
import { useGetAllProposals, useAllXGovs } from "@/hooks";
import { NetworkId } from "@txnlab/use-wallet-react";
import { CopyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";
import { BracketedPhaseDetail } from "@/components/BracketedPhaseDetail/BracketedPhaseDetail";

export interface PanelStatisticsData {
  xGovs: number;
  proposals: ProposalSummaryCardDetails[];
}

export const PanelStatistics = ({ network = NetworkId.LOCALNET }: { network?: NetworkId; }) => {
  const proposals = useGetAllProposals();
  const xGovs = useAllXGovs();
  const [openTooltips, setOpenTooltips] = useState<{ [key: number]: boolean }>({});

  const handleCopyClick = (index: number, xGov: string) => {
    navigator.clipboard.writeText(xGov);
    setOpenTooltips(prev => ({ ...prev, [index]: true }));

    // Auto-hide tooltip after 2 seconds
    setTimeout(() => {
      setOpenTooltips(prev => ({ ...prev, [index]: false }));
    }, 800);
  };

  return (
    <div className="mx-auto max-w-[120rem]">
      <h2 className="text-xl font-semibold text-wrap text-algo-black dark:text-white mb-2">
        Proposals <span className="ml-1 text-sm font-normal text-algo-black-60 dark:text-algo-black-20">{proposals.data ? proposals.data.length : 0} total</span>
      </h2>
      <div className="text-xxs text-wrap text-algo-black dark:text-white mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          {proposals.data &&
            proposals.data.map((proposal) => (
              <Link
                to={`/proposal/${proposal.id}`}
                className="flex flex-col gap-1 bg-algo-black-10 hover:bg-algo-black-40 dark:bg-algo-black-90 dark:hover:bg-algo-black-70 rounded-md p-3 transition"
                key={proposal.id.toString()}
              >
                <BracketedPhaseDetail phase={ProposalStatusMap[proposal.status]} />
                <h3 className="text-xl font-semibold">{proposal.title}</h3>
              </Link>
            ))}
        </div>
      </div>
      <h2 className="text-xl font-semibold text-wrap text-algo-black dark:text-white mb-2">
        xGovs <span className="ml-2 text-xs font-normal text-algo-black-60 dark:text-algo-black-20">{xGovs.data?.length ? xGovs.data.length : 0} total</span>
      </h2>
      <div className="text-xxs text-wrap text-algo-black dark:text-white">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          {xGovs.data &&
            xGovs.data.map((xGov, index) => (
              <div
                className="flex items-center justify-between gap-1 bg-algo-black-10 hover:bg-algo-black-40 dark:bg-algo-black-90 dark:hover:bg-algo-black-70 rounded-md px-2 pb-1 pt-1.5 transition"
                key={index}>
                <Link
                  to={`https://lora.algokit.io/${network}/account/${xGov}`}
                  target="_blank"
                  className=" text-center rounded-md font-mono overflow-hidden"
                >
                  <p className="truncate align-middle">{xGov}</p>
                </Link>

                <TooltipProvider delayDuration={200}>
                  <Tooltip open={openTooltips[index] || false}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="p-1 h-6 dark:bg-algo-black-80"
                        onClick={() => handleCopyClick(index, xGov)}
                      >
                        <CopyIcon className="size-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">Copied!</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
