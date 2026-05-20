'use client';

import { motion } from 'framer-motion';

export function TransitionSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[999] bg-black/90 flex items-center justify-center backdrop-blur-md"
    >
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-6"
        />
        <motion.p
          className="font-mono tracking-[4px] text-cyan-300 text-lg"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          ENTERING THE SYSTEM...
        </motion.p>
        <div className="mt-8 w-64 h-1 bg-black/50 rounded-full overflow-hidden">
          <motion.div
            className="h-full w-1/3 bg-gradient-to-r from-cyan-400 to-purple-400"
            animate={{ x: ['-100%', '300%'] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
        </div>
      </div>
    </motion.div>
  );
}
