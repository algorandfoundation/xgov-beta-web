import { Page } from "@/components/Page";
import { ProposalCard } from "@/components/Proposal/Card/Card";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { type ComponentType } from "react";

// mock data
import { mockProposal } from "@/components/Proposal/Card/Card.stories";
import { mockProposalInfo } from "@/components/Proposal/Card/Card.stories";

const title = 'xGov';

function ProposalCardAndTitle() {
    return (
        <>
            <h1 className="text-3xl text-wrap lg:text-4xl max-w-4xl text-algo-black dark:text-white font-bold mt-16 mb-8 ">
                Info
            </h1>
            <ProposalCard proposal={mockProposalInfo} />
        </>
    )
}

export function ProposalPage() {
    // const { activeAddress } = useWallet();
    // TODO: Get NFD name using the activeAddress

    return (
        <Page
            title={title}
            Sidebar={ProposalCardAndTitle as unknown as ComponentType}
        >
            <div>
                <Breadcrumb className="-mb-[20px]">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/">Home</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/">Proposal</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{mockProposal.id}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-3xl text-wrap lg:text-4xl max-w-3xl text-algo-black dark:text-white font-bold mt-16 mb-8 ">
                    {mockProposal.title} - {mockProposal.proposer}
                </h1>
                <ProposalCard proposal={mockProposal} />
            </div>
        </Page>
    )
}