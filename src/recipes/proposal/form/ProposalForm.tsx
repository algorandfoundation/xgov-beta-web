import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form.tsx";
import { InfoPopover } from "@/components/InfoPopover/InfoPopover.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  ProposalFocus,
  ProposalFundingType,
  type ProposalMainCardDetails,
} from "@/api";
import { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { AlgorandIcon } from "@/components/icons/AlgorandIcon.tsx";
import { cn } from "@/functions";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  proposalFormSchema,
  validatorSchemas,
} from "@/recipes/proposal/form/ProposalForm.schema.ts";
import { zodResolver } from "@hookform/resolvers/zod";
import { WarningNotice } from "@/components/WarningNotice/WarningNotice";
import { ConfirmationModal } from "@/components/ConfirmationModal/ConfirmationModal";

export function ProposalForm({
  type,
  proposal,
  bps = 0n,
  minRequestedAmount = 1n, // Default to 0 Algo
  maxRequestedAmount = 1_000_000n, // Default to 1M Algo
  onSubmit,
  loading,
  error,
}: {
  type: "edit" | "create";
  proposal?: ProposalMainCardDetails;
  bps?: bigint;
  minRequestedAmount?: bigint;
  maxRequestedAmount?: bigint;
  onSubmit: (data: z.infer<typeof proposalFormSchema>) => void;
  loading: boolean;
  error?: string;
}) {
  const [submitModalOpen, setSubmitModalOpen] = useState(false);

  const formSchema = proposalFormSchema.setKey(
    "requestedAmount",
    validatorSchemas.requestedAmount({
      min: Number(minRequestedAmount) / 1e6,
      max: Number(maxRequestedAmount) / 1e6,
    }),
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: proposal?.title || "",
      description: proposal?.description || "",
      requestedAmount: Number(proposal?.requestedAmount) / 1e6 || Number(minRequestedAmount) / 1e6 || 0,
      team: proposal?.team || "",
      additionalInfo: proposal?.additionalInfo || "",
      openSource: true,
      focus:
        proposal?.focus !== undefined && proposal?.focus !== null
          ? String(proposal.focus)
          : String(ProposalFocus.FocusNull),
      fundingType:
        typeof proposal?.fundingType !== "undefined"
          ? String(proposal?.fundingType)
          : String(ProposalFundingType.Retroactive),
      adoptionMetrics: proposal?.adoptionMetrics || [],
      forumLink: proposal?.forumLink || "https://forum.algorand.co/t/",
    },
    mode: "onChange",
  });

  const { errors } = form.formState;

  const $requestedAmount = form.watch("requestedAmount");
  const costs = Math.trunc(
    Number((BigInt($requestedAmount * 1_000_000) * bps) / BigInt(10_000)),
  );

  return (
    <div className="p-4 rounded-lg border border-algo-blue dark:border-algo-teal">
      <Form {...form}>
        <form className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="dark:text-white">
                  Title
                  <span className="ml-0.5 text-algo-red">*</span>
                  <InfoPopover
                    className="mx-1.5 relative top-0.5 sm:mx-1 sm:top-0"
                    label="Title"
                  >
                    A short title of your proposal encompassing the main idea.
                  </InfoPopover>
                </FormLabel>
                <FormControl>
                  <Input
                    id="proposal-title"
                    placeholder="Enter the title of your proposal"
                    spellCheck="false"
                    disabled={type === "edit"}
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
                  <span className="ml-0.5 text-algo-red">*</span>
                  <InfoPopover
                    className="mx-1.5 relative top-0.5 sm:mx-1 sm:top-0"
                    label="Forum Link"
                  >
                    A link to the Algorand forum where the proposal can be
                    discussed.
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
                  Paste the link to the Algorand forum discussion where xGovs
                  can partake in discussion for this proposal.
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
                  <span className="ml-0.5 text-algo-red">*</span>
                  <InfoPopover
                    className="mx-1.5 relative top-0.5 sm:mx-1 sm:top-0"
                    label="Description"
                  >
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
                  <span className="ml-0.5 text-algo-red">*</span>
                  <InfoPopover
                    className="mx-1.5 relative top-0.5 sm:mx-1 sm:top-0"
                    label="About the team"
                  >
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
                  <span className="ml-0.5 text-algo-red">*</span>
                  <InfoPopover
                    className="mx-1.5 relative top-0.5 sm:mx-1 sm:top-0"
                    label="Additional Info"
                  >
                    Additional details about the proposal users may find helpful
                    in deciding to vote.
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
                  <span className="ml-0.5 text-algo-red">*</span>
                  <InfoPopover
                    className="mx-1.5 relative top-0.5 sm:mx-1 sm:top-0"
                    label="Open Source"
                  >
                    For the time being all Proposals are required to be open
                    source.
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
                  <span className="ml-0.5 text-algo-red">*</span>
                  <InfoPopover
                    className="mx-1.5 relative top-0.5 sm:mx-1 sm:top-0"
                    label="Focus"
                  >
                    The category most relevant to your proposal.
                  </InfoPopover>
                </FormLabel>

                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={type === "edit"}
                >
                  <FormControl>
                    <SelectTrigger aria-label="Select proposal category">
                      <SelectValue placeholder="Select proposal category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={String(ProposalFocus.FocusNull)}>
                      None
                    </SelectItem>
                    <SelectItem value={String(ProposalFocus.FocusDeFi)}>
                      DeFi
                    </SelectItem>
                    <SelectItem value={String(ProposalFocus.FocusEducation)}>
                      Education
                    </SelectItem>
                    <SelectItem value={String(ProposalFocus.FocusLibraries)}>
                      Libraries
                    </SelectItem>
                    <SelectItem value={String(ProposalFocus.FocusNFT)}>
                      NFT
                    </SelectItem>
                    <SelectItem value={String(ProposalFocus.FocusTooling)}>
                      Tooling
                    </SelectItem>
                    <SelectItem value={String(ProposalFocus.FocusSaas)}>
                      Saas
                    </SelectItem>
                    <SelectItem value={String(ProposalFocus.FocusOther)}>
                      Other
                    </SelectItem>
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
                  <span className="ml-0.5 text-algo-red">*</span>
                  <InfoPopover
                    className="mx-1.5 relative top-0.5 sm:mx-1 sm:top-0"
                    label="Funding Type"
                  >
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
                    <SelectItem value={String(ProposalFundingType.Null)}>
                      None
                    </SelectItem>
                    <SelectItem value={String(ProposalFundingType.Proactive)}>
                      Proactive
                    </SelectItem>
                    <SelectItem value={String(ProposalFundingType.Retroactive)}>
                      Retroactive
                    </SelectItem>
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
              const [metricInput, setMetricInput] = useState("");

              const addMetricFromEvent = (
                e: React.KeyboardEvent<HTMLInputElement>,
              ) => {
                e.preventDefault();
                addMetric();
              };

              const addMetric = () => {
                if (metricInput.trim() !== "") {
                  const newMetrics = [...field.value, metricInput.trim()];
                  field.onChange(newMetrics);
                  setMetricInput("");
                }
              };

              const removeMetric = (index: number) => {
                const newMetrics = field.value.filter((_, i) => i !== index);
                field.onChange(newMetrics);
              };

              return (
                <FormItem className="w-full grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div>
                    <FormLabel className="dark:text-white">
                      Adoption Metrics
                      <span className="ml-0.5 text-algo-red">*</span>
                      <InfoPopover
                        className="mx-1.5 relative top-0.5 sm:mx-1 sm:top-0"
                        label="Adoption Metrics"
                      >
                        Quick metrics about the adoption of your work that can
                        be used to measure success & ecosystem relevancy for the
                        funds being requested.
                      </InfoPopover>
                    </FormLabel>
                    <FormControl>
                      <div className="space-y-2 mt-2">
                        <div className="relative">
                          <Input
                            id="adoption-metrics"
                            placeholder="Type a metric and press Enter"
                            spellCheck="false"
                            value={metricInput}
                            onChange={(e) => setMetricInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                addMetricFromEvent(e);
                              }
                            }}
                          />
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
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage>{errors.adoptionMetrics?.message}</FormMessage>
                  </div>

                  <div className="pt-0 md:pt-6 space-y-2">
                    {!field.value?.length
                      ? null
                      : field.value.map((metric, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 dark:text-algo-black-20 rounded border dark:border-gray-700"
                          >
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
                  <span className="ml-0.5 text-algo-red">*</span>
                  <InfoPopover
                    className="mx-1.5 relative top-0.5 sm:mx-1 sm:top-0"
                    label="Requested Amount"
                  >
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
                      className={cn(
                        "pl-7",
                        !!errors.requestedAmount?.message
                          ? "border-algo-red"
                          : "",
                      )}
                      placeholder="0"
                      type="number"
                      onFocus={(e) => e.target.select()}
                      onChange={(e) =>
                        field.onChange(e.target.valueAsNumber || 0)
                      }
                      value={field.value}
                      onBlur={field.onBlur}
                      name={field.name}
                      disabled={type === "edit"}
                    />
                  </div>
                </FormControl>
                <FormMessage>{errors.requestedAmount?.message}</FormMessage>
              </FormItem>
            )}
          />

          <div className="flex items-center justify-end">
            <Button
              type="button"
              onClick={() => setSubmitModalOpen(true)}
              disabled={!form.formState.isValid || loading}
            >
              {loading ? (
                <div className="animate-spin h-4 w-4 border-2 border-white dark:border-algo-black border-t-transparent dark:border-t-transparent rounded-full"></div>
              ) : type === "edit" ? (
                "Update"
              ) : (
                "Submit"
              )}
            </Button>
          </div>

          <ConfirmationModal
            isOpen={submitModalOpen}
            onClose={() => setSubmitModalOpen(false)}
            title={type === "edit" ? "Update Proposal?" : "Submit Proposal?"}
            description={
              type === "edit"
                ? "Are you sure you want to update this proposal?"
                : "Once submitted you will only be able to edit the forum link, description, team info, additional info & adoption metrics without needing to create a new proposal."
            }
            warning={
              type !== "edit" ? (
                <WarningNotice
                  title="Proposal Hold"
                  description={
                    <>
                      You will need to escrow
                      <span className="inline-flex items-center gap-1 mx-1 font-semibold">
                        {Number(bps / 100n)}%
                      </span>
                      of the requested amount
                      <span className="inline-flex items-center gap-1 mx-1 font-semibold">
                        <AlgorandIcon className="size-2.5" />
                        {costs / 1_000_000}
                      </span>
                      If your proposal is vetoed, this amount will be slashed.
                    </>
                  }
                />
              ) : undefined
            }
            submitText={type === "edit" ? "Update Proposal" : "Submit Proposal"}
            onSubmit={form.handleSubmit(onSubmit)}
            errorMessage={error}
          />
        </form>
      </Form>
    </div>
  );
}
