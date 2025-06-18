import { AlgoAmount } from "@algorandfoundation/algokit-utils/types/amount";
import { algorand } from "./algo-client";

const max = (...values: bigint[]): bigint => {
    if (values.length === 0) {
        throw new Error('Cannot find maximum of empty array')
    }
    return values.reduce((max, val) => (val > max ? val : max))
}

export type Exclude =
    | 'all'
    | 'assets'
    | 'created-assets'
    | 'apps-local-state'
    | 'created-apps'
    | 'none'

export async function fetchAccountInformation(
    address: string,
    exclude: Exclude = 'none',
): Promise<Record<string, any>> {
    const accountInfo = await algorand.client.algod.accountInformation(address).exclude(exclude).do()
    return accountInfo
}

export type AccountBalance = {
  amount: AlgoAmount
  available: AlgoAmount
  minimum: AlgoAmount
}

export async function fetchBalance(address: string | null): Promise<AccountBalance> {
    if (!address) {
        throw new Error('No address provided')
    }
    const accountInfo = await fetchAccountInformation(address, 'all')

    const amount = BigInt(accountInfo['amount'])
    const minimum = BigInt(accountInfo['min-balance'])
    const available = max(0n, amount - minimum)

    console.log('fetchBalance', {
        amount: AlgoAmount.MicroAlgos(amount),
        available: AlgoAmount.MicroAlgos(available),
        minimum: AlgoAmount.MicroAlgos(minimum),
    })

    return {
        amount: AlgoAmount.MicroAlgos(amount),
        available: AlgoAmount.MicroAlgos(available),
        minimum: AlgoAmount.MicroAlgos(minimum),
    }
}