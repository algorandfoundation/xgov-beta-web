import { z } from "zod";

export const validatorSchemas = {
  title: () => { return z.string().refine((val) => val !== "", { message: "Required field" }) },
  description: () => {
    return z
      .string()
      .refine((val) => val !== "", { message: "Required field" })
  },
  requestedAmount: (constraints: { min: number; max: number }) => {
    return z
      .number()
      .refine((val) => val !== 0, { message: "Required field" })
      .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "Must be a positive number",
      })
      .refine((val) => val >= constraints.min, {
        message: `Must be at least ${constraints.min}`,
      })
      .refine((val) => val <= constraints.max, {
        message: `Must be at most ${constraints.max}`,
      });
  },
  team: () => { return z.string().refine((val) => val !== "", { message: "Required field" }) },
  additionalInfo: () => {
    return z
      .string()
      .refine((val) => val !== "", { message: "Required field" })
  },
  openSource: () => { return z.boolean() },
  focus: () => { return z.string() },
  fundingType: () => { return z.string() },
  // deliverables: z.string(),
  adoptionMetrics: () => {
    return z
      .array(z.string())
      .refine((val) => val.length > 0, { message: "Required field" })
  },
  forumLink: () => {
    return z
      .string()
      .refine((val) => val !== "", { message: "Required field" })
      .refine((val) => val.includes("https://forum.algorand.co/t/"), {
        message:
          "Must be a valid forum link beginning with 'https://forum.algorand.co/t/'",
      })
  }
}


export const proposalFormSchema = z
  .object({
    title: validatorSchemas.title(),
    description: validatorSchemas.description(),
    requestedAmount: validatorSchemas.requestedAmount({ min: 1_000_000, max: 100_000_000_000 }),
    team: validatorSchemas.team(),
    additionalInfo: validatorSchemas.additionalInfo(),
    openSource: validatorSchemas.openSource(),
    focus: validatorSchemas.focus(),
    fundingType: validatorSchemas.fundingType(),
    adoptionMetrics: validatorSchemas.adoptionMetrics(),
    forumLink: validatorSchemas.forumLink(),
  })