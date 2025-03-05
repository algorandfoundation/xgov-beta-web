import { Page } from "@/components/Page";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Link } from "react-router-dom";
import { CheckIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProposalFocus } from "@/types/proposals";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { InfoPopover } from "@/components/InfoPopover/InfoPopover";
import { AlgorandIcon } from "@/components/icons/AlgorandIcon";

const title = 'xGov';

export function NewProposalPage() {
    const [agreed, setAgreed] = useState(false)

    return (
        <Page title={title}>
            <div className="py-24 min-h-[calc(100svh-10.625rem)] max-w-xl mx-auto">
                <h1 className="my-2 text-pretty text-2xl font-semibold tracking-tight text-algo-black dark:text-white">
                    New Proposal
                </h1>
                {!agreed ? (
                    <TermsAndConditions setAgreed={setAgreed} />
                ) : (
                    <NewProposalForm />
                )}
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
    title: z.string().default(''),
    description: z.string().default(''),
    amountRequested: z.number().default(0),
    team: z.string().default(''),
    openSource: z.string().default(''),
    category: z.string().default(''),
    fundingType: z.string().default(''),
    deliverables: z.string().default(''),
    adoptionMetrics: z.string().default(''),
    forumLink: z.string().default(''),
})

function NewProposalForm() {

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    })

    function onSubmit(data: z.infer<typeof formSchema>) {
        // toast({
        //   title: "You submitted the following values:",
        //   description: (
        //     <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
        //       <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        //     </pre>
        //   ),
        // })</>
    }

    return (
        <div className="p-4 rounded-lg bg-algo-blue-20 dark:bg-algo-teal-20">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    Title
                                    <span className="text-red-700">*</span>
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
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="forumLink"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    Forum Link
                                    <span className="text-red-700">*</span>
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
                                <FormDescription>
                                    Paste the link to the algorand forum discussion where xGovs can partake in discussion for this proposal.
                                </FormDescription>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    Description
                                    <span className="text-red-700">*</span>
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
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="amountRequested"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel htmlFor="amount-requested">
                                    Amount Requested
                                    <span className="text-red-700">*</span>
                                </FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <AlgorandIcon className="size-3" />
                                        </div>
                                        <Input
                                            id="amount-requested"
                                            className="pl-7"
                                            placeholder="0.000000"
                                            {...field}
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="team"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    About the team
                                    <span className="text-red-700">*</span>
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
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="openSource"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    License
                                    <span className="text-red-700">*</span>
                                </FormLabel>

                                <Select onValueChange={field.onChange} defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger aria-label="Select a license">
                                            <SelectValue placeholder="Select a license" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value='none'>None</SelectItem>
                                        <SelectItem value='open source'>Open Source</SelectItem>
                                        <SelectItem value='closed source'>Closed Source</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    Category
                                    <span className="text-red-700">*</span>
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
                                    Select the category of the work your proposal most relates to.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="fundingType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    Funding Type
                                    <span className="text-red-700">*</span>
                                </FormLabel>

                                <Select onValueChange={field.onChange} defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger aria-label="Select funding type">
                                            <SelectValue placeholder="Select funding type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value='none'>None</SelectItem>
                                        <SelectItem value='proactive'>Proactive</SelectItem>
                                        <SelectItem value='retroactive'>Retroactive</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
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