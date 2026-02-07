export const env = import.meta?.env ? import.meta.env : process.env;

export const FEE_SINK = 'A7NMWS3NT3IUDMLVO26ULGXGIIOUQ3ND2TXSER6EBGRZNOBOUIQXHIBGDE'

export const XGOV_FEE = BigInt(1_000_000);
export const PROPOSER_FEE = BigInt(10_000_000);
export const PROPOSAL_FEE = BigInt(100_000_000);
export const PROPOSAL_PUBLISHING_BPS = BigInt(500);
export const PROPOSAL_COMMITMENT_BPS = BigInt(300);
export const MIN_REQUESTED_AMOUNT = BigInt(1_000);

export const MAX_REQUESTED_AMOUNT_SMALL = BigInt(50_000_000_000);
export const MAX_REQUESTED_AMOUNT_MEDIUM = BigInt(250_000_000_000);
export const MAX_REQUESTED_AMOUNT_LARGE = BigInt(500_000_000_000);

export const DISCUSSION_DURATION_SMALL = BigInt(60);
export const DISCUSSION_DURATION_MEDIUM = BigInt(60);
export const DISCUSSION_DURATION_LARGE = BigInt(60);
export const DISCUSSION_DURATION_XLARGE = BigInt(60);

export const VOTING_DURATION_SMALL = BigInt(600);    // 10 minutes
export const VOTING_DURATION_MEDIUM = BigInt(600);   // 10 minutes
export const VOTING_DURATION_LARGE = BigInt(600);    // 10 minutes
export const VOTING_DURATION_XLARGE = BigInt(600);   // 10 minutes

export const QUORUM_SMALL = BigInt(1_000);
export const QUORUM_MEDIUM = BigInt(1_500);
export const QUORUM_LARGE = BigInt(2_000);

export const WEIGHTED_QUORUM_SMALL = BigInt(2_000);
export const WEIGHTED_QUORUM_MEDIUM = BigInt(3_000);
export const WEIGHTED_QUORUM_LARGE = BigInt(4_000);
