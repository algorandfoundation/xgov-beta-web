
export enum ProposalStatus {
    ProposalStatusEmpty = 0,
    ProposalStatusDraft = 10,
    ProposalStatusFinal = 20,
    ProposalStatusVoting = 25,
    ProposalStatusApproved = 30,
    ProposalStatusRejected = 40,
    ProposalStatusFunded = 50,
    ProposalStatusBlocked = 60,
    ProposalStatusDelete = 70,
}

export type Status = 'Empty' | 'Draft' | 'Final' | 'Voting' | 'Approved' | 'Rejected' | 'Funded' | 'Blocked' | 'Delete';

export const ProposalStatusMap = {
	[ProposalStatus.ProposalStatusEmpty]: 'Empty',
	[ProposalStatus.ProposalStatusDraft]: 'Draft',
	[ProposalStatus.ProposalStatusFinal]: 'Final',
	[ProposalStatus.ProposalStatusVoting]: 'Voting',
	[ProposalStatus.ProposalStatusApproved]: 'Approved',
	[ProposalStatus.ProposalStatusRejected]: 'Rejected',
	[ProposalStatus.ProposalStatusFunded]: 'Funded',
	[ProposalStatus.ProposalStatusBlocked]: 'Blocked',
	[ProposalStatus.ProposalStatusDelete]: 'Delete',
}

export enum ProposalCategory {
    ProposalCategoryNull = 0,
    ProposalCategorySmall = 10,
    ProposalCategoryMedium = 20,
    ProposalCategoryLarge = 33,
}

export type Category = 'Null' | 'Small' | 'Medium' | 'Large';

export const ProposalCategoryMap = {
	[ProposalCategory.ProposalCategoryNull]: 'Null',
	[ProposalCategory.ProposalCategorySmall]: 'Small',
	[ProposalCategory.ProposalCategoryMedium]: 'Medium',
	[ProposalCategory.ProposalCategoryLarge]: 'Large',
}

export enum ProposalFundingType {
    Null = 0,
    Proactive = 10,
    Retroactive = 20,
}

export type FundingType = 'Null' | 'Proactive' | 'Retroactive';

export const ProposalFundingTypeMap = {
	[ProposalFundingType.Null]: 'Null',
	[ProposalFundingType.Proactive]: 'Proactive',
	[ProposalFundingType.Retroactive]: 'Retroactive',
}

export enum ProposalFundingCategory {
    FundingCategoryNull = 0,
    FundingCategoryDeFi = 10,
    FundingCategoryEducation = 20,
    FundingCategoryLibraries = 30,
    FundingCategoryNFT = 40,
    FundingCategoryTooling = 50,
    FundingCategorySaas = 60,
    FundingCategoryOther = 70,
}

export type FundingCategory = 'Null' | 'DeFi' | 'Education' | 'Libraries' | 'NFT' | 'Tooling' | 'Saas' | 'Other';

export const FundingCategoryMap = {
    [ProposalFundingCategory.FundingCategoryNull]: 'Null',
    [ProposalFundingCategory.FundingCategoryDeFi]: 'DeFi',
    [ProposalFundingCategory.FundingCategoryEducation]: 'Education',
    [ProposalFundingCategory.FundingCategoryLibraries]: 'Libraries',
    [ProposalFundingCategory.FundingCategoryNFT]: 'NFT',
    [ProposalFundingCategory.FundingCategoryTooling]: 'Tooling',
    [ProposalFundingCategory.FundingCategorySaas]: 'Saas',
    [ProposalFundingCategory.FundingCategoryOther]: 'Other',
}

export interface ProposalJSON {
    description: string;
    team: string;
    additionalInfo?: string;
    openSource: boolean;
    category: ProposalFundingCategory;
    deliverables?: {
        amount: bigint;
        description: string;
    }[];
    adoptionMetrics?: string[];
    pastProposalLinks: bigint[];
    forumLink: string;
}

export const statusToPhase = {
	[ProposalStatus.ProposalStatusEmpty]: 'null',
	[ProposalStatus.ProposalStatusDraft]: 'draft',
	[ProposalStatus.ProposalStatusFinal]: 'submission',
	[ProposalStatus.ProposalStatusVoting]: 'voting',
	[ProposalStatus.ProposalStatusApproved]: 'closure',
	[ProposalStatus.ProposalStatusRejected]: 'closure',
	[ProposalStatus.ProposalStatusFunded]: 'closure',
	[ProposalStatus.ProposalStatusBlocked]: 'closure',
	[ProposalStatus.ProposalStatusDelete]: 'closure',
};

export const phaseToText = {
    submission: 'Submission',
    discussion: 'Discussion',
    voting: 'Voting',
    closure: 'Closure'
};

export type ProposalCardDetails = ProposalMainCardDetails | ProposalSummaryCardDetails | ProposalInfoCardDetails;

export function isProposalMainCardDetails(details: ProposalCardDetails): details is ProposalMainCardDetails {
	return !isProposalSummaryCardDetails(details);
}

export function isProposalSummaryCardDetails(details: ProposalCardDetails): details is ProposalSummaryCardDetails {
	return (details as ProposalMainCardDetails).forumLink === undefined;
}

export function isProposalInfoCardDetails(details: ProposalCardDetails): details is ProposalInfoCardDetails {
    return (details as ProposalMainCardDetails).id === undefined;
}

export interface ProposalSummaryCardDetails {
    id: bigint;
    title: string;
    cid: string;
    requestedAmount: bigint;
    proposer: string;
    fundingType: ProposalFundingType;
    status: ProposalStatus;
	category: ProposalFundingCategory;
}

export type ProposalMainCardDetails = Omit<ProposalSummaryCardDetails, 'category'> & ProposalJSON;

export type ProposalInfoCardDetails = Pick<
    ProposalMainCardDetails, 
    'forumLink' | 'fundingType' | 'category' | 'openSource' | 'requestedAmount'
>