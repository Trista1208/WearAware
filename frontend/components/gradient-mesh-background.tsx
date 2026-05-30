"use client"

import { Renderer, Program, Mesh, Color, Triangle } from "ogl"
import { useEffect, useRef } from "react"

const vert = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`

const frag = (distortion: number) => `
precision highp float;
uniform float uTime;
uniform float uSwirl;
uniform float uSpeed;
uniform float uScale;
uniform float uOffsetX;
uniform float uOffsetY;
uniform float uRotation;
uniform float uWaveAmp;
uniform float uWaveFreq;
uniform float uWaveSpeed;
uniform float uGrain;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform vec3 uResolution;
varying vec2 vUv;

float wave(vec2 uv, float freq, float speed, float time) {
  return sin(uv.x * freq + time * speed) * cos(uv.y * freq + time * speed);
}

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

vec3 colorDodge(vec3 base, vec3 blend) {
  return min(base / (1.0 - blend + 0.0001), 1.0);
}

void main() {
  float mr = min(uResolution.x, uResolution.y);
  vec2 uv = (vUv.xy * 2.0 - 1.0) * uResolution.xy / mr;
  uv = uv * uScale + vec2(uOffsetX, uOffsetY);
  float cosR = cos(uRotation);
  float sinR = sin(uRotation);
  uv = vec2(uv.x * cosR - uv.y * sinR, uv.x * sinR + uv.y * cosR);
  uv.x += wave(uv, uWaveFreq, uWaveSpeed, uTime) * uWaveAmp;
  uv.y += wave(uv + 10.0, uWaveFreq * 1.5, uWaveSpeed * 0.8, uTime) * uWaveAmp * 0.5;
  float angle = atan(uv.y, uv.x);
  float radius = length(uv);
  angle += uSwirl * radius;
  uv = vec2(cos(angle), sin(angle)) * radius;
  float d = -uTime * 0.5 * uSpeed;
  float a = 0.0;
  for (float i = 0.0; i < ${distortion.toFixed(1)}; ++i) {
    a += cos(i - d - a * uv.x);
    d += sin(uv.y * i + a);
  }
  d += uTime * 0.5 * uSpeed;
  float mix1 = (sin(d) + 1.0) * 0.5;
  float mix2 = (cos(a) + 1.0) * 0.5;
  vec3 col = mix(uColorA, uColorB, mix1);
  col = mix(col, uColorC, mix2);
  float grain = (random(gl_FragCoord.xy + uTime) - 0.5) * uGrain;
  col = colorDodge(col, vec3(0.5 + grain));
  gl_FragColor = vec4(col, 1.0);
}
`

interface GradientMeshBackgroundProps {
  colors?: string[]
  className?: string
}

const hexToRgb = (hex: string): [number, number, number] => {
  const clean = hex.replace("#", "")
  return [
    parseInt(clean.substring(0, 2), 16) / 255,
    parseInt(clean.substring(2, 4), 16) / 255,
    parseInt(clean.substring(4, 6), 16) / 255,
  ]
}

/** Soft aurora mesh tuned for Wear Aware cream palette — muted, not neon. */
export function GradientMeshBackground({
  colors = ["#EDE6DA", "#D4DFC8", "#E2D4C4"],
  className,
}: GradientMeshBackgroundProps) {
  const ctnRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ctnRef.current) return
    const ctn = ctnRef.current
    const renderer = new Renderer({ alpha: true, antialias: true })
    const gl = renderer.gl
    gl.clearColor(0, 0, 0, 0)

    const resize = () => renderer.setSize(ctn.offsetWidth, ctn.offsetHeight)
    window.addEventListener("resize", resize, false)
    resize()

    const geometry = new Triangle(gl)
    const rgbColors = colors.slice(0, 3).map(hexToRgb)
    const uniforms: Record<string, { value: number | Color }> = {
      uTime: { value: 0 },
      uSwirl: { value: 0.35 },
      uSpeed: { value: 0.35 },
      uScale: { value: 1.1 },
      uOffsetX: { value: 0.05 },
      uOffsetY: { value: -0.08 },
      uRotation: { value: 0.4 },
      uWaveAmp: { value: 0.06 },
      uWaveFreq: { value: 6.0 },
      uWaveSpeed: { value: 0.12 },
      uGrain: { value: 0.03 },
      uResolution: {
        value: new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height),
      },
    }

    ;["A", "B", "C"].forEach((label, i) => {
      uniforms[`uColor${label}`] = { value: new Color(...rgbColors[i]) }
    })

    const program = new Program(gl, {
      vertex: vert,
      fragment: frag(4),
      uniforms,
    })

    const mesh = new Mesh(gl, { geometry, program })
    let frame = 0

    const update = (t: number) => {
      frame = requestAnimationFrame(update)
      program.uniforms.uTime.value = t * 0.001
      renderer.render({ scene: mesh })
    }
    frame = requestAnimationFrame(update)
    ctn.appendChild(gl.canvas)
    gl.canvas.style.width = "100%"
    gl.canvas.style.height = "100%"
    gl.canvas.style.display = "block"

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", resize)
      if (gl.canvas.parentNode === ctn) ctn.removeChild(gl.canvas)
      gl.getExtension("WEBGL_lose_context")?.loseContext()
    }
  }, [colors])

  return (
    <div className={className}>
      <div ref={ctnRef} className="absolute inset-0 overflow-hidden" aria-hidden="true" />
      {/* Cream wash — mesh stays barely perceptible beneath ivory surface */}
      <div className="pointer-events-none absolute inset-0 bg-[#FAF8F5]/84" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_40%_10%,rgba(255,255,248,0.45)_0%,transparent_58%),radial-gradient(ellipse_at_85%_90%,rgba(212,223,200,0.12)_0%,transparent_48%)]" />
    </div>
  )
}
