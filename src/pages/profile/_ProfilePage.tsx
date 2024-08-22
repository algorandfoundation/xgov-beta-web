import { Link, type LinkProps } from "@/components/Link";
import { Page } from "@/components/Page";
import { ProfileCard } from "@/components/ProfileCard/ProfileCard";
import { ProposalList } from "@/components/ProposalList/ProposalList";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import type { ComponentType } from "react";

// mock data
import { mockProposals } from "@/components/ProposalList/ProposalList.stories";
import { useWallet } from "@txnlab/use-wallet-react";

const title = 'xGov';

function RulesCard() {
    return (
        <div className="relative bg-white dark:bg-algo-black border-2 border-algo-black dark:border-white text-algo-black dark:text-white p-4 rounded-lg max-w-xl lg:min-w-[36rem]">
            <div className="max-w-3xl min-h-[36rem]">
                <h2 className="text-xl font-bold mt-2 mb-4">Platform Rules</h2>
            </div>
        </div>
    )
}

function RulesCardAndTitle() {
    return (
        <>
            <h1 className="text-3xl text-wrap lg:text-4xl max-w-4xl text-algo-black dark:text-white font-bold mt-16 mb-8 ">
                Rules
            </h1>
            <RulesCard />
        </>
    )
}

export function ProfilePage(){
    const { activeAddress } = useWallet();

    return (
        <Page
            title={title}
            LinkComponent={Link as unknown as ComponentType<LinkProps>}
            Sidebar={RulesCardAndTitle as unknown as ComponentType}
        >
            <div>
                <Breadcrumb className="-mb-[20px]">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/">Home</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Profile</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-3xl text-wrap lg:text-4xl max-w-3xl text-algo-black dark:text-white font-bold mt-16 mb-8 ">
                    My Profile
                </h1>
                <ProfileCard
                    activeAddress={activeAddress!}
                    votingAddress={activeAddress!}
                    isXGov
                    isProposer
                />
                <h1 className="text-3xl text-wrap lg:text-4xl max-w-3xl text-algo-black dark:text-white font-bold mt-16 mb-8 ">
                    My Proposals
                </h1>
                <ProposalList proposals={mockProposals} />
            </div>
        </Page>
    )
}