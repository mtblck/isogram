// A minimal zip writer (deflate, no dependencies), so building the skill package and the site needs only Node.
import zlib from 'node:zlib'

const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c })
const crc32 = buf => { let c = -1; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ -1) >>> 0 }

// entries: [{ name, data: Buffer }] → Buffer. Fixed timestamp (1 Jan 2026) so the same files give the same zip.
export function zip(entries) {
  const local = [], central = []; let offset = 0
  const TIME = 0, DATE = ((2026 - 1980) << 9) | (1 << 5) | 1
  for (const { name, data } of entries) {
    const n = Buffer.from(name), comp = zlib.deflateRawSync(data, { level: 9 }), crc = crc32(data)
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x0800, 6); h.writeUInt16LE(8, 8)
    h.writeUInt16LE(TIME, 10); h.writeUInt16LE(DATE, 12); h.writeUInt32LE(crc, 14); h.writeUInt32LE(comp.length, 18); h.writeUInt32LE(data.length, 22); h.writeUInt16LE(n.length, 26)
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(8, 10)
    c.writeUInt16LE(TIME, 12); c.writeUInt16LE(DATE, 14); c.writeUInt32LE(crc, 16); c.writeUInt32LE(comp.length, 20); c.writeUInt32LE(data.length, 24); c.writeUInt16LE(n.length, 28)
    c.writeUInt32LE(0o100644 << 16 >>> 0, 38); c.writeUInt32LE(offset, 42)
    local.push(h, n, comp); central.push(c, n); offset += 30 + n.length + comp.length
  }
  const cd = Buffer.concat(central), end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16)
  return Buffer.concat([...local, cd, end])
}
