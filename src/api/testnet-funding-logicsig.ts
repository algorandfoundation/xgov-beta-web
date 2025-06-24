import { Buffer } from "buffer";

if (globalThis.Buffer === undefined) {
  globalThis.Buffer = Buffer;
}

import { LogicSigAccount, makeLogicSigAccountTransactionSigner } from "algosdk";

// https://github.com/algorandfoundation/xgov-testnet-proposers-funding-logicsig

const fundingLsigB64 = "BSACAYDC1y8zAACAIL3M6t8UQ06GsE/Jx/JpN1pM/Maqx0Hds0TPhgv71fW6EkAApjIEgQMSMSAyAxIQMQkyAxIQMQEyABIQMwAQIhIQMwAHMwEAEhAzAAczAgASEDMACCMSEDMBECISEDMBB4Ag+jRuARjdHJ6Tavjzdvb4Zeq2d1iKhSJVQiZKZMQg0skSEDMBCCMSEDMCEIEGEhAzAhiBv/fa4QISEDcCGgCABHpP7kMSNwIaAIAEoILO+BIREDMCGYEAEhCACAdM1AABcu6dFxBCAAEiQw=="

export const fundingLogicSig = new LogicSigAccount(Buffer.from(fundingLsigB64, "base64"));

export const fundingLogicSigSigner = makeLogicSigAccountTransactionSigner(fundingLogicSig);
