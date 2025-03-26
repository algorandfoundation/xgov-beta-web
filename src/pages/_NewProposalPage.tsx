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
import { CheckIcon } from "@radix-ui/react-icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProposalFocus, ProposalFundingType, ProposalStatus } from "@/types/proposals";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlgorandIcon } from "@/components/icons/AlgorandIcon";
import { cn } from "@/functions/utils";
import algosdk, { ALGORAND_MIN_TX_FEE } from "algosdk";
import { AlgorandClient as algorand } from '@/algorand/algo-client'
import { RegistryClient } from "@/algorand/contract-clients";
import { useWallet } from "@txnlab/use-wallet-react";
import { PROPOSAL_FEE } from "@/constants";
import { ProposalFactory } from "@algorandfoundation/xgov";
import { CID, create } from "kubo-rpc-client";
import { AlgoAmount } from "@algorandfoundation/algokit-utils/types/amount";
import { useProposalsByProposer } from "@/hooks/useProposals";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const title = 'xGov';
const proposalFactory = new ProposalFactory({ algorand })
const ipfsClient = create('http://localhost:5001/api/v0')

export function NewProposalPage() {
    return (
        <Page title={title}>
            <div className="py-24 min-h-[calc(100svh-10.625rem)] max-w-7xl mx-auto">
                <h1 className="my-2 text-pretty text-2xl font-semibold tracking-tight text-algo-black dark:text-white">
                    New Proposal
                </h1>
                <NewProposalForm />
            </div>
        </Page>
    )
}

