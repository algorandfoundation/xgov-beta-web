import { Header } from "./Header.tsx";
import { Link } from 'react-router-dom'
import type { ComponentProps, ComponentType, PropsWithChildren, ReactNode } from "react";
import type { LinkProps } from "./Link.tsx";
import { useWallet } from "@txnlab/use-wallet-react";
import { useStore } from "@nanostores/react";
import { $overlayStore } from "@stores/overlayStore.ts";
import { cn } from "@functions/utils.ts";
import { ThemeToggle } from "./button/ThemeToggle.tsx";
import { ConnectDialog } from "./dialogs/Connect.tsx";

export function DefaultSidebar(){
    return (
        <div></div>
    )
}

type ContentProps = PropsWithChildren<{
    overlay: boolean;
    Sidebar?: ComponentType;
}>

export function Content({ children, overlay, Sidebar = DefaultSidebar }: ContentProps){
    return (
        <main className={cn(
            overlay ? "max-h-full pointer-events-none overflow-hidden" : "",
            "m-auto p-4 lg:px-10 w-full grid grid-cols-1 lg:grid-cols-2"
        )}>
            {children}
            <div className="justify-self-end">
                <Sidebar/>
            </div>
        </main>
    )
}

export type PageProps = {
    title: string;
    children: ReactNode;

    // Header Components
    headerProps?: ComponentProps<typeof Header>;

    // Sidebar Components
    Sidebar?: ComponentType;
    // TODO: SidebarProps

    // Generic Components
    LinkComponent?: ComponentType<LinkProps>;
}

export function Page({
    children,
    title,
    headerProps,
    Sidebar = DefaultSidebar,
    LinkComponent = Link as unknown as ComponentType<LinkProps>
}: PageProps) {
    const overlay = useStore($overlayStore);
    const { activeAddress } = useWallet();
    // TODO: Get NFD name using the activeAddress

    return (
        <>
            <Header
                title={title}
                LinkComponent={LinkComponent}
                {...headerProps}
            >                
                <ConnectDialog
                    nfdName={'carl.algo'}
                    activeAddress={activeAddress}
                />
                <ThemeToggle />   
            </Header>
            <Content Sidebar={Sidebar} overlay={overlay.open}>
                {children}
            </Content>
        </>
    )
}

