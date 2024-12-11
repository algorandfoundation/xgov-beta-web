export async function getNonFungibleDomainName(address: string): Promise<string> {
    const nfd = await (await fetch(`https://api.nf.domains/nfd/lookup?address=${address}`)).json();
    return nfd.name;
}