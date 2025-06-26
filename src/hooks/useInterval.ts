import { useEffect, useRef } from "react";

export function useInterval(callback: () => void, interval: number | null) {
  const savedCallback = useRef<() => void>();

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    if (interval === null) {
      return;
    }

    const id = setInterval(() => {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }, interval);

    return () => clearInterval(id);
  }, [interval]);
}
