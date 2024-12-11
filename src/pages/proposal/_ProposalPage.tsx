import { Page } from "@/components/Page";
import { ProposalCard } from "@/components/ProposalCard/ProposalCard";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { shortenAddress } from "@/functions/shortening";
import type { ProposalInfoCardDetails } from "@/types/proposals";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { getProposal } from "src/api/proposals";

const title = 'xGov';

function ProposalCardAndTitle({ proposal }: { proposal: ProposalInfoCardDetails }) {
    return (
        <>
            <h1 className="text-3xl text-wrap lg:text-4xl max-w-4xl text-algo-black dark:text-white font-bold mt-16 mb-8 ">
                Info
            </h1>
            <ProposalCard proposal={proposal} />
        </>
    )
}

export function ProposalPage() {
    // const { activeAddress } = useWallet();
    // TODO: Get NFD name using the activeAddress
    const { proposal: proposalId } = useParams();
    console.log('params: ', proposalId);
    
    const proposal = useQuery({ 
        queryKey: ['getProposal', Number(proposalId!)],
        queryFn: () => getProposal(BigInt(proposalId!))
    });

    if (proposal.isLoading) {
        return <div>Loading...</div>
    }

    if (proposal.isError) {
        console.log('error', proposal.error);
        return <div>Error</div>
    }

    if (!proposal.data) {
        return <div>Proposal not found</div>
    }

    return (
        <Page
            title={title}
            Sidebar={() =>
                <ProposalCardAndTitle
                    proposal={{
                        category: proposal.data.category,
                        requestedAmount: proposal.data.requestedAmount,
                        fundingType: proposal.data.fundingType,
                        forumLink: proposal.data.forumLink,
                        openSource: proposal.data.openSource,
                    }}
                />
            }
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
                            <BreadcrumbPage>{Number(proposalId)}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-3xl text-wrap lg:text-4xl max-w-3xl text-algo-black dark:text-white font-bold mt-16 mb-8 ">
                    {Number(proposal.data?.id)} - {shortenAddress(proposal.data?.proposer!)}
                </h1>
                <ProposalCard proposal={proposal.data} />
            </div>
        </Page>
    )
}