import { Buffer } from "buffer";

if (globalThis.Buffer === undefined) {
  globalThis.Buffer = Buffer;
}

import { LogicSigAccount, makeLogicSigAccountTransactionSigner } from "algosdk";

// https://github.com/algorandfoundation/xgov-testnet-proposers-funding-logicsig

const fundingLsigB64 =
  "BSACAYDC1y8zAACAIL3M6t8UQ06GsE/Jx/JpN1pM/Maqx0Hds0TPhgv71fW6EkAApjIEgQMSMSAyAxIQMQkyAxIQMQEyABIQMwAQIhIQMwAHMwEAEhAzAAczAgASEDMACCMSEDMBECISEDMBB4Ag+jRuARjdHJ6Tavjzdvb4Zeq2d1iKhSJVQiZKZMQg0skSEDMBCCMSEDMCEIEGEhAzAhiBlfms4QISEDcCGgCABHpP7kMSNwIaAIAEoILO+BIREDMCGYEAEhCACN+VqwARil/cFxBCAAEiQw==";

export const fundingLogicSig = new LogicSigAccount(
  Buffer.from(fundingLsigB64, "base64"),
);

export const fundingLogicSigSigner =
  makeLogicSigAccountTransactionSigner(fundingLogicSig);

const scrutinyFundingLsigB64 =
  "BSABATMAAIAgvczq3xRDToawT8nH8mk3Wkz8xqrHQd2zRM+GC/vV9boSQAA5MgQiEjEgMgMSEDEBgQIyAAsOEDEQgQYSEDYaAIAEc02+zBIQMRmBABIQgAgoOOkAANo8hBcQQgABIkM=";

export const scrutinyFundingLogicSig = new LogicSigAccount(
  Buffer.from(scrutinyFundingLsigB64, "base64"),
);

export const scrutinyFundingLogicSigSigner =
  makeLogicSigAccountTransactionSigner(scrutinyFundingLogicSig);
