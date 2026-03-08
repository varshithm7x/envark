"use client";

import { LiquidMetal } from "@paper-design/shaders-react";
import { motion, useScroll, useTransform } from "motion/react";

export function MetallicAsterisk() {
  const { scrollYProgress } = useScroll();
  const scrollRotate = useTransform(scrollYProgress, [0, 1], [0, 1080]);

  return (
    <motion.div
      className="origin-center scale-100 xl:scale-[1.2] flex items-center justify-center w-full"
      style={{ rotate: scrollRotate }}
    >         
      <LiquidMetal
        width={500}
        height={500}
        image="/svgs/Asterisk.svg"
        colorBack="#13130000"
        colorTint="#ffffff"
        shape={undefined}
        repetition={2}
        softness={0.1}
        shiftRed={0.3}
        shiftBlue={0.3}
        distortion={0.07}
        contour={0.4}
        angle={70}
        speed={1}
        scale={0.9}
        fit="contain"
      />
    </motion.div>
  );
}
