import type { XGovSubscribeRequestBoxValue } from "@/api";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { CopyIcon } from "lucide-react";
import { useState } from "react";
import type { TransactionState } from "@/api/types/transaction_state";

export interface SubscribeRequestCardProps {
  request: XGovSubscribeRequestBoxValue & { id: bigint };
  onApprove: () => void;
  onReject: () => void;
  approveStatus?: TransactionState;
  rejectStatus?: TransactionState;
  errorMessage?: string;
}

export const relationMap: { [key: string]: string } = {
  "1": "Reti"
}

export function SubscribeRequestCard({ request, onApprove, onReject }: SubscribeRequestCardProps) {

  const [ownerOpenTooltip, setOwnerOpenTooltip] = useState<boolean>(false);
  const [xGovOpenTooltip, setXGovOpenTooltip] = useState<boolean>(false);

  const handleOwnerCopyClick = (address: string) => {
    navigator.clipboard.writeText(address);
    setOwnerOpenTooltip(true);

    // Auto-hide tooltip after 2 seconds
    setTimeout(() => {
      setOwnerOpenTooltip(false);
    }, 800);
  };

  const handleXGovCopyClick = (address: string) => {
    navigator.clipboard.writeText(address);
    setXGovOpenTooltip(true);

    // Auto-hide tooltip after 2 seconds
    setTimeout(() => {
      setXGovOpenTooltip(false);
    }, 800);
  };

  return (
    <div className="mb-2 flex items-center justify-between bg-algo-black-10 dark:bg-algo-black-90 text-algo-black dark:text-white p-2 md:p-4 rounded-lg w-full min-w-0 lg:max-w-xl">
      <div className="flex flex-col gap-2 items-start w-full min-w-0">
        <span className="mb-2 font-semibold text-algo-black-80 dark:text-algo-black-30 w-48">
          {relationMap[request.relationType.toString()]}
        </span>
        <span className="flex items-center gap-2 w-full min-w-0">
          <p className="select-all font-mono text-xxs truncate flex-1 min-w-0">
            <div className="inline-block font-bold ml-1.5 p-1 px-1.5 text-white bg-algo-black-60 dark:bg-algo-black rounded-lg">POOL</div>  {request.xgovAddr}
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            {request.xgovAddr && (
              <TooltipProvider delayDuration={200}>
                <Tooltip open={xGovOpenTooltip}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="xs"
                      className="p-1 h-6 dark:bg-algo-black-80"
                      onClick={() => handleXGovCopyClick(request.xgovAddr)}
                    >
                      <CopyIcon className="size-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">Copied!</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </span>
        <span className="flex items-center gap-2 w-full min-w-0">
          <p className="select-all font-mono text-xxs truncate flex-1 min-w-0">
            <div className="inline-block font-bold p-1 px-1.5 text-white bg-algo-black-60 dark:bg-algo-black rounded-lg">OWNER</div> {request.ownerAddr}
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            {request.ownerAddr && (
              <TooltipProvider delayDuration={200}>
                <Tooltip open={ownerOpenTooltip}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="xs"
                      className="p-1 h-6 dark:bg-algo-black-80"
                      onClick={() => handleOwnerCopyClick(request.ownerAddr)}
                    >
                      <CopyIcon className="size-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">Copied!</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </span>
        
        <div className="flex w-full mt-2 gap-2 min-w-0 justify-end">
          <Button
            size="sm"
            onClick={() => onApprove()}
          >
            Approve
          </Button>
          <Button
            size="sm"
            className="bg-algo-red text-white dark:text-white border-algo-red dark:bg-algo-red dark:border-algo-red"
            onClick={() => onReject()}
          >
            Reject
          </Button>
        </div>
      </div>
    </div>
  )
}