import type { ProposalTypedGlobalState } from "@algorandfoundation/xgov";
import type { User } from "@/api/discourse/user.ts";

export enum ProposalStatus {
  ProposalStatusEmpty = 0,
  ProposalStatusDraft = 10,
  ProposalStatusFinal = 20,
  ProposalStatusVoting = 25,
  ProposalStatusApproved = 30,
  ProposalStatusRejected = 40,
  ProposalStatusReviewed = 45,
  ProposalStatusFunded = 50,
  ProposalStatusBlocked = 60,
  ProposalStatusDelete = 70,
}

export type Status =
  | "Empty"
  | "Draft"
  | "Final"
  | "Voting"
  | "Approved"
  | "Rejected"
  | "Funded"
  | "Blocked"
  | "Delete";

export const ProposalStatusMap = {
  [ProposalStatus.ProposalStatusEmpty]: "Empty",
  [ProposalStatus.ProposalStatusDraft]: "Discussion",
  [ProposalStatus.ProposalStatusFinal]: "Discussion",
  [ProposalStatus.ProposalStatusVoting]: "Voting",
  [ProposalStatus.ProposalStatusApproved]: "Approved",
  [ProposalStatus.ProposalStatusRejected]: "Rejected",
  [ProposalStatus.ProposalStatusReviewed]: "Reviewed",
  [ProposalStatus.ProposalStatusFunded]: "Funded",
  [ProposalStatus.ProposalStatusBlocked]: "Blocked",
  [ProposalStatus.ProposalStatusDelete]: "Delete",
};

export const ProposalStatusReverseMap: { [key: string]: ProposalStatus[] } = {
  Empty: [ProposalStatus.ProposalStatusEmpty],
  Discussion: [ProposalStatus.ProposalStatusDraft, ProposalStatus.ProposalStatusFinal],
  Voting: [ProposalStatus.ProposalStatusVoting],
  Approved: [ProposalStatus.ProposalStatusApproved],
  Rejected: [ProposalStatus.ProposalStatusRejected],
  Funded: [ProposalStatus.ProposalStatusFunded],
  Blocked: [ProposalStatus.ProposalStatusBlocked],
  Delete: [ProposalStatus.ProposalStatusDelete],
};

export const ProposalStatusFilterKeys = ["Discussion", "Voting", "Approved", "Rejected", "Funded", "Blocked"];

export enum ProposalCategory {
  ProposalCategoryNull = 0,
  ProposalCategorySmall = 10,
  ProposalCategoryMedium = 20,
  ProposalCategoryLarge = 33,
}

export type Category = "Null" | "Small" | "Medium" | "Large";

export const ProposalCategoryMap = {
  [ProposalCategory.ProposalCategoryNull]: "Null",
  [ProposalCategory.ProposalCategorySmall]: "Small",
  [ProposalCategory.ProposalCategoryMedium]: "Medium",
  [ProposalCategory.ProposalCategoryLarge]: "Large",
};

export const ProposalCategoryReverseMap = {
  Null: ProposalCategory.ProposalCategoryNull,
  Small: ProposalCategory.ProposalCategorySmall,
  Medium: ProposalCategory.ProposalCategoryMedium,
  Large: ProposalCategory.ProposalCategoryLarge,
};

export enum ProposalFundingType {
  Null = 0,
  Proactive = 10,
  Retroactive = 20,
}

export type FundingType = "Null" | "Proactive" | "Retroactive";

export const ProposalFundingTypeMap = {
  [ProposalFundingType.Null]: "Null",
  [ProposalFundingType.Proactive]: "Proactive",
  [ProposalFundingType.Retroactive]: "Retroactive",
};

export const ProposalFundingTypeReverseMap: {
  [key: string]: ProposalFundingType;
} = {
  Null: ProposalFundingType.Null,
  Proactive: ProposalFundingType.Proactive,
  Retroactive: ProposalFundingType.Retroactive,
};

