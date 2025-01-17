import { BarsIcon } from "@/components/icons/BarsIcon"
import { MoonIcon } from "@/components/icons/MoonIcon"
import { SunIcon } from "@/components/icons/SunIcon"
import { WalletIcon } from "@/components/icons/WalletIcon"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useStore } from "@nanostores/react"
import { $themeStore, toggleTheme } from "@/stores/themeStore"
import { useWallet } from "@txnlab/use-wallet-react"
import { useState, type ReactNode } from "react"

export function MobileNav({ trigger }: { trigger?: ReactNode }) {
    const { wallets, activeAddress, } = useWallet();
    const theme = useStore($themeStore);

    const [open, setOpen] = useState(false);
    const [connectDialogOpen, setConnectDialogOpen] = useState(false);

    return (
        <Dialog
            open={open}
            // reset the modal state when it closes
            onOpenChange={open => !open && setConnectDialogOpen(false)}
        >
            <DialogTrigger asChild>
                {
                    !trigger ? (
                        <Button
                            className="lg:hidden border-none shadow-none bg-transparent"
                            variant="outline"
                            size="icon"
                            onClick={() => setOpen(true)}
                        >
                            <BarsIcon className="size-10 text-white/70 dark:text-algo-black-70" />
                        </Button>
                    ) : trigger
                }
            </DialogTrigger>
            <DialogContent
                className="h-full"
                onCloseClick={() => setOpen(false)}
            >
                <DialogTitle className="sr-only">Navigate</DialogTitle>

                {
                    !connectDialogOpen ? (
                        <nav className="h-full flex flex-col items-start justify-center gap-14">

                            <Button className="text-5xl font-bold" variant="link">Docs</Button>
                            <Button className="text-5xl font-bold" variant="link">Cohort</Button>
                            <Button className="text-5xl font-bold" variant="link">Settings</Button>

                            <Button
                                className="text-5xl font-bold gap-4"
                                variant="link"
                                onClick={() => setConnectDialogOpen(true)}
                            >
                                <WalletIcon className="stroke-algo-black dark:stroke-white size-12" />
                                {true ? 'carl.algo' : !!activeAddress ? activeAddress : 'Connect Wallet'}
                            </Button>

                            <Button
                                className="text-5xl font-bold gap-4"
                                variant="link"
                                onClick={() => toggleTheme()}
                            >
                                {theme === 'light'
                                    ? <SunIcon className="stroke-algo-black dark:stroke-white size-12" />
                                    : <MoonIcon className="stroke-algo-black dark:stroke-white size-12" />
                                }
                                Theme
                            </Button>
                        </nav>
                    ) : (
                        <ul className="h-full flex flex-col items-start justify-center gap-14">
                            {
                                wallets.map((wallet) => (
                                    <li key={wallet.id}>
                                        <Button
                                            className="text-5xl font-bold flex gap-4"
                                            variant="link"
                                            onClick={() => {
                                                wallet.connect();
                                                setOpen(false);
                                            }}
                                        >
                                            <div className='bg-algo-black overflow-hidden rounded-2xl'>
                                                <div className='p-0.5'>
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
                                ))
                            }
                        </ul>
                    )
                }
            </DialogContent>
        </Dialog>
    )
}

