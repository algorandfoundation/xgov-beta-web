import { DEFAULT_GATEWAY, isIPFSUrl, toImageUrl } from "@awesome-algorand/ipfs-toolkit";

/**
 * NFDProperties contains the expanded metadata stored within an NFD contracts' global-state
 */
export type NFDProperties = {
  /**
   * Internal properties
   */
  internal?: {
    [key: string]: (string);
  };
  /**
   * User properties
   */
  userDefined?: {
    [key: string]: (string);
  };
  /**
   * Verified properties
   */
  verified?: {
    [key: string]: (string);
  };
};

/**
 * Checks if the icon is verified based on the properties provided.
 *
 * @param {NFDProperties} [properties] - Optional set of properties that may contain verification details for the icon.
 * @return {boolean} Returns true if the icon is verified and not user-defined; otherwise, false.
 */
export function isVerified(properties?: NFDProperties): boolean {
  return typeof properties?.verified?.avatar === "string"
}

/**
 * Checks if the user-defined property `avatar` in the given properties is set as a string.
 *
 * @param {NFDProperties} [properties] - An optional object containing various properties to evaluate.
 * @return {boolean} Returns true if the `userDefined.avatar` property is defined and is of type string; otherwise, returns false.
 */
export function isUserDefined(properties?: NFDProperties): boolean {
  return typeof properties?.userDefined?.avatar === "string";
}

/**
 * Checks if the given properties object has a defined avatar in either
 * the verified or userDefined property.
 *
 * @param {NFDProperties} [properties] - The object containing the avatar information to check.
 * @return {boolean} Returns true if the avatar is defined as a string in either
 * the verified or userDefined property, otherwise false.
 */
export function isSet(properties?: NFDProperties): boolean {
  return isVerified(properties) || isUserDefined(properties);
}


/**
 * Retrieves the URL of an avatar image based on the provided properties.
 *
 * @param {NFDProperties} properties - The properties object containing avatar-related data.
 * @param {string} [ipfsGateway=DEFAULT_GATEWAY] - The IPFS gateway URL to be used for fetching images.
 * @return {Promise<string>} A promise that resolves with the avatar image URL as a string.
 * @throws {TypeError} If the avatar URL is not set.
 * @throws {Error} If the fetched IPFS URL is invalid or if the content type is unsupported.
 */
export async function getUrl(properties?: NFDProperties, ipfsGateway: string = DEFAULT_GATEWAY): Promise<string> {
  if(!isSet(properties)) {
    throw new TypeError("No avatar URL set, use isSet to check if the avatar is defined.");
  }
  if (isVerified(properties) && isIPFSUrl(properties?.verified?.avatar as string)) {
    return await toImageUrl(properties?.verified?.avatar as string, ipfsGateway);
  }

  if (isUserDefined(properties) && isIPFSUrl(properties?.userDefined?.avatar as string)) {
    return await toImageUrl(properties?.userDefined?.avatar as string, ipfsGateway);
  }

  // Fetch the image URL
  const url = properties?.verified?.avatar as string || properties?.userDefined?.avatar as string
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Failed to fetch IPFS URL: ${url}`);
  }

  // Determine the content type
  const contentType = resp.headers.get("Content-Type");
  if(!contentType) {
    throw new Error(`Failed to determine content type for IPFS URL: ${url}`);
  }

  // Return the image URL
  if (contentType.startsWith("image/")) {
    return url;
  }

  // Fail if the content type is not supported
  throw new Error("Failed to determine avatar URL.");
}
