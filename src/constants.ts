export const env = import.meta?.env ? import.meta.env : process.env;

export const FEE_SINK = 'A7NMWS3NT3IUDMLVO26ULGXGIIOUQ3ND2TXSER6EBGRZNOBOUIQXHIBGDE'

export const XGOV_FEE = BigInt(1_000_000);
export const PROPOSER_FEE = BigInt(10_000_000);
export const PROPOSAL_FEE = BigInt(100_000_000);
export const PROPOSAL_PUBLISHING_BPS = BigInt(1_000);
export const PROPOSAL_COMMITMENT_BPS = BigInt(1_000);
export const MIN_REQUESTED_AMOUNT = BigInt(1_000);

export const MAX_REQUESTED_AMOUNT_SMALL = BigInt(100_000_000_000);
export const MAX_REQUESTED_AMOUNT_MEDIUM = BigInt(1_000_000_000_000);
export const MAX_REQUESTED_AMOUNT_LARGE = BigInt(10_000_000_000_000);

export const DISCUSSION_DURATION_SMALL = BigInt(86400);
export const DISCUSSION_DURATION_MEDIUM = BigInt(172800);
export const DISCUSSION_DURATION_LARGE = BigInt(259200);
export const DISCUSSION_DURATION_XLARGE = BigInt(345600);

export const VOTING_DURATION_SMALL = BigInt(86400);
export const VOTING_DURATION_MEDIUM = BigInt(172800);
export const VOTING_DURATION_LARGE = BigInt(259200);
export const VOTING_DURATION_XLARGE = BigInt(345600);

export const COOL_DOWN_DURATION = BigInt(86400);
export const STALE_PROPOSAL_DURATION = BigInt(86400 * 14);

export const QUORUM_SMALL = BigInt(100);
export const QUORUM_MEDIUM = BigInt(200);
export const QUORUM_LARGE = BigInt(300);

export const WEIGHTED_QUORUM_SMALL = BigInt(200);
export const WEIGHTED_QUORUM_MEDIUM = BigInt(300);
export const WEIGHTED_QUORUM_LARGE = BigInt(400);