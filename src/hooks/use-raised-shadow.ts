// src/hooks/use-raised-shadow.ts
import { MotionValue, useMotionValueEvent, useSpring } from "framer-motion";
import { useState } from "react";

/**
 * Hook para criar um efeito de sombra que aparece quando
 * um elemento está sendo arrastado (dragged).
 * @param y - O motion value do eixo Y do elemento.
 */
export function useRaisedShadow(y: MotionValue<number>) {
  const inactiveShadow = "0px 0px 0px rgba(0,0,0,0)";
  const [isActive, setIsActive] = useState(false);

  const boxShadow = useSpring(inactiveShadow, {
    stiffness: 500,
    damping: 30,
    mass: 0.5,
  });

  useMotionValueEvent(y, "change", (latest) => {
    const wasActive = isActive;
    if (latest !== 0) {
      setIsActive(true);
      if (isActive !== wasActive) {
        boxShadow.set("2px 4px 8px rgba(0,0,0,0.1)");
      }
    } else {
      setIsActive(false);
      if (isActive !== wasActive) {
        boxShadow.set(inactiveShadow);
      }
    }
  });

  return boxShadow;
}
