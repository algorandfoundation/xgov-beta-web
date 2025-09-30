import type { ProposerBoxState } from "@/api";
import {
  CheckIcon,
  CircleDashedIcon,
  ClockAlertIcon,
  XIcon,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export interface XGovProposerStatusPill {
  proposer?: { isProposer: boolean } & ProposerBoxState;
}

export function XGovProposerStatusPill({ proposer }: XGovProposerStatusPill) {
  const validKYC =
    (proposer &&
      proposer.kycStatus &&
      proposer.kycExpiring > Date.now() / 1000) ||
    false;

  return (
    <Tooltip>
      <TooltipTrigger aria-label={`Info: Become a Proposer`}>
        <div className="flex items-center w-fit gap-2 bg-algo-blue/10 dark:bg-algo-teal/10 py-1 pl-1 pr-3 rounded-full">
          {!proposer?.isProposer ? (
            <div className="p-0.5 bg-algo-red/10 rounded-full">
              <XIcon className="p-1 text-algo-red" />
            </div>
          ) : proposer?.isProposer && !proposer.kycStatus ? (
            <div className="p-0.5 bg-algo-blue/10 dark:bg-algo-blue/20 rounded-full">
              <CircleDashedIcon className="p-1 text-algo-blue animate-spin-slow" />
            </div>
          ) : proposer?.isProposer &&
            proposer.kycStatus &&
            proposer.kycExpiring < Date.now() / 1000 ? (
            <div className="p-0.5 bg-algo-blue/10 rounded-full">
              <ClockAlertIcon className="p-1 text-algo-red" />
            </div>
          ) : validKYC ? (
            <div className="p-0.5 bg-algo-teal-10 dark:bg-algo-teal/10 rounded-full">
              <CheckIcon className="p-1 text-algo-teal" />
            </div>
          ) : null}
          <h2 className="md:text-xl dark:text-white font-bold">Proposer</h2>
        </div>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        sideOffset={8}
        className="text-sm"
        role="tooltip"
      >
        {
          !proposer?.isProposer ? (
            "You are not a Proposer."
          ) : proposer?.isProposer && !proposer.kycStatus ? (
            "Becoming a Proposer requires KYC verification. Once submitted, this may take a few days to process."
          ) : proposer?.isProposer &&
            proposer.kycStatus &&
            proposer.kycExpiring < Date.now() / 1000 ? (
            "Your KYC has expired. Please contact support to renew."
          ) : validKYC ? (
            "You are a valid Proposer."
          ) : null
        }
      </TooltipContent>
    </Tooltip>

  );
}
