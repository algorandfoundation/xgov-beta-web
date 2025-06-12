import { WalletIcon } from "@/components/icons/WalletIcon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { shortenAddress } from "@/functions/shortening";
import { BaseWallet, type Wallet } from "@txnlab/use-wallet-react";
import { useState } from "react";
import { cn } from "@/functions/utils";
import { Link } from "@/components/Link";
import { InfinityMirrorButton } from "../button/InfinityMirrorButton/InfinityMirrorButton";

export interface ConnectProps {
  path: string;
  onLogOut: () => void;
  wallets: Wallet[];
  activeAddress: string | null;
  activeWallet?: BaseWallet | null;
  nfdName?: string;
}

export function Connect({
  onLogOut,
  wallets,
  activeAddress,
  nfdName,
}: ConnectProps) {
  const [dialogOpen, setOpenDialog] = useState(false);

  if (!!activeAddress) {
    return (
      <ConnectDropdown activeAddress={activeAddress} onLogOut={onLogOut}>
        <InfinityMirrorButton
          id="connect-button"
          className="flex items-center gap-2.5 text-lg rounded-md min-w-48"
          variant="default"
        >
          <WalletIcon className="size-6 stroke-algo-black group-hover:stroke-white dark:stroke-white dark:group-hover:stroke-algo-black stroke-[1.5]" />
          {!!nfdName ? nfdName : shortenAddress(activeAddress)}
        </InfinityMirrorButton>
      </ConnectDropdown>
    );
  }

  return (
    <ConnectDialog open={dialogOpen} setOpen={setOpenDialog} wallets={wallets}>
      <InfinityMirrorButton
        id="connect-button"
        className="flex items-center gap-2.5 text-lg rounded-md"
        variant="default"
        onClick={() => setOpenDialog(true)}
      >
        <WalletIcon className="size-6 stroke-algo-black group-hover:stroke-white dark:stroke-white dark:group-hover:stroke-algo-black stroke-[1.5]" />
        Connect Wallet
      </InfinityMirrorButton>
    </ConnectDialog>
  );
}

interface ConnectDropdownProps {
  activeAddress: string | null;
  children: React.ReactNode;
  onLogOut: () => void;
}

function ConnectDropdown({
  activeAddress,
  children,
  onLogOut,
}: ConnectDropdownProps) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-52">
        <Link to={`/profile/${activeAddress}`}>
          <DropdownMenuItem>Profile</DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-algo-red" onClick={() => onLogOut()}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ConnectDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  wallets: Wallet[];
  children: React.ReactNode;
}

function ConnectDialog({
  open,
  setOpen,
  wallets,
  children,
}: ConnectDialogProps) {
  return (
    <Dialog open={open}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="sm:max-w-[425px] rounded-lg"
        onCloseClick={() => setOpen(false)}
      >
        <DialogHeader className="mt-12 flex flex-col items-start gap-2">
          <DialogTitle className="dark:text-white">
            Connect your wallet
          </DialogTitle>
          <DialogDescription>
            Choose a wallet to connect & use the xGov app
          </DialogDescription>
        </DialogHeader>
        <ul className="h-full flex flex-col sm:flex-row sm:flex-wrap items-start justify-center sm:justify-start gap-8 sm:gap-3">
          {wallets.map((wallet) => (
            <li key={wallet.id}>
              <button
                className="group text-5xl sm:text-xl font-bold flex items-center gap-4 h-18 pr-5 pl-1 py-1 sm:py-0.5 sm:bg-algo-blue/10 hover:bg-algo-blue dark:sm:bg-algo-teal/10 dark:hover:bg-algo-teal dark:text-white hover:text-white dark:hover:text-algo-black rounded-2xl transition"
                onClick={() => {
                  setOpen(false);
                  wallet.connect();
                }}
              >
                <div
                  className={cn(
                    ["exodus", "lute"].includes(
                      wallet.metadata.name.toLowerCase(),
                    )
                      ? "bg-algo-black p-0.5"
                      : "",
                    "size-14 sm:size-6 overflow-hidden rounded-2xl group-hover:shadow-xl",
                  )}
                >
                  <img
                    className="object-cover"
                    src={wallet.metadata.icon}
                    alt={`${wallet.metadata.name} icon`}
                  />
                </div>

                {wallet.metadata.name}
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
