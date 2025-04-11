import { Page } from "@/components/Page";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProposalFocus, ProposalFundingType, type ProposalMainCardDetails } from "@/types/proposals";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlgorandIcon } from "@/components/icons/AlgorandIcon";
import { cn } from "@/functions/utils";
import algosdk from "algosdk";
import { AlgorandClient as algorand } from '@/algorand/algo-client'
import { RegistryClient } from "@/algorand/contract-clients";
import { useWallet } from "@txnlab/use-wallet-react";
import { ProposalFactory } from "@algorandfoundation/xgov";
import { CID, create } from "kubo-rpc-client";
import { AlgoAmount } from "@algorandfoundation/algokit-utils/types/amount";
import { useProposal } from "@/hooks/useProposals";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner/LoadingSpinner";
import { InfoPopover } from "@/components/InfoPopover/InfoPopover";

const title = 'xGov';
const proposalFactory = new ProposalFactory({ algorand })
const ipfsClient = create('http://localhost:5001/api/v0')

export function EditProposalPage() {
    const navigate = useNavigate();
    const { proposal: proposalId } = useParams();
    const { activeAddress, transactionSigner } = useWallet()
    const { isLoading, data: proposal } = useProposal(Number(proposalId));

    useEffect(() => {
        if (!isLoading && proposal?.proposer !== activeAddress) {
            navigate("/")
        }
    }, [proposal, activeAddress])

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <Page title={title}>
            <div className="py-24 min-h-[calc(100svh-10.625rem)] max-w-7xl mx-auto">
                <h1 className="my-2 text-pretty text-2xl font-semibold tracking-tight text-algo-black dark:text-white">
                    Editing Proposal {proposalId}
                </h1>
                <EditProposalForm
                    proposal={proposal}
                    activeAddress={activeAddress}
                    transactionSigner={transactionSigner}
                />
            </div>
        </Page>
    )
}

const formSchema = z.object({
    title: z.string()
        .refine((val) => val !== '', { message: 'Required field' }),
    description: z.string()
        .refine((val) => val !== '', { message: 'Required field' }),
    requestedAmount: z.number()
        .refine((val) => val !== 0, { message: 'Required field' })
        .refine((val) => !isNaN(Number(val)) && Number(val) > 0, { message: 'Must be a positive number' }),
    team: z.string()
        .refine((val) => val !== '', { message: 'Required field' }),
    additionalInfo: z.string()
        .refine((val) => val !== '', { message: 'Required field' }),
    openSource: z.boolean(),
    focus: z.string(),
    fundingType: z.string(),
    // deliverables: z.string(),
    adoptionMetrics: z.array(z.string())
        .refine((val) => val.length > 0, { message: 'Required field' }),
    forumLink: z.string()
        .refine((val) => val !== '', { message: 'Required field' })
        .refine((val) => val.includes('https://forum.algorand.org/t/'))
})

export interface EditProposalFormProps {
    proposal: ProposalMainCardDetails | undefined;
    activeAddress: string | null;
    transactionSigner: (txnGroup: algosdk.Transaction[], indexesToSign: number[]) => Promise<Uint8Array[]>
}

