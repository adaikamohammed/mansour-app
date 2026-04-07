'use client';

import { motion } from 'framer-motion';

const Skeleton = ({ className }: { className?: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      className={`bg-slate-200 dark:bg-slate-800 rounded-xl ${className}`}
    />
  );
};

export default Skeleton;
