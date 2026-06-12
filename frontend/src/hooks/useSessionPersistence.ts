import { useEffect, useState } from 'react';

export function useSessionPersistence<T>(key: string, initialValue: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch (e) {
      console.error(`Error reading localStorage key "${key}":`, e);
      return initialValue;
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.error(`Error setting localStorage key "${key}":`, e);
      }
    }
  }, [key, value]);

  return [value, setValue];
}