function TermsAndConditions({ setAgreed }: { setAgreed: (value: boolean) => void }) {
    return (
        <div className="p-4 rounded-lg bg-algo-blue-20 dark:bg-algo-teal-20">
            <h1 className="font-bold">Terms and Conditions</h1>
            <p className="text-algo-black-60 mb-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut tincidunt a diam in vehicula. Cras mollis iaculis tortor sit amet dapibus. Etiam ac risus pulvinar, faucibus leo vel, facilisis mi. Aenean cursus nibh sed leo faucibus, at suscipit velit congue. Duis sit amet lacus pellentesque, ullamcorper eros nec, lacinia justo. Sed pharetra nibh at ligula condimentum semper. Vivamus venenatis, purus sit amet sollicitudin sollicitudin, ex justo fringilla sapien, ac euismod purus orci consequat dolor. Donec nec pretium lectus. In sagittis metus ac erat hendrerit lacinia. Donec hendrerit quam et nibh ullamcorper vulputate. In in mauris et sapien tincidunt sagittis.
                Vestibulum eu nunc nisl. Pellentesque rutrum dictum vehicula. Curabitur et eros nisi. Sed interdum felis a dignissim accumsan. Etiam vitae elit sed nulla commodo tincidunt. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Cras aliquet erat a viverra lobortis. Nullam eu mi pulvinar, faucibus ligula nec, feugiat magna. Suspendisse ultrices ex vel fringilla convallis.Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut tincidunt a diam in vehicula. Cras mollis iaculis tortor sit amet dapibus. Etiam ac risus pulvinar, faucibus leo vel, facilisis mi. Aenean cursus nibh sed leo faucibus, at suscipit velit congue. Duis sit amet lacus pellentesque, ullamcorper eros nec, lacinia justo. Sed pharetra nibh at ligula condimentum semper. Vivamus venenatis, purus sit amet sollicitudin sollicitudin, ex justo fringilla sapien, ac euismod purus orci consequat dolor. Donec nec pretium lectus. In sagittis metus ac erat hendrerit lacinia. Donec hendrerit quam et nibh ullamcorper vulputate. In in mauris et sapien tincidunt sagittis.
            </p>
            <button
                type="button"
                className="group w-full p-4 flex items-center justify-start gap-2 border border-algo-blue-50 dark:border-algo-teal-50 hover:bg-algo-blue-50 dark:hover:bg-algo-teal-30 hover:text-algo-white dark:hover:text-algo-black rounded-md"
                onClick={() => setAgreed(true)}
            >
                <div className="h-5 w-5 flex items-center justify-center border border-algo-black rounded-sm">
                    <CheckIcon className="h-4 w-4 opacity-0 group-hover:opacity-100" />
                </div>
                <span>I've read and agree to the terms and conditions</span>
            </button>
        </div>
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

const activeProposalTypes = [
    ProposalStatus.ProposalStatusDraft,
    ProposalStatus.ProposalStatusFinal,
    ProposalStatus.ProposalStatusVoting
]

function NewProposalForm() {
    const navigate = useNavigate();
    const { activeAddress, transactionSigner } = useWallet()
    const proposalsData = useProposalsByProposer(activeAddress);

    const emptyProposals = !!proposalsData.data && proposalsData.data?.filter(proposal => proposal.status === ProposalStatus.ProposalStatusEmpty)
    const emptyProposal = emptyProposals && emptyProposals.length > 0 && emptyProposals[0]

    const currentProposals = !!proposalsData.data && proposalsData.data?.filter(proposal => activeProposalTypes.includes(proposal.status))
    const currentProposal = currentProposals && currentProposals.length > 0 && currentProposals[0]

    useEffect(() => {
        if (currentProposal) {
            navigate(`/proposal/${currentProposal.id}`)
        }
    }, [currentProposal])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: '',
            description: '',
            requestedAmount: 0,
            team: '',
            additionalInfo: '',
            openSource: true,
            focus: '',
            fundingType: String(ProposalFundingType.Retroactive),
            // deliverables: '',
            adoptionMetrics: [],
            forumLink: '',
        },
        mode: 'onChange',
    })

    const { errors } = form.formState

    const onSubmit = async (data: z.infer<typeof formSchema>) => {

        if (!activeAddress) {
            console.error('No active address');
            return;
        }

        const proposalFee = (PROPOSAL_FEE).microAlgo();
        const addr = algosdk.decodeAddress(activeAddress).publicKey;
        const proposerBoxName = new Uint8Array(Buffer.concat([Buffer.from('p'), addr]));

        const suggestedParams = await algorand.getSuggestedParams();

        let appId: bigint = BigInt(0);
        console.log('has empty proposal: ', !!emptyProposal)
        if (!emptyProposal) {
            // open a proposal
            let result;
            try {
                result = await RegistryClient.send.openProposal({
                    sender: activeAddress,
                    signer: transactionSigner,
                    args: {
                        payment: algosdk.makePaymentTxnWithSuggestedParamsFromObject({
                            amount: proposalFee.microAlgos,
                            from: activeAddress,
                            to: RegistryClient.appAddress,
                            suggestedParams,
                        }),
                    },
                    boxReferences: [proposerBoxName],
                    extraFee: (ALGORAND_MIN_TX_FEE * 2).microAlgos(),
                });
            } catch (e) {
                console.error(e);
                console.error('Failed to create proposal');
                return
            }

            // Store proposal ID if available
            if (!result.return) {
                console.error('Proposal creation failed');
                return
            }

            console.log(`\nNew Proposal: ${result.return}\n`)
            appId = result.return;
        } else {
            appId = emptyProposal.id;
        }

        // instance a new proposal client
        const proposalClient = proposalFactory.getAppClientById({ appId });

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
            await proposalClient.send.submit({
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
            });

            // send user to proposal page
            console.log('Proposal submitted');
            navigate(`/proposal/${appId}`);

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
                                    <span className="ml-1 text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        id="proposal-title"
                                        placeholder="Enter the title of your proposal"
                                        autoComplete="new-password"
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
                                    <span className="ml-1 text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        id="proposal-forum-link"
                                        placeholder="Enter the title of your proposal"
                                        autoComplete="new-password"
                                        spellCheck="false"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Paste the link to the algorand forum discussion where xGovs can partake in discussion for this proposal.
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
                                    <span className="ml-1 text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                    <Textarea
                                        className="min-h-40"
                                        id="proposal-description"
                                        placeholder="Describe your proposal"
                                        autoComplete="new-password"
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
                                    <span className="ml-1 text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                    <Textarea
                                        className="min-h-40"
                                        id="proposal-team"
                                        placeholder="Who you are, what you've done"
                                        autoComplete="new-password"
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
                                    <span className="ml-1 text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                    <Textarea
                                        className="min-h-40"
                                        id="additional-info"
                                        placeholder="Any extra information you want to provide"
                                        autoComplete="new-password"
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
                                    <span className="ml-1 text-red-500">*</span>
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
                                    <span className="ml-1 text-red-500">*</span>
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
                                    <span className="ml-1 text-red-500">*</span>
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

                            const addMetric = (e: React.KeyboardEvent<HTMLInputElement>) => {
                                e.preventDefault();
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
                                        <span className="ml-1 text-red-500">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <div className="space-y-2">
                                            <Input
                                                id="adoption-metrics"
                                                placeholder="Type a metric and press Enter"
                                                autoComplete="new-password"
                                                spellCheck="false"
                                                value={metricInput}
                                                onChange={(e) => setMetricInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        addMetric(e);
                                                    }
                                                }}
                                            />
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
                                <FormLabel className="dark:text-white" htmlFor="amount-requested">
                                    Amount Requested
                                    <span className="ml-1 text-red-500">*</span>
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
                        <Button type="submit">Save as Draft</Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}