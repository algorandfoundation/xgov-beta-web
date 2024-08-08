import { Link, type LinkProps } from "@/components/Link";
import { Page } from "@/components/Page";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import type { ComponentType } from "react";

const title = 'xGov';

export function DocsPage(){
    // TODO Handle other pages operations
    return (
        <Page title={title} LinkComponent={Link as unknown as ComponentType<LinkProps>}>
            <div>
                <Breadcrumb className="-mb-[20px]">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/">Home</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Docs</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-3xl text-wrap lg:text-4xl max-w-3xl text-algo-black dark:text-white font-bold mt-16 mb-8 ">
                    Docs
                </h1>
            </div>
        </Page>
    )
}