function EditProposalForm({ proposal, activeAddress, transactionSigner }: EditProposalFormProps) {
    const navigate = useNavigate();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: proposal?.title || '',
            description: proposal?.description || '',
            requestedAmount: (Number(proposal?.requestedAmount) / 1_000_000) || 0,
            team: proposal?.team || '',
            additionalInfo: proposal?.additionalInfo || '',
            openSource: true,
            focus: String(proposal?.focus) || '0',
            fundingType: String(proposal?.fundingType) || '',
            // deliverables: currentProposal?.cid || '',
            adoptionMetrics: proposal?.adoptionMetrics || [],
            forumLink: proposal?.forumLink || '',
        },
        mode: 'onChange',
    })
    const { errors } = form.formState

    const onSubmit = async (data: z.infer<typeof formSchema>) => {

        if (!activeAddress) {
            console.error('No active address');
            return;
        }

        if (!proposal) {
            console.error('No current proposal');
            return;
        }

        const suggestedParams = await algorand.getSuggestedParams();

        // instance a new proposal client
        const proposalClient = proposalFactory.getAppClientById({ appId: proposal.id });

        const { cid } = await ipfsClient.add(JSON.stringify(
            {
                description: data.description,
                team: data.team,
                additionalInfo: data.additionalInfo,
                openSource: data.openSource,
                adoptionMetrics: data.adoptionMetrics,
                forumLink: data.forumLink,
            },
            (_, value) => (
                typeof value === 'bigint'
                    ? value.toString()
                    : value // return everything else unchanged
            )
        ), { cidVersion: 1 });

        const requestedAmount = AlgoAmount.Algos(BigInt(data.requestedAmount)).microAlgos

        const proposalSubmissionFee = Math.trunc(Number(
            (requestedAmount * BigInt(1_000)) / BigInt(10_000)
        ));

        console.log(`Payment Amount: ${proposalSubmissionFee}\n`);
        console.log(`Title: ${data.title}\n`);
        console.log(`Cid: ${cid.toString()}\n`);
        console.log(`Funding Type: ${data.fundingType}\n`);
        console.log(`Requested Amount: ${requestedAmount}\n`);
        console.log(`Focus: ${data.focus}\n\n`);

        try {
            await proposalClient
                .newGroup()
                .drop({
                    sender: activeAddress,
                    signer: transactionSigner,
                    args: {},
                    appReferences: [RegistryClient.appId],
                    accountReferences: [activeAddress],
                    extraFee: (1000).microAlgos(),
                })
                .submit({
                    sender: activeAddress,
                    signer: transactionSigner,
                    args: {
                        payment: algosdk.makePaymentTxnWithSuggestedParamsFromObject({
                            amount: proposalSubmissionFee,
                            from: activeAddress,
                            to: proposalClient.appAddress,
                            suggestedParams,
                        }),
                        title: data.title,
                        cid: CID.asCID(cid)!.bytes,
                        fundingType: Number(data.fundingType),
                        requestedAmount,
                        focus: Number(data.focus),
                    },
                    appReferences: [RegistryClient.appId],
                })
                .send()

            // send user to proposal page
            navigate(`/proposal/${proposal.id}`);

        } catch (e) {
            console.log(e);
            console.error('Failed to submit proposal');
            return
        }
    }

    return (
        <div className="p-4 rounded-lg bg-white dark:bg-algo-black border border-algo-blue dark:border-algo-teal">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="dark:text-white">
                                    Title
                                    <span className="ml-0.5 text-red-500">*</span>
                                    <InfoPopover className='mx-1.5 relative top-0.5 sm:mx-1 sm:top-0' label="Owner account">
                                        A short title of your proposal encompassing the main idea.
                                    </InfoPopover>
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        id="proposal-title"
                                        placeholder="Enter the title of your proposal"
                                        spellCheck="false"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage>{errors.title?.message}</FormMessage>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="forumLink"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="dark:text-white">
                                    Forum Link
                                    <span className="ml-0.5 text-red-500">*</span>
                                    <InfoPopover className='mx-1.5 relative top-0.5 sm:mx-1 sm:top-0' label="Owner account">
                                        A link to the Algorand forum where the proposal can be discussed.
                                    </InfoPopover>
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        id="proposal-forum-link"
                                        placeholder="Enter the forum link for discussion"
                                        spellCheck="false"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Paste the link to the Algorand forum discussion where xGovs can partake in discussion for this proposal.
                                </FormDescription>
                                <FormMessage>{errors.forumLink?.message}</FormMessage>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="dark:text-white">
                                    Description
                                    <span className="ml-0.5 text-red-500">*</span>
                                    <InfoPopover className='mx-1.5 relative top-0.5 sm:mx-1 sm:top-0' label="Owner account">
                                        A description of your proposal.
                                    </InfoPopover>
                                </FormLabel>
                                <FormControl>
                                    <Textarea
                                        className="min-h-40"
                                        id="proposal-description"
                                        placeholder="Describe your proposal"
                                        spellCheck="false"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage>{errors.description?.message}</FormMessage>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="team"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="dark:text-white">
                                    About the team
                                    <span className="ml-0.5 text-red-500">*</span>
                                    <InfoPopover className='mx-1.5 relative top-0.5 sm:mx-1 sm:top-0' label="Owner account">
                                        All relevant information about the team behind the proposal.
                                    </InfoPopover>
                                </FormLabel>
                                <FormControl>
                                    <Textarea
                                        className="min-h-40"
                                        id="proposal-team"
                                        placeholder="Who you are, what you've done"
                                        spellCheck="false"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage>{errors.team?.message}</FormMessage>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="additionalInfo"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="dark:text-white">
                                    Additional Info
                                    <span className="ml-0.5 text-red-500">*</span>
                                    <InfoPopover className='mx-1.5 relative top-0.5 sm:mx-1 sm:top-0' label="Owner account">
                                        Additional details about the proposal users may find helpful in deciding to vote.
                                    </InfoPopover>
                                </FormLabel>
                                <FormControl>
                                    <Textarea
                                        className="min-h-40"
                                        id="additional-info"
                                        placeholder="Any extra information you want to provide"
                                        spellCheck="false"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage>{errors.additionalInfo?.message}</FormMessage>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="openSource"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="dark:text-white">
                                    License
                                    <span className="ml-0.5 text-red-500">*</span>
                                    <InfoPopover className='mx-1.5 relative top-0.5 sm:mx-1 sm:top-0' label="Owner account">
                                        For the time being all Proposals are required to be open source.
                                    </InfoPopover>
                                </FormLabel>

                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={String(true)}
                                    disabled
                                >
                                    <FormControl>
                                        <SelectTrigger aria-label="Select a license">
                                            <SelectValue placeholder="Select a license" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value={String(true)}>Open Source</SelectItem>
                                        <SelectItem value={String(false)}>Closed Source</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage>{errors.openSource?.message}</FormMessage>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="focus"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="dark:text-white">
                                    Focus
                                    <span className="ml-0.5 text-red-500">*</span>
                                    <InfoPopover className='mx-1.5 relative top-0.5 sm:mx-1 sm:top-0' label="Owner account">
                                        The category most relevant to your proposal.
                                    </InfoPopover>
                                </FormLabel>

                                <Select onValueChange={field.onChange} defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger aria-label="Select proposal category">
                                            <SelectValue placeholder="Select proposal category" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value={String(ProposalFocus.FocusNull)}>None</SelectItem>
                                        <SelectItem value={String(ProposalFocus.FocusDeFi)}>DeFi</SelectItem>
                                        <SelectItem value={String(ProposalFocus.FocusEducation)}>Education</SelectItem>
                                        <SelectItem value={String(ProposalFocus.FocusLibraries)}>Libraries</SelectItem>
                                        <SelectItem value={String(ProposalFocus.FocusNFT)}>NFT</SelectItem>
                                        <SelectItem value={String(ProposalFocus.FocusTooling)}>Tooling</SelectItem>
                                        <SelectItem value={String(ProposalFocus.FocusSaas)}>Saas</SelectItem>
                                        <SelectItem value={String(ProposalFocus.FocusOther)}>Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    Select the focus of the work your proposal most relates to.
                                </FormDescription>
                                <FormMessage>{errors.focus?.message}</FormMessage>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="fundingType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="dark:text-white">
                                    Funding Type
                                    <span className="ml-0.5 text-red-500">*</span>
                                    <InfoPopover className='mx-1.5 relative top-0.5 sm:mx-1 sm:top-0' label="Owner account">
                                        For the time being only Retroactive funding is available.
                                    </InfoPopover>
                                </FormLabel>

                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={String(ProposalFundingType.Retroactive)}
                                    disabled
                                >
                                    <FormControl>
                                        <SelectTrigger aria-label="Select funding type">
                                            <SelectValue placeholder="Select funding type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value={String(ProposalFundingType.Null)}>None</SelectItem>
                                        <SelectItem value={String(ProposalFundingType.Proactive)}>Proactive</SelectItem>
                                        <SelectItem value={String(ProposalFundingType.Retroactive)}>Retroactive</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage>{errors.fundingType?.message}</FormMessage>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="adoptionMetrics"
                        render={({ field }) => {
                            const [metricInput, setMetricInput] = useState('');

                            const addMetricFromEvent = (e: React.KeyboardEvent<HTMLInputElement>) => {
                                e.preventDefault();
                                addMetric()
                            };

                            const addMetric = () => {
                                if (metricInput.trim() !== '') {
                                    const newMetrics = [...field.value, metricInput.trim()];
                                    field.onChange(newMetrics);
                                    setMetricInput('');
                                }
                            };

                            const removeMetric = (index: number) => {
                                const newMetrics = field.value.filter((_, i) => i !== index);
                                field.onChange(newMetrics);
                            };

                            return (
                                <FormItem>
                                    <FormLabel className="dark:text-white">
                                        Adoption Metrics
                                        <span className="ml-0.5 text-red-500">*</span>
                                        <InfoPopover className='mx-1.5 relative top-0.5 sm:mx-1 sm:top-0' label="Owner account">
                                            Quick metrics about the adoption of your work that can be used to measure success & ecosystem relevancy for the funds being requested.
                                        </InfoPopover>
                                    </FormLabel>
                                    <FormControl>
                                        <div className="space-y-2">
                                            <div className="relative">
                                                <Input
                                                    id="adoption-metrics"
                                                    placeholder="Type a metric and press Enter"
                                                    spellCheck="false"
                                                    value={metricInput}
                                                    onChange={(e) => setMetricInput(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            addMetricFromEvent(e);
                                                        }
                                                    }}
                                                />
                                                {
                                                    metricInput && (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            className="absolute right-[2px] top-1/2 transform -translate-y-1/2 scale-90"
                                                            onClick={() => {
                                                                addMetric();
                                                            }}
                                                        >
                                                            Add
                                                        </Button>
                                                    )
                                                }
                                            </div>

                                            {field.value && field.value.length > 0 && (
                                                <div className="mt-2 space-y-2">
                                                    {field.value.map((metric, index) => (
                                                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 dark:text-algo-black-20 rounded border dark:border-gray-700">
                                                            <span>{metric}</span>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeMetric(index)}
                                                            >
                                                                ✕
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </FormControl>
                                    <FormMessage>{errors.adoptionMetrics?.message}</FormMessage>
                                </FormItem>
                            );
                        }}
                    />

                    <FormField
                        control={form.control}
                        name="requestedAmount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="dark:text-white">
                                    Amount Requested
                                    <span className="ml-0.5 text-red-500">*</span>
                                    <InfoPopover className='mx-1.5 relative top-0.5 sm:mx-1 sm:top-0' label="Owner account">
                                        The amount of Algo being requested for the proposal.
                                    </InfoPopover>
                                </FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <AlgorandIcon className="size-3 dark:fill-white" />
                                        </div>
                                        <Input
                                            id="amount-requested"
                                            className={cn("pl-7", !!errors.requestedAmount?.message ? 'border-red-500' : '')}
                                            placeholder="0"
                                            type="number"
                                            onFocus={(e) => e.target.select()}
                                            onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                            value={field.value}
                                            onBlur={field.onBlur}
                                            name={field.name}
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage>{errors.requestedAmount?.message}</FormMessage>
                            </FormItem>
                        )}
                    />

                    <div className="flex items-center justify-end">
                        <Button type="submit">Save</Button>
                    </div>
                </form>
            </Form>
        </div >
    )
}