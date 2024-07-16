export interface ProposalCardDetails {
	id: number;
	title: string;
	phase: 'submission' | 'discussion' | 'vote' | 'closure';
	category: string;
	fundingType: 'retroactive' | 'proactive';
	requestedAmount: number;
	proposer: string;
}