export enum ProposalFocus {
  FocusNull = 0,
  FocusDeFi = 10,
  FocusEducation = 20,
  FocusLibraries = 30,
  FocusNFT = 40,
  FocusTooling = 50,
  FocusSaas = 60,
  FocusOther = 70,
}

export type Focus =
  | "Null"
  | "DeFi"
  | "Education"
  | "Libraries"
  | "NFT"
  | "Tooling"
  | "Saas"
  | "Other";

export const FocusMap = {
  [ProposalFocus.FocusNull]: "Null",
  [ProposalFocus.FocusDeFi]: "DeFi",
  [ProposalFocus.FocusEducation]: "Education",
  [ProposalFocus.FocusLibraries]: "Libraries",
  [ProposalFocus.FocusNFT]: "NFT",
  [ProposalFocus.FocusTooling]: "Tooling",
  [ProposalFocus.FocusSaas]: "Saas",
  [ProposalFocus.FocusOther]: "Other",
};

export const FocusReverseMap: { [key: string]: ProposalFocus } = {
  Null: ProposalFocus.FocusNull,
  DeFi: ProposalFocus.FocusDeFi,
  Education: ProposalFocus.FocusEducation,
  Libraries: ProposalFocus.FocusLibraries,
  NFT: ProposalFocus.FocusNFT,
  Tooling: ProposalFocus.FocusTooling,
  Saas: ProposalFocus.FocusSaas,
  Other: ProposalFocus.FocusOther,
};

export interface ProposalJSON {
  description: string;
  team: string;
  additionalInfo?: string;
  openSource: boolean;
  // applicable for proactive proposals
  deliverables?: {
    amount: bigint;
    description: string;
  }[];
  // applicable for retroactive proposals
  adoptionMetrics?: string[];
  pastProposalLinks?: bigint[];
  forumLink: string;
}

export const statusToPhase = {
  [ProposalStatus.ProposalStatusEmpty]: "null",
  [ProposalStatus.ProposalStatusDraft]: "draft",
  [ProposalStatus.ProposalStatusFinal]: "discussion",
  [ProposalStatus.ProposalStatusVoting]: "voting",
  [ProposalStatus.ProposalStatusApproved]: "closure",
  [ProposalStatus.ProposalStatusRejected]: "closure",
  [ProposalStatus.ProposalStatusReviewed]: "closure",
  [ProposalStatus.ProposalStatusFunded]: "closure",
  [ProposalStatus.ProposalStatusBlocked]: "closure",
  [ProposalStatus.ProposalStatusDelete]: "closure",
};

export const phaseToText = {
  submission: "Submission",
  discussion: "Discussion",
  voting: "Voting",
  closure: "Closure",
};

export type ProposalCardDetails =
  | ProposalMainCardDetails
  | ProposalSummaryCardDetails
  | ProposalInfoCardDetails;

export function isProposalMainCardDetails(
  details: ProposalCardDetails,
): details is ProposalMainCardDetails {
  return !isProposalSummaryCardDetails(details);
}

export function isProposalSummaryCardDetails(
  details: ProposalCardDetails,
): details is ProposalSummaryCardDetails {
  return (details as ProposalMainCardDetails).forumLink === undefined;
}

export function isProposalInfoCardDetails(
  details: ProposalCardDetails,
): details is ProposalInfoCardDetails {
  return (details as ProposalMainCardDetails).id === undefined;
}

export type ProposalSummaryCardDetails = Omit<ProposalTypedGlobalState, 'fundingType' | 'status' | 'focus' | 'fundingCategory'> & {
    id: bigint;
    fundingType: ProposalFundingType;
    status: ProposalStatus;
    focus: ProposalFocus;
    fundingCategory: ProposalCategory;
    forumLink: string;
    formUsers: User[];
}

export type ProposalMainCardDetails = ProposalSummaryCardDetails & ProposalJSON;

export type ProposalInfoCardDetails = Pick<
  ProposalMainCardDetails,
  | "focus"
  | "forumLink"
  | "fundingType"
  | "openSource"
  | "requestedAmount"
  | "status"
>;

export interface ProposalBrief {
  id: bigint;
  status: ProposalStatus;
  title: string;
}
