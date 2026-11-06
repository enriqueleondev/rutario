import type { Jornada, Registro, Usuario } from './types'

export const nombreCompleto = (u?: Pick<Usuario, 'nombre' | 'apellidoPaterno' | 'apellidoMaterno'>) =>
  u ? [u.nombre, u.apellidoPaterno, u.apellidoMaterno].filter(Boolean).join(' ') : ''

export const iniciales = (u?: Pick<Usuario, 'nombre' | 'apellidoPaterno'>) =>
  u ? (u.nombre[0] + (u.apellidoPaterno?.[0] ?? '')).toUpperCase() : '?'

export const ymd = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export const hoy = () => ymd(new Date())

export const sumarDias = (fecha: string, n: number) => {
  const [y, m, d] = fecha.split('-').map(Number)
  return ymd(new Date(y, m - 1, d + n))
}

export const parseFecha = (fecha: string) => {
  const [y, m, d] = fecha.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const fmtHora = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }) : '—'

export const fmtFecha = (fecha: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  parseFecha(fecha).toLocaleDateString('es-MX', opts)

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export const fmtFechaLarga = (fecha: string) =>
  cap(parseFecha(fecha).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }))

export const fmtHoras = (h: number) => {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return mm ? `${hh} h ${mm} min` : `${hh} h`
}

export const fmtHorasCorto = (h: number) => `${h.toFixed(1)} h`

export const coords = (lat: number, lng: number) => `${lat.toFixed(6)}, ${lng.toFixed(6)}`

export const mapsUrl = (lat: number, lng: number) => `https://www.google.com/maps?q=${lat},${lng}`

/** Agrupa registros por día y calcula horas = salida − entrada. Sin salida = día incompleto (cuenta como falta, RF-14). */
export function calcularJornadas(registros: Registro[]): Jornada[] {
  const porDia = new Map<string, Jornada>()
  for (const r of registros) {
    if (r.eliminado) continue
    const f = ymd(new Date(r.timestamp))
    const j = porDia.get(f) ?? { fecha: f, horas: 0, completa: false }
    if (r.tipo === 'ENTRADA' && (!j.entrada || r.timestamp < j.entrada.timestamp)) j.entrada = r
    if (r.tipo === 'SALIDA' && (!j.salida || r.timestamp > j.salida.timestamp)) j.salida = r
    porDia.set(f, j)
  }
  for (const j of porDia.values()) {
    if (j.entrada && j.salida) {
      j.horas = Math.max(0, (new Date(j.salida.timestamp).getTime() - new Date(j.entrada.timestamp).getTime()) / 3600000)
      j.completa = true
    }
  }
  return [...porDia.values()].sort((a, b) => b.fecha.localeCompare(a.fecha))
}

/** Foto de prueba (SVG) para el modo mock. En producción fotoUrl apunta a /api/fotos/{id}. */
const fotoCache = new Map<string, string>()
export function fotoSrc(url: string, etiqueta = '') {
  if (!url.startsWith('mock:')) return url
  const key = url + etiqueta
  const hit = fotoCache.get(key)
  if (hit) return hit
  const n = Number(url.slice(5)) || 1
  const hue = [140, 150, 160, 30, 200][n % 5]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${hue},45%,82%)"/><stop offset="1" stop-color="hsl(${hue},35%,62%)"/></linearGradient></defs>
<rect width="400" height="300" fill="url(#g)"/>
<rect x="${40 + (n % 4) * 20}" y="90" width="150" height="150" fill="hsl(${hue},25%,45%)" opacity=".55"/>
<rect x="${210 - (n % 3) * 10}" y="60" width="140" height="180" fill="hsl(${hue},25%,38%)" opacity=".5"/>
${Array.from({ length: 6 }, (_, i) => `<rect x="${225 + (i % 3) * 38}" y="${80 + Math.floor(i / 3) * 50}" width="22" height="28" fill="#fff" opacity=".55"/>`).join('')}
<circle cx="200" cy="168" r="30" fill="#f1d3b3"/><path d="M150 300c0-45 22-80 50-80s50 35 50 80z" fill="#166534"/>
<rect y="262" width="400" height="38" fill="#0b1c30" opacity=".55"/>
<text x="14" y="286" font-family="Inter,Arial" font-size="15" fill="#fff">${etiqueta.replace(/&/g, '&amp;')}</text>
</svg>`
  const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  fotoCache.set(key, src)
  return src
}

export function descargarBlob(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function cls(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

/** Comprime una foto a máx. 1280 px JPEG ~70 % (≈200–300 KB) antes de subirla. */
export async function comprimirFoto(file: Blob, max = 1280, calidad = 0.7): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file)
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bmp.width * k)
    canvas.height = Math.round(bmp.height * k)
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
    return await new Promise((res) => canvas.toBlob((b) => res(b ?? file), 'image/jpeg', calidad))
  } catch {
    return file
  }
}

export function blobToDataUrl(b: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const fr = new FileReader()
    fr.onload = () => res(String(fr.result))
    fr.onerror = rej
    fr.readAsDataURL(b)
  })
}

export const safeStorage = {
  get(k: string) { try { return localStorage.getItem(k) } catch { return null } },
  set(k: string, v: string) { try { localStorage.setItem(k, v) } catch { /* sin almacenamiento */ } },
  del(k: string) { try { localStorage.removeItem(k) } catch { /* noop */ } },
}
