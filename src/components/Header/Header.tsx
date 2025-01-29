import React from "react";
import {Link, type LinkProps} from "@/components/Link.tsx";

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
    showAdmin?: boolean;
}
export function Header({ path, title = "xGov", LinkComponent = Link, children, MobileNav, showAdmin }: HeaderProps){
    return (
        <header
            className="w-full flex justify-between items-center border-b-2 border-algo-black dark:border-white bg-white dark:bg-algo-black text-algo-black dark:text-white p-4 lg:px-10">
            <h1 className="text-4xl lg:text-4xl font-bold">{title}</h1>
            <div className="hidden lg:inline-flex items-center gap-2 lg:gap-6">
                <nav className="hidden md:flex gap-6 font-bold text-lg">
                    <LinkComponent data-testid="header-docs-link" className={path === '/docs' ? 'text-algo-blue' : ''} to="/docs">Docs</LinkComponent>
                    <LinkComponent data-testid="header-cohort-link" className={path === '/cohort' ? 'text-algo-blue' : ''} to="/cohort">Cohort</LinkComponent>
                    {showAdmin && <LinkComponent data-testid="header-admin-link" className={path === '/admin' ? 'text-algo-blue' : ''} to="/admin">Admin</LinkComponent>}
                </nav>
                {children}
            </div>
            {MobileNav}
        </header>
    )
}

