import { useState, useEffect } from 'react';

/**
 * Debounces a value by the given delay (default 350ms).
 * Returns the debounced value — only updates after the user stops
 * changing it for `delay` milliseconds.
 *
 * Usage:
 *   const debouncedSearch = useDebounce(search, 350);
 *   useEffect(() => { fetchData(debouncedSearch); }, [debouncedSearch]);
 */
export function useDebounce(value, delay = 350) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
