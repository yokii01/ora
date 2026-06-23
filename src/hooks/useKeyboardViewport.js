import { useState, useEffect } from 'react';

export function useKeyboardViewport() {
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    if (!window.visualViewport) return;

    let timeoutId = null;

    const handleResize = () => {
      // Debounce slightly to avoid flickering during resize animation
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // A common heuristic: if visual viewport is significantly smaller than window height, keyboard is open
        const MIN_KEYBOARD_HEIGHT = 150;
        const isKeyboardOpen = window.innerHeight - window.visualViewport.height > MIN_KEYBOARD_HEIGHT;
        setKeyboardOpen(isKeyboardOpen);
      }, 50);
    };

    window.visualViewport.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      clearTimeout(timeoutId);
      window.visualViewport.removeEventListener('resize', handleResize);
    };
  }, []);

  return keyboardOpen;
}
