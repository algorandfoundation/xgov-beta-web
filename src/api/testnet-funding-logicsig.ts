import { Buffer } from "buffer";

if (globalThis.Buffer === undefined) {
  globalThis.Buffer = Buffer;
}

import { LogicSigAccount, makeLogicSigAccountTransactionSigner } from "algosdk";

// https://github.com/algorandfoundation/xgov-testnet-proposers-funding-logicsig

const proposerLsigB64 = "BSACAYDC1y8zAACAIL3M6t8UQ06GsE/Jx/JpN1pM/Maqx0Hds0TPhgv71fW6EkAAmjIEgQMSMSAyAxIQMQkyAxIQMQEyABIQMwAQIhIQMwAHMwEAEhAzAAczAgASEDMACCMSEDMBECISEDMBB4Ag+jRuARjdHJ6Tavjzdvb4Zeq2d1iKhSJVQiZKZMQg0skSEDMBCCMSEDMCEIEGEhAzAhiBlfms4QISEDcCGgCABHpP7kMSEDMCGYEAEhCACH2vRwAEYelaFxBCAAEiQw=="

export const proposerFundingLogicSig = new LogicSigAccount(Buffer.from(proposerLsigB64, "base64"));

export const proposerFundingLogicSigSigner = makeLogicSigAccountTransactionSigner(proposerFundingLogicSig);

const xgovLsigB64 = "BSACAYDC1y8zAACAIL3M6t8UQ06GsE/Jx/JpN1pM/Maqx0Hds0TPhgv71fW6EkAAmjIEgQMSMSAyAxIQMQkyAxIQMQEyABIQMwAQIhIQMwAHMwEAEhAzAAczAgASEDMACCMSEDMBECISEDMBB4Ag+jRuARjdHJ6Tavjzdvb4Zeq2d1iKhSJVQiZKZMQg0skSEDMBCCMSEDMCEIEGEhAzAhiBlfms4QISEDcCGgCABKCCzvgSEDMCGYEAEhCACONlPAAAsMzAFxBCAAEiQw=="

export const xgovFundingLogicSig = new LogicSigAccount(Buffer.from(xgovLsigB64, "base64"));

export const xgovFundingLogicSigSigner = makeLogicSigAccountTransactionSigner(xgovFundingLogicSig);
