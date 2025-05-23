import { z } from "zod";

export const proposalFormSchema = z.object({
  title: z.string().refine((val) => val !== "", { message: "Required field" }),
  description: z
    .string()
    .refine((val) => val !== "", { message: "Required field" }),
  requestedAmount: z
    .number()
    .refine((val) => val !== 0, { message: "Required field" })
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Must be a positive number",
    }),
  team: z.string().refine((val) => val !== "", { message: "Required field" }),
  additionalInfo: z
    .string()
    .refine((val) => val !== "", { message: "Required field" }),
  openSource: z.boolean(),
  focus: z.string(),
  fundingType: z.string(),
  // deliverables: z.string(),
  adoptionMetrics: z
    .array(z.string())
    .refine((val) => val.length > 0, { message: "Required field" }),
  forumLink: z
    .string()
    .refine((val) => val !== "", { message: "Required field" })
    .refine((val) => val.includes("https://forum.algorand.co/t/"), {
      message:
        "Must be a valid forum link beginning with 'https://forum.algorand.co/t/'",
    }),
});
