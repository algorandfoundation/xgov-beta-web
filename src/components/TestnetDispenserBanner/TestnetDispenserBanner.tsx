import { AlertOctagonIcon, ShowerHead, XIcon } from "lucide-react";
import { BecomeAnXGovIcon } from "../icons/BecomeAnXGovIcon";
import { Button } from "../ui/button";
import { useEffect, useState, type MouseEventHandler } from "react";
import { useBalance } from "@/hooks/useBalance";
import { useWallet } from "@txnlab/use-wallet-react";
import { UseQuery, UseWallet } from "@/hooks";

export function TestnetDispenserBanner() {
  const { activeAddress } = useWallet();
  const [showing, setShowing] = useState(false);
  const { data: balance } = useBalance(activeAddress);

  useEffect(() => {
    // show if account is unfunded OR has less than 0.1 ALGO spendable
    if (
      balance?.amount.algo === 0 ||
      (balance?.amount.algo && balance?.available.algo < 0.1)
    ) {
      setShowing(true);
    } else if (balance !== undefined) {
      setShowing(false);
    }
  }, [activeAddress, balance?.amount]);

  const hide: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    setShowing(false);
  };

  return !showing ? null : (
    <div className="flex justify-center">
      <a
        className="w-fit flex items-center gap-4 px-5 py-3 border dark:border-algo-teal border-algo-blue dark:text-algo-teal text-algo-blue rounded-lg overflow-hidden mb-8"
        href="https://bank.testnet.algorand.network/"
      >
        <div className="">
          <AlertOctagonIcon size={36} />
        </div>
        <div className="flex flex-col">
          <div className="text-xl font-bold">Testnet ALGO Required</div>
          <div className="">
            You need Testnet ALGO in order to participate.{" "}
            <span className="underline">Click here</span> to visit the Testnet
            ALGO dispenser.
          </div>
        </div>
        <div>
          <Button size="icon" onClick={hide} variant="outline">
            <XIcon />
          </Button>
        </div>
      </a>
    </div>
  );
}

export function TestnetDispenserBannerIsland() {
  return (
    <UseQuery>
      <UseWallet>
        <TestnetDispenserBanner />
      </UseWallet>
    </UseQuery>
  );
}
