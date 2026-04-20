import { useState, useEffect } from 'react';

export const useTheme = () => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('review_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('review_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('review_theme', 'light');
    }
  }, [isDark]);

  return { isDark, setIsDark };
};
