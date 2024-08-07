import { WalletIcon } from "@components/icons/WalletIcon"
import { Button } from "@components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from "@components/ui/dialog"
import { shortenAddress } from "@functions/shortening"
import { useWallet } from "@txnlab/use-wallet-react"
import { type ReactNode } from "react"

export interface ConnectDialogProps {
    activeAddress: string | null;
    nfdName?: string;
    trigger?: ReactNode;
}

export function ConnectDialog({ activeAddress, nfdName, trigger }: ConnectDialogProps) {
    const { wallets, activeWallet, activeAccount } = useWallet()

    return (
        <Dialog>
            <DialogTrigger asChild>
                {
                    !trigger ? (
                        <Button
                            id="connect-button"
                            className="flex  items-center gap-2.5 bg-algo-black dark:bg-white text-lg rounded-md text-white dark:text-algo-black border-none shadow-none p-2 px-4"
                            variant="default"
                        >
                            <WalletIcon className="size-6 stroke-white dark:stroke-algo-black stroke-[1.5]" />
                            {!!nfdName ? nfdName : !!activeAddress ? shortenAddress(activeAddress) : "Connect Wallet"}
                        </Button>
                    ) : trigger
                }
            </DialogTrigger>
            <DialogContent className="h-full w-full">
                <DialogTitle className="sr-only">Select a Wallet</DialogTitle>
                <ul className="h-full flex flex-col items-start justify-center gap-14">
                    {
                        wallets.map((wallet) => (
                            <li key={wallet.id}>
                                <Button
                                    className="text-5xl font-bold flex gap-4"
                                    variant="link"
                                    onClick={() => wallet.connect()}
                                >
                                    <div className='size-12 bg-algo-black overflow-hidden rounded-xl'>
                                        <div className="relative h-full overflow-hidden">
                                            <img
                                                className="object-cover"
                                                src={wallet.metadata.icon}
                                                alt={`${wallet.metadata.name} icon`}
                                            />
                                        </div>
                                    </div>
                                    {wallet.metadata.name}
                                </Button>
                            </li>
                        ))
                    }
                </ul>
            </DialogContent>
        </Dialog>
    )
}

