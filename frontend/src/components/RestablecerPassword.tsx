import { useEffect, useState } from 'react'
import { Check, Copy, KeyRound, Loader2 } from 'lucide-react'
import { api } from '../api'
import type { Usuario } from '../types'
import { nombreCompleto } from '../utils'
import { ErrorBox, Modal } from './ui'

/** Genera una contraseña temporal para quien la olvidó. Se muestra una sola vez y se obliga a cambiarla al entrar. */
export function RestablecerPassword({ usuario, onCerrar }: { usuario: Usuario | null; onCerrar: () => void }) {
  const [res, setRes] = useState<{ temporal: string; usuario: string } | null>(null)
  const [error, setError] = useState<string>()
  const [enviando, setEnviando] = useState(false)
  const [copiado, setCopiado] = useState(false)
  useEffect(() => { setRes(null); setError(undefined); setCopiado(false) }, [usuario])

  const generar = async () => {
    setEnviando(true); setError(undefined)
    try { setRes(await api.restablecerPassword(usuario!.id)) } catch (e) { setError((e as Error).message) } finally { setEnviando(false) }
  }
  const copiar = async () => {
    try { await navigator.clipboard.writeText(res!.temporal); setCopiado(true) } catch { /* el navegador no permitió copiar */ }
  }

  return (
    <Modal open={!!usuario} onClose={onCerrar} maxW="max-w-md" label="Restablecer contraseña">
      {usuario && (
        <div className="p-6">
          <div className="flex items-start gap-3 pr-6">
            <span className="w-10 h-10 rounded-xl bg-primary-container/40 text-secondary flex items-center justify-center shrink-0"><KeyRound className="w-5 h-5" /></span>
            <div>
              <h2 className="text-lg font-semibold">Restablecer contraseña</h2>
              <p className="text-sm text-neutral">{nombreCompleto(usuario)} · {usuario.matricula ?? usuario.email}</p>
            </div>
          </div>

          {!res ? (
            <>
              <p className="text-sm text-on-surface-variant mt-4">
                Se generará una <b>contraseña temporal</b>. La contraseña actual dejará de funcionar y, al entrar, el usuario deberá crear una nueva.
                Sus registros y datos no cambian.
              </p>
              <div className="mt-4"><ErrorBox msg={error} /></div>
              <div className="mt-5 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                <button type="button" className="btn-outline" onClick={onCerrar} data-autofocus>Cancelar</button>
                <button type="button" className="btn-primary" onClick={generar} disabled={enviando}>
                  {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}Generar contraseña temporal
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mt-5 rounded-xl border border-line bg-surface-low p-4 text-center">
                <p className="eyebrow">Usuario</p>
                <p className="mono font-semibold">{res.usuario}</p>
                <p className="eyebrow mt-3">Contraseña temporal</p>
                <p className="mono text-3xl font-bold tracking-wider text-secondary select-all" aria-live="polite">{res.temporal}</p>
                <button type="button" className="btn-ghost h-8 mt-2 text-xs" onClick={copiar}>
                  {copiado ? <><Check className="w-3.5 h-3.5" />Copiada</> : <><Copy className="w-3.5 h-3.5" />Copiar</>}
                </button>
              </div>
              <p className="text-sm text-on-surface-variant mt-4">
                Dásela en persona. <b>Solo se muestra esta vez.</b> Al iniciar sesión, el sistema le pedirá crear su propia contraseña.
              </p>
              <div className="mt-5 flex justify-end"><button type="button" className="btn-primary" onClick={onCerrar}>Listo</button></div>
            </>
          )}
        </div>
      )}
    </Modal>
  )
}
