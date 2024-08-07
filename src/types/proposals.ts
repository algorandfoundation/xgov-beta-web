
export type ProposalPhase = 'submission' | 'discussion' | 'vote' | 'closure';
export type FundingType = 'retroactive' | 'proactive';

export const phaseToText = {
    submission: 'Submission',
    discussion: 'Discussion',
    vote: 'Voting',
    closure: 'Closure'
};

export interface ProposalSummaryCardDetails {
	id: number;
	title: string;
	phase: ProposalPhase;
	category: string;
	fundingType: FundingType;
	requestedAmount: number;
	proposer: string;
	
}

export type ProposalCardDetails = Pick<ProposalJson, 'title' | 'description' | 'properties'> & {
    id: number,
    phase: ProposalPhase,
    proposer: string
	pastProposals: { title: string, link: string }[];
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