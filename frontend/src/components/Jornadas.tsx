import { CalendarX } from 'lucide-react'
import type { Empresa, Jornada, Usuario } from '../types'
import { cap, cls, fmtFecha, fmtHora, fmtHoras, hoy } from '../utils'
import { FotoThumb } from './Evidencia'
import { Empty, Pager, usePaged } from './ui'

export function JornadasTabla({ jornadas, usuario, empresa, size = 10 }: { jornadas: Jornada[]; usuario?: Usuario; empresa?: Empresa; size?: number }) {
  const pg = usePaged(jornadas, size)
  if (!jornadas.length) return <Empty icon={<CalendarX className="w-6 h-6" />} title="Sin registros en este periodo" />
  return (
    <>
      {/* Escritorio */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead><tr className="bg-surface-low"><th className="th">Fecha</th><th className="th">Entrada</th><th className="th">Salida</th><th className="th text-right">Horas del día</th><th className="th text-right">Estatus</th></tr></thead>
          <tbody>
            {pg.slice.map((j) => (
              <tr key={j.fecha} className="tr">
                <td className="td font-medium whitespace-nowrap">{cap(fmtFecha(j.fecha, { weekday: 'short', day: 'numeric', month: 'short' }))}</td>
                <td className="td">{j.entrada ? <span className="flex items-center gap-3"><FotoThumb data={{ registro: j.entrada, usuario, empresa }} /><span className="mono">{fmtHora(j.entrada.timestamp)}</span></span> : '—'}</td>
                <td className="td">{j.salida ? <span className="flex items-center gap-3"><FotoThumb data={{ registro: j.salida, usuario, empresa }} /><span className="mono">{fmtHora(j.salida.timestamp)}</span></span> : <span className="text-neutral">—</span>}</td>
                <td className="td text-right font-semibold tabular-nums">{j.completa ? fmtHoras(j.horas) : '0 h'}</td>
                <td className="td text-right"><Estatus j={j} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Móvil */}
      <ul className="sm:hidden divide-y divide-line">
        {pg.slice.map((j) => (
          <li key={j.fecha} className="p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{cap(fmtFecha(j.fecha, { weekday: 'long', day: 'numeric', month: 'short' }))}</p>
              <Estatus j={j} />
            </div>
            <div className="flex items-center gap-4 mt-3">
              {j.entrada && <span className="flex items-center gap-2 text-sm"><FotoThumb data={{ registro: j.entrada, usuario, empresa }} size={44} /><span><span className="block text-xs text-neutral">Entrada</span><span className="mono">{fmtHora(j.entrada.timestamp)}</span></span></span>}
              {j.salida && <span className="flex items-center gap-2 text-sm"><FotoThumb data={{ registro: j.salida, usuario, empresa }} size={44} /><span><span className="block text-xs text-neutral">Salida</span><span className="mono">{fmtHora(j.salida.timestamp)}</span></span></span>}
              <span className="ml-auto text-right"><span className="block text-xs text-neutral">Horas</span><b className="tabular-nums">{j.completa ? fmtHoras(j.horas) : '0 h'}</b></span>
            </div>
          </li>
        ))}
      </ul>
      <Pager {...pg} unidad="días" />
    </>
  )
}

function Estatus({ j }: { j: Jornada }) {
  if (j.completa) return <span className="chip bg-primary-container/50 text-secondary">Completa</span>
  const enCurso = j.fecha === hoy()
  return <span className={cls('chip', enCurso ? 'bg-ink/10 text-ink' : 'bg-error-container text-error')}>{enCurso ? 'En curso' : 'Sin salida · falta'}</span>
}
