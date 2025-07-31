import { Buffer } from "buffer";

if (globalThis.Buffer === undefined) {
  globalThis.Buffer = Buffer;
}

import { LogicSigAccount, makeLogicSigAccountTransactionSigner } from "algosdk";

// https://github.com/algorandfoundation/xgov-testnet-proposers-funding-logicsig

// Address: GOFUND4H72X7KGH2FPFJ5M2MD7F4BMMKNONAWAEWCSTHATLFY5FT5QB2NM
const fundingLsigB64 =
  "CiAGAAECBoDC1y/QgqLiAiI4AIAgvczq3xRDToawT8nH8mk3Wkz8xqrHQd2zRM+GC/vV9boSQQACI0MiOBAjEkQjOBAjEkQkOBAlEkQyBIEDEkEAqzEBMgASQQCjMQkyAxJBAJsxIDIDEkEAkyI4ECMSQQCLIjgHIjgAE0EAgSI4ByM4ABJBAHciOAckOAASQQBtIjgIIQQSQQBkIzgQIxJBAFwjOAchBYgAWBJBAFAjOAghBBJBAEckOBAlEkEAPyQ4GCEFEkEANiQ4GSISQQAuJCLCGoAEek/uQxJAAA4kIsIagASggs74EkEAEoAIhuiDAAR85vKAABNBAAIjQyJC//uKAQGL/xaABWFwcElETFADiQ==";

export const fundingLogicSig = new LogicSigAccount(
  Buffer.from(fundingLsigB64, "base64"),
);

export const fundingLogicSigSigner =
  makeLogicSigAccountTransactionSigner(fundingLogicSig);

const scrutinyFundingLsigB64 =
  "CiAEAAEGAiI4AIAguZ1f7LCMciKex+VcHTVdxuYUDR8jYKa+HwIu1yeLCpoSQQACI0MiOBAkEkQjOBAkEkQyBCUSQQBxMRAkEkEAajEZIhJBAGMxIDIDEkEAWyI4GIGS6f3cCxJBAE4iScIagAQmmDIAEkEAQCIjwhojOBgWEkEANCI4ATIAEkEAKyMiwhqABHNNvswSQQAdIzgBMgAlCxJBABKACG+zQwABux5UgAATQQACI0MiQv/7";

export const scrutinyFundingLogicSig = new LogicSigAccount(
  Buffer.from(scrutinyFundingLsigB64, "base64"),
);

export const scrutinyFundingLogicSigSigner =
  makeLogicSigAccountTransactionSigner(scrutinyFundingLogicSig);
