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
  "CiAEAAEGAiI4AIAgvczq3xRDToawT8nH8mk3Wkz8xqrHQd2zRM+GC/vV9boSQQACI0MiOBAkEkQjOBAkEkQyBCUSQQBxMRAkEkEAajEZIhJBAGMxIDIDEkEAWyI4GIHQgqLiAhJBAE4iScIagAQmmDIAEkEAQCIjwhojOBgWEkEANCI4ATIAEkEAKyMiwhqABHNNvswSQQAdIzgBMgAlCxJBABKACA9dMgAC/tnBgAATQQACI0MiQv/7";

export const scrutinyFundingLogicSig = new LogicSigAccount(
  Buffer.from(scrutinyFundingLsigB64, "base64"),
);

export const scrutinyFundingLogicSigSigner =
  makeLogicSigAccountTransactionSigner(scrutinyFundingLogicSig);
