import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn, capitalizeFirstLetter } from "@/functions";
import { AlgoShapeIcon11 } from "@/components/icons/AlgoShapeIcon11";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "@/hooks/useSearchParams.ts";
import {
  FocusReverseMap,
  ProposalFundingTypeReverseMap,
  ProposalStatusFilterKeys,
} from "@/api";

export interface ProposalFilterProps {
  className?: string;
  onFilterChange?: (filter: string, value: string) => void;
}

export const filterAmountMap: { [key: string]: number[] } = {
  "0 - 1K": [0, 1_000_000_000],
  "1K - 10K": [1_000_000_000, 10_000_000_000],
  "10K - 100K": [10_000_000_000, 100_000_000_000],
  "100K - 1M": [100_000_000_000, 1_000_000_000_000],
  "1M+": [1_000_000_000_000],
};

export const filters: { [key: string]: string[] } = {
  status: ProposalStatusFilterKeys,
  type: Object.keys(ProposalFundingTypeReverseMap).slice(1), // remove Null value
  amount: Object.keys(filterAmountMap),
  focus: Object.keys(FocusReverseMap).slice(1), // remove Null value
};

export function ProposalFilter({ className }: ProposalFilterProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<number[]>([0, 0, 0, 0]);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const keys = Array.from(searchParams.keys());
    let selected = [0, 0, 0, 0];
    keys.map((key) => {
      const value = searchParams.get(key);
      if (value) {
        const index = filters[key].indexOf(value);
        if (index !== -1) {
          selected[Object.keys(filters).indexOf(key)] = index + 1;
        }
      }
    });
    setSelected(selected);
  }, []);

  const onFilterChange = (filter: string, value: string) => {
    setSearchParams((previous) => {
      if (value === previous.get(filter)) {
        // remove all potential key values incase someone messed with the url
        previous.getAll(filter).map((value) => previous.delete(filter, value));
        return previous;
      }
      previous.set(filter, value);
      return previous;
    });
  };

  return (
    <div className="flex items-center gap-1">
      {searchParams.size > 0 && (
        <Button
          // className="rounded-lg border hover:border-algo-blue dark:hover:border-algo-teal hover:text-algo-blue dark:hover:text-algo-teal"
          size="sm"
          variant="ghost"
          onClick={() => {
            setSearchParams("");
            setSelected([0, 0, 0, 0]);
          }}
        >
          Clear Filters
        </Button>
      )}
      <TooltipProvider delayDuration={200}>
        <Dialog open={dialogOpen}>
          <Tooltip>
            <DialogTrigger asChild>
              <TooltipTrigger asChild>
                <button
                  className={cn(
                    "relative group flex justify-center items-center hover:bg-algo-blue dark:hover:bg-algo-teal size-10 rounded-full transition",
                    className,
                  )}
                  onClick={() => setDialogOpen(true)}
                >
                  <AlgoShapeIcon11 className="absolute opacity-0 translate-y-2 translate-x-2 fill-algo-blue-40 dark:fill-algo-teal-40 group-hover:opacity-100 group-hover:translate-y-1 group-hover:translate-x-1 rotate-180 size-6 transition duration-500" />
                  <AlgoShapeIcon11 className="absolute translate-y-1 translate-x-1 fill-algo-blue-40 dark:fill-algo-teal-40 group-hover:fill-white dark:group-hover:fill-algo-black group-hover:translate-y-0 group-hover:translate-x-0 rotate-180 size-6 transition duration-500" />
                  <AlgoShapeIcon11 className="fill-algo-blue dark:fill-algo-teal group-hover:fill-white dark:group-hover:fill-algo-black group-hover:opacity-0 group-hover:-translate-y-1 group-hover:-translate-x-1 rotate-180 size-6 transition duration-500" />
                </button>
              </TooltipTrigger>
            </DialogTrigger>
            <TooltipContent>
              <p>Filter</p>
            </TooltipContent>
          </Tooltip>
          <DialogContent
            className="w-full h-full sm:h-auto sm:max-w-[425px] sm:rounded-lg"
            onCloseClick={() => setDialogOpen(false)}
          >
            <DialogHeader className="mt-12 flex flex-col items-start gap-2">
              <DialogTitle className="dark:text-white">
                Filter Proposals
              </DialogTitle>
              <DialogDescription>
                Filter proposals by status, type, requested amount, and
                category.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 dark:text-algo-black-20">
              {Object.keys(filters).map((key, keyIndex) => (
                <div key={key}>
                  <span>{capitalizeFirstLetter(key)}</span>
                  <div className="flex flex-wrap gap-2 mt-2" key={key}>
                    {filters[key].map((value, valueIndex) => (
                      <Button
                        key={value}
                        className={cn(
                          "rounded-lg border hover:border-algo-blue dark:hover:border-algo-teal hover:text-algo-blue dark:hover:text-algo-teal",
                          selected[keyIndex] === valueIndex + 1
                            ? "bg-algo-blue dark:bg-algo-teal text-white dark:text-black"
                            : "bg-algo-blue/10 text-algo-blue border-algo-blue/10 dark:bg-algo-teal/10 dark:text-algo-teal dark:border-algo-teal/10",
                        )}
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelected((prev) => {
                            const newSelected = [...prev];
                            const isAlreadySelected =
                              newSelected[keyIndex] === valueIndex + 1;
                            newSelected[keyIndex] = isAlreadySelected
                              ? 0
                              : valueIndex + 1;
                            return newSelected;
                          });
                          // update search params
                          onFilterChange(key, value);
                        }}
                      >
                        {value}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter className="sm:hidden mt-8">
              <Button
                variant="default"
                className="w-full bg-algo-blue dark:bg-algo-teal text-white dark:text-black"
                onClick={() => setDialogOpen(false)}
              >
                Apply Filters
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TooltipProvider>
    </div>
  );
}
