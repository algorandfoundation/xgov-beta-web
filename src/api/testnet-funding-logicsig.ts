import { Buffer } from "buffer";

if (globalThis.Buffer === undefined) {
  globalThis.Buffer = Buffer;
}

import { LogicSigAccount, makeLogicSigAccountTransactionSigner } from "algosdk";

// https://github.com/algorandfoundation/xgov-testnet-proposers-funding-logicsig

// Address: P4UIPJO5EUOQTHWO5PJIGVCOTWVX7Y7WZ22FULHL53K3NHXFJPYHLMCBLM
const fundingLsigB64 =
  "BSACAYDC1y8zAACAIL3M6t8UQ06GsE/Jx/JpN1pM/Maqx0Hds0TPhgv71fW6EkAApjIEgQMSMSAyAxIQMQkyAxIQMQEyABIQMwAQIhIQMwAHMwEAEhAzAAczAgASEDMACCMSEDMBECISEDMBB4Aggqw2haNp63xw412gRTvxrtvOybk1qADYw9i6umJKPBASEDMBCCMSEDMCEIEGEhAzAhiB59jk4QISEDcCGgCABHpP7kMSNwIaAIAEoILO+BIREDMCGYEAEhCACGc0fwACLwnIFxBCAAEiQw==";

export const fundingLogicSig = new LogicSigAccount(
  Buffer.from(fundingLsigB64, "base64"),
);

export const fundingLogicSigSigner =
  makeLogicSigAccountTransactionSigner(fundingLogicSig);

const scrutinyFundingLsigB64 =
  "BSABAjMAAIAgvczq3xRDToawT8nH8mk3Wkz8xqrHQd2zRM+GC/vV9boSQABiMgQiEjEQgQYSEDEgMgMSEDEZgQASEDMAGIHn2OThAhIQNwAaAIAEJpgyABIQNwAaATMBGBYSEDMAATIAEhA3ARoAgARzTb7MEhAzAQEiMgALEhCACOi5RAADucLkFxBCAAKBAUM=";

export const scrutinyFundingLogicSig = new LogicSigAccount(
  Buffer.from(scrutinyFundingLsigB64, "base64"),
);

export const scrutinyFundingLogicSigSigner =
  makeLogicSigAccountTransactionSigner(scrutinyFundingLogicSig);
