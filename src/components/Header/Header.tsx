import React from "react";
import { Link, type LinkProps } from "@/components/Link.tsx";
import { AlgorandIcon } from "../icons/AlgorandIcon";

export type HeaderProps = {
    title?: string;
    /**
     * Router Path
     */
    path?: string;
    /**
     * Router Component to use for navigation
     */
    LinkComponent?: React.ComponentType<LinkProps>;
    MobileNav?: React.ReactNode;
    children?: React.ReactNode;
}
export function Header({ path, title = "xGov", LinkComponent = Link, children, MobileNav }: HeaderProps) {
    return (
        <header
            className="fixed w-full px-2 md:px-4 z-50">
            <div className="w-full bg-algo-blue dark:bg-algo-teal text-white rounded-b-3xl flex justify-between items-center py-4 px-3 lg:px-10 ">
                <div className="flex gap-4 items-center">
                    <AlgorandIcon className="fill-white dark:fill-white size-8" />
                </div>

                <div className="hidden lg:inline-flex items-center gap-2 lg:gap-6">
                    <nav className="hidden md:flex gap-6 font-bold text-lg">
                        <LinkComponent data-testid="header-docs-link" className={path === '/docs' ? 'text-algo-blue' : ''} to="/docs">Docs</LinkComponent>
                        <LinkComponent data-testid="header-cohort-link" className={path === '/cohort' ? 'text-algo-blue' : ''} to="/cohort">Cohort</LinkComponent>
                    </nav>
                    {children}
                </div>
                {MobileNav}
            </div>
        </header>
    )
}

