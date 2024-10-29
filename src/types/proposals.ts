
export type ProposalPhase = 'submission' | 'discussion' | 'vote' | 'closure';
export type FundingType = 'retroactive' | 'proactive';

export const phaseToText = {
    submission: 'Submission',
    discussion: 'Discussion',
    vote: 'Voting',
    closure: 'Closure'
};

export type ProposalCardDetails = MyProposalSummaryCardDetails | ProposalMainCardDetails | ProposalSummaryCardDetails | ProposalInfoCardDetails;

export type ProposalSummaryDetails = MyProposalSummaryCardDetails | ProposalSummaryCardDetails;

export function isMyProposalSummaryCardDetails(details: ProposalCardDetails): details is MyProposalSummaryCardDetails {
	return (details as ProposalSummaryCardDetails).proposer === undefined;
}

export function isProposalMainCardDetails(details: ProposalCardDetails): details is ProposalMainCardDetails {
	return !isMyProposalSummaryCardDetails && !isProposalSummaryCardDetails(details) && !isProposalInfoCardDetails(details);
}

export function isProposalSummaryCardDetails(details: ProposalCardDetails): details is ProposalSummaryCardDetails {
	return !isMyProposalSummaryCardDetails(details)
		&& (details as ProposalInfoCardDetails).discussionLink === undefined
		&& (details as ProposalMainCardDetails).properties === undefined;
}

export function isProposalInfoCardDetails(details: ProposalCardDetails): details is ProposalInfoCardDetails {
	return (details as ProposalInfoCardDetails).discussionLink !== undefined;
}

export type MyProposalSummaryCardDetails = Pick<ProposalJson, 'title'> & {
	id: number;
	phase: ProposalPhase;
	category: string;
	fundingType: FundingType;
	requestedAmount: number;
}

export type ProposalSummaryCardDetails = Pick<ProposalJson, 'title'> & {
	id: number;
	phase: ProposalPhase;
	category: string;
	fundingType: FundingType;
	requestedAmount: number;
	proposer: string;
}

export type ProposalMainCardDetails = Pick<ProposalJson, 'title' | 'description' | 'properties'> & {
    id: number,
    phase: ProposalPhase,
    proposer: string
	pastProposals?: { title: string, link: string }[];
}

export interface ProposalInfoCardDetails {
	discussionLink: string;
	fundingType: FundingType;
	category: string;
	license: string;
	requestedAmount: number;
}

// ------------------------------------------------------------------------------------------------

export interface ProposalJson {
	title: string;
	description: string;
	type: 'object' | undefined;
	properties: ProposalPropertiesJson;
	required: string[];
	additionalProperties: boolean;
}

export interface ProposalPropertiesJson {
	openSource: boolean;
	focus: ProposalFocusType;
	deliveryDate: string;
	team: string;
	experience: string;
	presentProposal: string;
	deliverable: string;
	futureBlueprint: string;
	benefits: string;
}

export type ProposalFocusType = 'education' | 'defi' | 'nft' | 'libraries' | 'infrastructure' | 'other';