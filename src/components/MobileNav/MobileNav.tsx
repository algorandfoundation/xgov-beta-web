import { BarsIcon } from "@/components/icons/BarsIcon";
import { MoonIcon } from "@/components/icons/MoonIcon";
import { SunIcon } from "@/components/icons/SunIcon";
import { WalletIcon } from "@/components/icons/WalletIcon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useStore } from "@nanostores/react";
import { $themeStore, toggleTheme } from "@/stores/themeStore";
import { useWallet } from "@txnlab/use-wallet-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "../Link";
import { UseWallet } from "@/hooks";

export function MobileNavIsland(props: { trigger?: ReactNode }) {
  return (
    <UseWallet>
      <MobileNav {...props} />
    </UseWallet>
  );
}

export function MobileNav({ trigger }: { trigger?: ReactNode }) {
  const { wallets, activeAddress, activeWallet } = useWallet();
  const theme = useStore($themeStore);

  const [open, setOpen] = useState(false);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setConnectDialogOpen(false);
    }
  }, [open]);

  return (
    <Dialog open={open}>
      <DialogTrigger asChild>
        {!trigger ? (
          <Button
            className="lg:hidden border-none shadow-none bg-transparent hover:text-white hover:bg-transparent dark:hover:text-algo-black"
            variant="outline"
            size="icon"
            onClick={() => setOpen(true)}
          >
            <BarsIcon className="size-10 text-white/70 dark:text-algo-black-70" />
          </Button>
        ) : (
          trigger
        )}
      </DialogTrigger>
      <DialogContent className="h-full" onCloseClick={() => setOpen(false)}>
        <DialogTitle className="sr-only">Navigate</DialogTitle>

        {!connectDialogOpen ? (
          <nav className="h-full flex flex-col items-start justify-center gap-14">
            <Link
              className="px-4 text-5xl font-bold text-algo-black dark:text-white"
              to="/"
            >
              Home
            </Link>
            <Link
              className="px-4 text-5xl font-bold text-algo-black dark:text-white"
              to="/docs"
            >
              Docs
            </Link>
            <Link
              className="px-4 text-5xl font-bold text-algo-black dark:text-white"
              to="/cohort"
            >
              Cohort
            </Link>

            {
              !!activeAddress && (
                <Link
                  className="px-4 text-5xl font-bold text-algo-black dark:text-white"
                  to={`/profile/${activeAddress}`}
                >
                  Profile
                </Link>
              )
            }

            <Button
              className="text-5xl font-bold gap-4"
              variant="link"
              onClick={() => {
                if (!!activeAddress) {
                  activeWallet?.disconnect();
                } else {
                  setConnectDialogOpen(true);
                }
              }}
            >
              {!!activeAddress ? (
                "Disconnect"
              ) : (
                <>
                  <WalletIcon className="stroke-algo-black dark:stroke-white size-12" />
                  Connect
                </>
              )}
            </Button>

            <Button
              className="text-5xl font-bold gap-4"
              variant="link"
              onClick={() => toggleTheme()}
            >
              {theme === "light" ? (
                <SunIcon className="stroke-algo-black dark:stroke-white size-12" />
              ) : (
                <MoonIcon className="stroke-algo-black dark:stroke-white size-12" />
              )}
              Theme
            </Button>
          </nav>
        ) : (
          <ul className="h-full flex flex-col items-start justify-center gap-14">
            {wallets.map((wallet) => (
              <li key={wallet.id}>
                <Button
                  className="text-5xl font-bold flex gap-4"
                  variant="link"
                  onClick={() => {
                    wallet.connect();
                    setOpen(false);
                  }}
                >
                  <div className="bg-algo-black overflow-hidden rounded-2xl">
                    <div className="p-0.5">
                      <div className="size-14 overflow-hidden rounded-2xl">
                        <img
                          className="object-cover"
                          src={wallet.metadata.icon}
                          alt={`${wallet.metadata.name} icon`}
                        />
                      </div>
                    </div>
                  </div>
                  {wallet.metadata.name}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
