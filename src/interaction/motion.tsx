import { MotionConfig, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { usePrefs } from "../theme/theme";

/** One motion policy for OS preferences, Settings, transitions and gestures. */
export function useAppReducedMotion() {
  const system = useReducedMotion();
  const { motion } = usePrefs();
  return motion === "reduced" || !!system;
}

export function MotionProvider({ children }: { children: ReactNode }) {
  const reduce = useAppReducedMotion();
  return <MotionConfig reducedMotion={reduce ? "always" : "never"} transition={reduce ? { duration: 0 } : undefined}>{children}</MotionConfig>;
}
