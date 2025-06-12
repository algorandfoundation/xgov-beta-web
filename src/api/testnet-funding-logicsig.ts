import { Buffer } from "buffer";

if (globalThis.Buffer === undefined) {
  globalThis.Buffer = Buffer;
}

import { LogicSigAccount, makeLogicSigAccountTransactionSigner } from "algosdk";

// https://github.com/algorandfoundation/xgov-testnet-proposers-funding-logicsig

const lsigB64 = "BSACAYDC1y8zAACAIL3M6t8UQ06GsE/Jx/JpN1pM/Maqx0Hds0TPhgv71fW6EkAAmjIEgQMSMSAyAxIQMQkyAxIQMQEyABIQMwAQIhIQMwAHMwEAEhAzAAczAgASEDMACCMSEDMBECISEDMBB4Ag+jRuARjdHJ6Tavjzdvb4Zeq2d1iKhSJVQiZKZMQg0skSEDMBCCMSEDMCEIEGEhAzAhiBlfms4QISEDcCGgCABHpP7kMSEDMCGYEAEhCACH2vRwAEYelaFxBCAAEiQw=="

export const fundingLogicSig = new LogicSigAccount(Buffer.from(lsigB64, "base64"));

export const fundingLogicSigSigner = makeLogicSigAccountTransactionSigner(fundingLogicSig);
