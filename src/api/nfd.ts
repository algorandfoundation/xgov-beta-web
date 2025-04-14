export async function getNonFungibleDomainName(
  address: string,
): Promise<string> {
  const nfd = await fetch(`https://api.nf.domains/nfd/${address}`).then((r) =>
    r.json(),
  );
  console.log(nfd);
  return nfd.owner;
}
