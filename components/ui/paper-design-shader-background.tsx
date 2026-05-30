"use client"

import { GrainGradient } from "@paper-design/shaders-react"

/**
 * Warm grain-gradient frame.
 * `shape="corners"` pools the moving hues into the corners/edges while the
 * centre stays cream — so the colour borders the content and never runs
 * through the text. Tuned warm (red / amber / golden / rose), comfortable, not neon.
 */
export function GradientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10" style={{ backgroundColor: "#FAF4EC" }}>
      {/* Warm everywhere — warm colorBack means the side margins actually carry hue
          (corners stay brighter for gentle movement). */}
      <GrainGradient
        style={{ height: "100%", width: "100%" }}
        colorBack="hsl(24, 88%, 60%)"
        softness={0.8}
        intensity={0.65}
        noise={0}
        shape="corners"
        offsetX={0}
        offsetY={0}
        scale={1.15}
        rotation={0}
        speed={0.5}
        colors={["hsl(10, 94%, 56%)", "hsl(34, 97%, 54%)", "hsl(344, 74%, 56%)"]}
      />

      {/* Cream only in the CENTRE (where the title/text lives). The warm light shows
          clearly down the left & right sides and fades inward over the cream — full height. */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,transparent_8%,rgba(250,244,236,0.22)_18%,#FAF4EC_34%,#FAF4EC_66%,rgba(250,244,236,0.22)_82%,transparent_92%,transparent_100%)]" />
    </div>
  )
}
