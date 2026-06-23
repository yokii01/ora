import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function AIButton() {
  const [hovered, setHovered] = useState(false);

  return (
    <Link to="/assistant">
      <motion.div
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        whileTap={{ scale: 0.95 }}
        className="relative w-12 h-12 flex items-center justify-center cursor-pointer flex-shrink-0"
      >
        {/* Multi-color rotating ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
          className="absolute inset-[4px] rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, #6366f1, #8b5cf6, #ec4899, #f59e0b, #10b981, #3b82f6, #6366f1)',
            padding: '2.5px',
            borderRadius: '50%',
          }}
        >
          <div className="w-full h-full rounded-full bg-background" />
        </motion.div>

        {/* Pulse glow */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1.25 }}
              exit={{ opacity: 0 }}
              className="absolute inset-[4px] rounded-full"
              style={{
                background: 'conic-gradient(from 0deg, #6366f1, #8b5cf6, #ec4899, #f59e0b, #10b981, #3b82f6, #6366f1)',
                filter: 'blur(6px)',
                opacity: 0.4,
              }}
            />
          )}
        </AnimatePresence>

        {/* Center icon */}
        <motion.div
          animate={hovered ? { scale: 1.1 } : { scale: 1 }}
          className="relative z-10 w-[33px] h-[33px] rounded-full bg-background flex items-center justify-center"
        >
          <Sparkles className="w-[22px] h-[22px] text-primary" />
        </motion.div>
      </motion.div>
    </Link>
  );
}