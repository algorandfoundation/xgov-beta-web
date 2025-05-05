import { useState, useEffect } from "react";

/**
 * Hook to watch for changes in URLSearchParams
 *
 * @param callback - Function to be called when the search params change
 */
export function useSearchParamsObserver(
  callback: (params: URLSearchParams) => void,
) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = () => {
      callback(new URLSearchParams(window.location.search));
    };

    // Listen to popstate event triggered by browser navigation actions (back/forward)
    window.addEventListener("search", handlePopState);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener("search", handlePopState);
    };
  }, [callback]);
}

export function useSearchParams() {
  const [params, setParams] = useState<URLSearchParams>(
    () =>
      new URLSearchParams(
        typeof window !== "undefined" ? window.location.search : "",
      ),
  );

  const setSearchParams = (
    prop:
      | URLSearchParams
      | string
      | ((prev: URLSearchParams) => URLSearchParams),
  ) => {
    let updatedParams;
    if (prop instanceof URLSearchParams) {
      updatedParams = prop;
    } else if (typeof prop === "string") {
      updatedParams = new URLSearchParams(prop);
    } else if (typeof prop === "function") {
      updatedParams = prop(params);
    } else {
      throw new Error("Invalid prop type");
    }
    setParams(updatedParams);
    const newUrl = `${window.location.pathname}?${updatedParams.toString()}`;
    window.history.replaceState(null, "", newUrl);
  };

  return [params, setSearchParams] as const;
}
