import { Link } from "@/components/Link";
import { Page } from "@/components/Page";
import { ProposalCard } from "@/components/ProposalCard/ProposalCard";
import ProposalReviewerCard from "@/components/ProposalReviewerCard/ProposalReviewerCard";
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
import { useWallet } from "@txnlab/use-wallet-react";
import { useParams } from "react-router-dom";
import { useProposal } from "src/hooks/useProposals";
import { useRegistry } from "src/hooks/useRegistry";

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
    const { activeAddress, transactionSigner } = useWallet();
    const registryGlobalState = useRegistry(); 
    // TODO: Get NFD name using the activeAddress
    const { proposal: proposalId } = useParams();
    const proposal = useProposal(Number(proposalId));

    if (proposal.isLoading || registryGlobalState.isLoading) {
        return <div>Loading...</div>
    }

    if (proposal.isError) {
        console.log('error', proposal.error);
        return (
            <div>
                <div>Encountered an error: {proposal.error.message}</div>
                <Link to="/" className="text-blue-600 dark:text-blue-400 hover:underline">
                    Return to Homepage?
                </Link>
            </div>
        );
    }

    if (!proposal.data) {
        return (
            <div>
                <div>Proposal not found!</div>
                <Link to="/" className="text-blue-600 dark:text-blue-400 hover:underline">
                    Return to Homepage?
                </Link>
            </div>
        );
    }
    return (
        <Page
            title={title}
            Sidebar={() =>
                <>
                <ProposalCardAndTitle
                    proposal={{
                        focus: proposal.data.focus,
                        requestedAmount: proposal.data.requestedAmount,
                        fundingType: proposal.data.fundingType,
                        forumLink: proposal.data.forumLink,
                        openSource: proposal.data.openSource,
                        status: proposal.data.status,
                    }}
                    />
                {registryGlobalState.data?.xgovReviewer && activeAddress && activeAddress === registryGlobalState.data?.xgovReviewer && (
                    <ProposalReviewerCard
                        proposalId={proposal.data.id}
                        status={proposal.data.status}
                        refetch={proposal.refetch}
                    />
                )}
                </>
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
                <ProposalCard proposal={proposal.data} activeAddress={activeAddress} transactionSigner={transactionSigner} refetcher={proposal.refetch} />
            </div>
        </Page>
    )
}