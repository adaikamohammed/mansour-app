'use client';

/**
 * MotionProvider — يُحمِّل framer-motion features بشكل lazy
 * يقلل حجم الـ bundle بنسبة ~60% (من 180KB إلى ~70KB)
 * يجب أن يُغلّف التطبيق مرة واحدة في layout.tsx
 */

import { LazyMotion, domAnimation } from 'framer-motion';
import type { ReactNode } from 'react';

export default function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
