import { useState, useEffect } from 'react';

export function useLocalStorageState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch (e) {
      console.warn(`Error reading localStorage key "${key}":`, e);
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`Error setting localStorage key "${key}":`, e);
    }
  }, [key, value]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === key && e.newValue) {
        try {
          setValue(JSON.parse(e.newValue));
        } catch (err) {
          // ignore parse errors from other tabs
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);

  return [value, setValue];
}
