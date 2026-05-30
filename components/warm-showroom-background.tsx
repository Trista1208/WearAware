"use client"

import { motion } from "framer-motion"

/** Warm showroom light — peach, amber, beige, soft terracotta */
export function WarmShowroomBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <motion.div
        className="absolute -left-[18%] -top-[20%] h-[78%] w-[68%] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,228,200,0.55) 0%, rgba(245,210,175,0.28) 42%, transparent 72%)",
          filter: "blur(52px)",
        }}
        animate={{ x: [0, 24, 6, 0], y: [0, 14, -6, 0], opacity: [0.5, 0.62, 0.52, 0.5] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-[12%] top-[0%] h-[65%] w-[58%] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(235,195,155,0.45) 0%, rgba(220,175,130,0.2) 48%, transparent 70%)",
          filter: "blur(56px)",
        }}
        animate={{ x: [0, -18, -4, 0], y: [0, 10, 20, 0], opacity: [0.38, 0.5, 0.42, 0.38] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      />
      <motion.div
        className="absolute bottom-[-8%] left-[15%] h-[55%] w-[62%] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(248,220,195,0.5) 0%, rgba(238,200,170,0.18) 55%, transparent 75%)",
          filter: "blur(44px)",
        }}
        animate={{ x: [0, 12, -8, 0], y: [0, -10, 8, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_95%_60%_at_50%_-5%,rgba(255,245,232,0.55)_0%,transparent_62%)]" />
    </div>
  )
}
