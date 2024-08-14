import { WalletIcon } from "@/components/icons/WalletIcon"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { shortenAddress } from "@/functions/shortening"
import { BaseWallet, type Wallet } from "@txnlab/use-wallet-react"
import { useState } from "react"
import { cn } from "@/functions/utils";


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


interface ConnectDropdownProps {
    activeAddress: string | null;
    children: React.ReactNode;
    onLogOut: () => void;
}

function ConnectDropdown({ activeAddress, children, onLogOut }: ConnectDropdownProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {children}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52">
                <DropdownMenuGroup>
                    <DropdownMenuItem
                        onSelect={() => {
                            // TODO: navigate to profile
                        }}
                    >
                        Profile
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onLogOut()}>
                    Log out
                    <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

interface ConnectDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    wallets: Wallet[];
    children: React.ReactNode;
}

function ConnectDialog({ open, setOpen, wallets, children }: ConnectDialogProps) {
    return (
        <Dialog open={open}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent
                className="h-full w-full"
                onCloseClick={() => setOpen(false)}
            >
                <DialogTitle className="sr-only">Connect a Wallet</DialogTitle>
                <ul className="h-full flex flex-col items-start justify-center gap-8">
                    {
                        wallets.map((wallet) => (
                            <li key={wallet.id}>
                                <button
                                    className="group text-5xl font-bold flex items-center gap-4 h-18 pr-5 pl-1 py-1 hover:bg-algo-teal dark:hover:bg-algo-blue dark:text-white hover:text-white rounded-2xl transition"
                                    onClick={() => {
                                        setOpen(false);
                                        wallet.connect();
                                    }}
                                >
                                    <div
                                        className={cn(
                                            ['exodus', 'lute'].includes(wallet.metadata.name.toLowerCase())
                                                ? 'bg-algo-black'
                                                : '',
                                            "size-14 overflow-hidden rounded-2xl group-hover:shadow-xl"
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
                        ))
                    }
                </ul>
            </DialogContent>
        </Dialog>
    )
}