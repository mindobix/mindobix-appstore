#!/usr/bin/env node
// Generates build/icon.png — a 1024×1024 cosmic-orb icon (pure Node.js, no deps)
const zlib = require('zlib')
const fs   = require('fs')
const path = require('path')

const SIZE = 1024
const cx   = SIZE / 2
const cy   = SIZE / 2
const R    = SIZE / 2

// Write a raw RGBA buffer (no alpha pre-multiply needed for Electron)
const buf = Buffer.alloc(SIZE * SIZE * 4, 0)

function setPixel(x, y, r, g, b, a) {
  const i = (y * SIZE + x) * 4
  buf[i]   = r
  buf[i+1] = g
  buf[i+2] = b
  buf[i+3] = a
}

function lerp(a, b, t) { return a + (b - a) * t }

function clamp(v, lo = 0, hi = 255) { return Math.max(lo, Math.min(hi, Math.round(v))) }

// Colour palette (matches Mindobix accent: purple → blue → teal glow)
// outer edge → centre
const stops = [
  { t: 0.00, r: 10,  g: 5,   b: 30,  a: 255 }, // deep space navy
  { t: 0.30, r: 30,  g: 10,  b: 80,  a: 255 }, // deep violet
  { t: 0.55, r: 60,  g: 20,  b: 160, a: 255 }, // vivid purple
  { t: 0.70, r: 40,  g: 80,  b: 220, a: 255 }, // blue
  { t: 0.82, r: 20,  g: 180, b: 240, a: 255 }, // bright cyan
  { t: 0.90, r: 100, g: 220, b: 255, a: 255 }, // white-cyan core
  { t: 1.00, r: 220, g: 240, b: 255, a: 255 }, // white hot centre
]

function getColour(t) {
  // t = 0 at centre, 1 at edge
  const s = stops
  let lo = s[0], hi = s[s.length - 1]
  for (let i = 0; i < s.length - 1; i++) {
    if (t >= s[i].t && t <= s[i+1].t) { lo = s[i]; hi = s[i+1]; break }
  }
  const f = (t - lo.t) / (hi.t - lo.t + 1e-9)
  return {
    r: lerp(hi.r, lo.r, f),
    g: lerp(hi.g, lo.g, f),
    b: lerp(hi.b, lo.b, f),
    a: lerp(hi.a, lo.a, f),
  }
}

// Main orb
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const dx = x - cx, dy = y - cy
    const dist = Math.sqrt(dx*dx + dy*dy)
    if (dist > R) continue
    const t = dist / R                 // 0=centre, 1=edge
    const c = getColour(t)
    // soft edge feather
    const alpha = t > 0.95 ? c.a * (1 - (t - 0.95) / 0.05) : c.a
    setPixel(x, y, clamp(c.r), clamp(c.g), clamp(c.b), clamp(alpha))
  }
}

// Outer glow ring (slightly outside the orb edge, semi-transparent purple)
const glowR = R * 1.0
const glowW = R * 0.04
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const dx = x - cx, dy = y - cy
    const dist = Math.sqrt(dx*dx + dy*dy)
    const fromEdge = Math.abs(dist - glowR)
    if (fromEdge < glowW) {
      const a = clamp(120 * (1 - fromEdge / glowW))
      const existing = buf[(y * SIZE + x) * 4 + 3]
      if (existing < 10) { // only draw in transparent area
        setPixel(x, y, 120, 80, 255, a)
      }
    }
  }
}

// Star sparkles
const stars = [
  { rx: 0.25, ry: 0.22, size: 3 },
  { rx: 0.75, ry: 0.18, size: 4 },
  { rx: 0.60, ry: 0.70, size: 3 },
  { rx: 0.20, ry: 0.65, size: 2 },
  { rx: 0.50, ry: 0.15, size: 2 },
  { rx: 0.80, ry: 0.55, size: 3 },
  { rx: 0.35, ry: 0.80, size: 2 },
  { rx: 0.68, ry: 0.30, size: 2 },
]

for (const { rx, ry, size } of stars) {
  const sx = Math.round(cx + (rx - 0.5) * SIZE * 0.85)
  const sy = Math.round(cy + (ry - 0.5) * SIZE * 0.85)
  const ddx = sx - cx, ddy = sy - cy
  if (Math.sqrt(ddx*ddx + ddy*ddy) > R * 0.90) continue
  for (let dy = -size; dy <= size; dy++) {
    for (let dx = -size; dx <= size; dx++) {
      const d = Math.abs(dx) + Math.abs(dy) // manhattan for cross shape
      if (d <= size) {
        const a = clamp(220 * (1 - d / (size + 1)))
        setPixel(sx + dx, sy + dy, 200, 230, 255, a)
      }
    }
  }
}

// ── PNG encoder ──────────────────────────────────────────────────────────────
function u32be(n) {
  const b = Buffer.alloc(4)
  b.writeUInt32BE(n, 0)
  return b
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii')
  const crcData   = Buffer.concat([typeBytes, data])
  const crc       = crc32(crcData)
  return Buffer.concat([u32be(data.length), typeBytes, data, u32be(crc)])
}

// CRC-32 (PNG uses this)
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (const b of buf) crc = CRC_TABLE[(crc ^ b) & 0xFF] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}

// Build raw scanlines (filter byte 0 = None per row)
const raw = Buffer.alloc(SIZE * (1 + SIZE * 4))
for (let y = 0; y < SIZE; y++) {
  raw[y * (1 + SIZE * 4)] = 0 // filter = None
  buf.copy(raw, y * (1 + SIZE * 4) + 1, y * SIZE * 4, (y + 1) * SIZE * 4)
}

const compressed = zlib.deflateSync(raw, { level: 6 })

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(SIZE, 0)
ihdr.writeUInt32BE(SIZE, 4)
ihdr[8]  = 8  // bit depth
ihdr[9]  = 6  // colour type: RGBA
ihdr[10] = 0  // compression
ihdr[11] = 0  // filter
ihdr[12] = 0  // interlace

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), // PNG sig
  chunk('IHDR', ihdr),
  chunk('IDAT', compressed),
  chunk('IEND', Buffer.alloc(0)),
])

const outPath = path.join(__dirname, '..', 'build', 'icon.png')
fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, png)
console.log(`✓ icon written: ${outPath} (${(png.length / 1024).toFixed(1)} KB)`)
