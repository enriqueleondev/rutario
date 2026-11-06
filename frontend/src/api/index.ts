import { httpApi, setHttpToken } from './http'
import { mockApi, setMockToken } from './mock'
import type { Api } from './types'

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

export const api: Api = USE_MOCK ? mockApi : httpApi

export function setToken(t: string | null) {
  setMockToken(t)
  setHttpToken(t)
}

/** Extensión según lo que devolvió el servidor (el mock devuelve CSV/DOC; el backend real XLSX/DOCX) */
export function extension(blob: Blob, formato: 'xlsx' | 'docx') {
  if (blob.type === 'text/csv') return 'csv'
  if (blob.type === 'application/msword') return 'doc'
  return formato
}

export * from './types'
