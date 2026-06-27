import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

export function FloatingActionButton({ onClick, label = "Add", icon = <Plus className="w-6 h-6" /> }) {
  const handleClick = () => {
    if (navigator.vibrate) {
      navigator.vibrate(15);
    }
    if (onClick) onClick();
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      onClick={handleClick}
      aria-label={label}
      title={label}
      className="fixed bottom-24 right-6 lg:bottom-8 lg:right-8 z-30 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-[0_8px_30px_rgba(var(--primary),0.4)] flex items-center justify-center border border-white/20 backdrop-blur-md hover:bg-primary/90 transition-colors"
    >
      {icon}
    </motion.button>
  );
}
