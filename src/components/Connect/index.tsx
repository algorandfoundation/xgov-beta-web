import { WalletIcon } from "@/components/icons/WalletIcon"
import { Button } from "@/components/ui/button"

import { shortenAddress } from "@/functions/shortening"
import { BaseWallet, type Wallet } from "@txnlab/use-wallet-react"
import { useState, type ReactNode } from "react"
import { ConnectDialog } from "./Dialog"
import { ConnectDropdown } from "./Dropdown"

export interface ConnectProps {
    wallets: Wallet[];
    activeAddress: string | null;
    activeWallet?: BaseWallet | null;
    nfdName?: string;
}

export function Connect({ wallets, activeAddress, activeWallet, nfdName }: ConnectProps) {
    const [dialogOpen, setOpenDialog] = useState(false);

    if (!!activeAddress) {
        return (
            <ConnectDropdown
                activeAddress={activeAddress}
                onLogOut={() => activeWallet!.disconnect()}
            >
                <Button
                    id="connect-button"
                    className="flex items-center gap-2.5 bg-algo-black dark:bg-white text-lg rounded-md text-white dark:text-algo-black border-none shadow-none p-2 px-4"
                    variant="default"
                >
                    <WalletIcon className="size-6 stroke-white dark:stroke-algo-black stroke-[1.5]" />
                    {!!nfdName ? nfdName : shortenAddress(activeAddress)}
                </Button>
            </ConnectDropdown>
        )
    }

    return (
        <ConnectDialog open={dialogOpen} setOpen={setOpenDialog} wallets={wallets}>
            <Button
                id="connect-button"
                className="flex items-center gap-2.5 bg-algo-black dark:bg-white text-lg rounded-md text-white dark:text-algo-black border-none shadow-none p-2 px-4"
                variant="default"
                onClick={() => setOpenDialog(true)}
            >
                <WalletIcon className="size-6 stroke-white dark:stroke-algo-black stroke-[1.5]" />
                Connect Wallet
            </Button>
        </ConnectDialog>
    )
}

