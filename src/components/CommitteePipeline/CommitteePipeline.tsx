import { ArrowUpRightIcon } from "lucide-react";
import { cn } from "@/functions";
import {
  ARC86_URL,
  COMMITTEE_SPEC_URL,
  GENERATOR_SOURCE_URL,
  REGISTRY_SPEC_URL,
  type CommitteePipelineStep,
} from "@/api/committee-artifacts";

const INTRO =
  "Nobody picks the committee. It is derived from what the chain already recorded: who proposed blocks during the 3M-block period, filtered to the addresses subscribed as xGovs before the period closed. Each step below publishes its input and output, so the whole run is reproducible.";

export interface CommitteePipelineProps {
  steps: CommitteePipelineStep[];
  className?: string;
}

function StepMarker({ n }: { n: number }) {
  return (
    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-algo-blue-10 text-xs font-bold text-algo-blue dark:bg-algo-blue/20 dark:text-algo-teal">
      {n}
    </span>
  );
}

function StepCount({ count }: { count: string | null }) {
  if (!count) return null;
  return (
    <span className="shrink-0 font-mono text-[11px] tabular-nums text-algo-black-50 dark:text-gray-500">
      {count}
    </span>
  );
}

// The published file this step produced. A plain label when the network has no
// artifact site, so the step still names its output.
function StepArtifact({ step }: { step: CommitteePipelineStep }) {
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 text-xs font-semibold",
        step.href
          ? "text-algo-blue dark:text-algo-teal"
          : "text-algo-black-50 dark:text-gray-500",
      )}
    >
      <span className="truncate font-mono">{step.artifact}</span>
      {step.href && (
        <ArrowUpRightIcon className="size-3.5 shrink-0" strokeWidth={2} />
      )}
    </span>
  );
}

function SpecLink({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-algo-blue hover:underline dark:text-algo-teal"
    >
      {children} ↗
    </a>
  );
}

/**
 * "How this committee was generated" — the five-step derivation, each step
 * linking the artifact it published. The pipeline is the hero of the page on
 * desktop (a five-across row) and becomes a vertical chain on mobile.
 */
export function CommitteePipeline({
  steps,
  className,
}: CommitteePipelineProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-black/[0.08] bg-white p-5 md:p-8 dark:border-white/10 dark:bg-algo-black-90",
        className,
      )}
    >
      <div className="mb-1 flex items-baseline justify-between gap-6">
        <h2 className="text-xl font-bold text-algo-black md:text-[22px] dark:text-white">
          How this committee was generated
        </h2>
        <span className="hidden shrink-0 text-sm md:block">
          <SpecLink href={GENERATOR_SOURCE_URL}>Generator source</SpecLink>
        </span>
      </div>
      <p className="mb-5 max-w-[760px] text-sm leading-relaxed text-algo-black-70 md:mb-6 md:text-[15px] dark:text-gray-400">
        {INTRO}
      </p>

      {/* Desktop — five cards across, the chain read left to right */}
      <ol className="hidden gap-3.5 lg:grid lg:grid-cols-5">
        {steps.map((step) => {
          const Tag = step.href ? "a" : "div";
          return (
            <li key={step.n} className="flex">
              <Tag
                {...(step.href
                  ? {
                      href: step.href,
                      target: "_blank",
                      rel: "noopener noreferrer",
                    }
                  : {})}
                className={cn(
                  "flex w-full flex-col gap-2.5 rounded-[14px] border border-black/[0.14] p-4 transition-colors dark:border-white/10",
                  step.href &&
                    "hover:border-algo-blue-40 hover:bg-algo-blue-10/40 dark:hover:border-algo-teal/40 dark:hover:bg-white/5",
                )}
              >
                <div className="flex items-center justify-between gap-2.5">
                  <StepMarker n={step.n} />
                  <StepCount count={step.count} />
                </div>
                <div className="text-[15.5px] font-bold leading-tight text-algo-black dark:text-white">
                  {step.title}
                </div>
                <p className="text-[13px] leading-relaxed text-algo-black-70 dark:text-gray-400">
                  {step.body}
                </p>
                <div className="mt-auto min-w-0 pt-2.5">
                  <StepArtifact step={step} />
                </div>
              </Tag>
            </li>
          );
        })}
      </ol>

      {/* Mobile / tablet — the same five steps as a linked vertical chain */}
      <ol className="lg:hidden">
        {steps.map((step, index) => {
          const Tag = step.href ? "a" : "div";
          return (
            <li key={step.n}>
              <Tag
                {...(step.href
                  ? {
                      href: step.href,
                      target: "_blank",
                      rel: "noopener noreferrer",
                    }
                  : {})}
                className="flex gap-3 border-t border-black/[0.08] py-3.5 dark:border-white/10"
              >
                <span className="flex shrink-0 flex-col items-center gap-1.5">
                  <StepMarker n={step.n} />
                  {index < steps.length - 1 && (
                    <span className="w-px flex-1 bg-black/[0.14] dark:bg-white/10" />
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex items-baseline justify-between gap-2.5">
                    <span className="text-[15px] font-bold text-algo-black dark:text-white">
                      {step.title}
                    </span>
                    <StepCount count={step.count} />
                  </span>
                  <span className="text-[13px] leading-relaxed text-algo-black-70 dark:text-gray-400">
                    {step.body}
                  </span>
                  <span className="mt-0.5 min-w-0">
                    <StepArtifact step={step} />
                  </span>
                </span>
              </Tag>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 flex flex-col gap-2.5 border-t border-black/[0.08] pt-3.5 text-[13.5px] md:mt-5 md:flex-row md:flex-wrap md:items-center md:gap-x-[18px] md:gap-y-2 md:pt-4 dark:border-white/10">
        <span className="text-algo-black-50 dark:text-gray-500">
          Read the rules:
        </span>
        <SpecLink href={COMMITTEE_SPEC_URL}>Committee spec</SpecLink>
        <SpecLink href={ARC86_URL}>ARC-86 committee file</SpecLink>
        <SpecLink href={REGISTRY_SPEC_URL}>Registry spec</SpecLink>
        <span className="md:hidden">
          <SpecLink href={GENERATOR_SOURCE_URL}>Generator source</SpecLink>
        </span>
      </div>
    </section>
  );
}
