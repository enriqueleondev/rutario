import { Fragment } from 'react'
import { Check, Minus, Lock } from 'lucide-react'
import { PageHeader } from '../../components/ui'
import type { Rol } from '../../types'
import { ROL_LABEL } from '../../types'

const ROLES: Rol[] = ['ROOT', 'DIRECTIVO', 'VINCULADOR', 'ORIENTADOR', 'DOCENTE', 'ALUMNO', 'EMPLEADOR']
type Celda = true | false | string

const MATRIZ: { modulo: string; filas: { f: string; v: Celda[] }[] }[] = [
  { modulo: 'Usuarios', filas: [
    { f: 'Crear y editar directivos', v: [true, false, false, false, false, false, false] },
    { f: 'Crear vinculadores y orientadores', v: [true, true, false, false, false, false, false] },
    { f: 'Crear docentes y alumnos', v: [true, true, true, false, false, false, false] },
    { f: 'Crear empleadores (personas de la empresa)', v: [true, true, true, false, false, false, false] },
    { f: 'Activar / desactivar cuentas', v: [true, true, false, false, false, false, false] },
    { f: 'Asignar grupos a orientadores', v: [true, true, false, false, false, false, false] },
    { f: 'Eliminar usuarios (con sus registros)', v: [true, 'Excepto directivos', false, false, false, false, false] },
  ] },
  { modulo: 'Académico', filas: [
    { f: 'Carreras, grados y grupos', v: [true, true, false, false, false, false, false] },
    { f: 'Días no laborables', v: [true, true, false, false, false, false, false] },
  ] },
  { modulo: 'Vinculación', filas: [
    { f: 'Alta de empresas con ubicación', v: [true, true, true, false, false, false, false] },
    { f: 'Vincular alumno/docente a empresa', v: [true, true, true, false, false, false, false] },
    { f: 'Asignar tipo de práctica y horario', v: [true, true, true, false, false, false, false] },
    { f: 'Asignar empleador a un alumno', v: [true, true, true, false, false, false, false] },
    { f: 'Eliminar empresas y quitar vinculaciones', v: [true, true, false, false, false, false, false] },
  ] },
  { modulo: 'Asistencia', filas: [
    { f: 'Registrar entrada/salida (foto + GPS)', v: [false, false, false, false, true, true, false] },
    { f: 'Deshacer registro (≤ 5 min)', v: [false, false, false, false, 'Propios', 'Propios', false] },
    { f: 'Eliminar registros de asistencia', v: [true, true, false, false, false, false, false] },
    { f: 'Ver registros y evidencias', v: [true, true, 'Sus vinculados', 'Sus grupos', 'Propios + alumnos de su empresa', 'Propios', false] },
  ] },
  { modulo: 'Validación de la empresa', filas: [
    { f: 'Confirmar si el alumno se presentó (sin foto ni GPS)', v: [false, false, false, false, false, false, 'Sus alumnos asignados, tras su entrada'] },
    { f: 'Ver las confirmaciones de las empresas', v: [true, true, 'Sus vinculados', 'Sus grupos', false, false, false] },
  ] },
  { modulo: 'Reportes', filas: [
    { f: 'Reporte general (Excel / Word)', v: [true, true, 'Sus vinculados', 'Sus grupos', false, false, false] },
    { f: 'Reporte individual', v: [true, true, 'Sus vinculados', 'Sus grupos', 'Alumnos de su empresa', false, false] },
  ] },
  { modulo: 'Sistema', filas: [
    { f: 'Configuración y respaldos', v: [true, false, false, false, false, false, false] },
  ] },
]

const DESC: Record<Rol, string> = {
  ROOT: 'Administración total del sistema.',
  DIRECTIVO: 'Gestión completa del plantel y reportes.',
  VINCULADOR: 'Empresas, empleadores y vinculación de alumnos y docentes.',
  ORIENTADOR: 'Consulta de horas de sus grupos.',
  DOCENTE: 'Registra sus visitas y ve a sus alumnos.',
  ALUMNO: 'Registra entrada y salida; consulta sus horas.',
  EMPLEADOR: 'Persona de la empresa: confirma si sus alumnos se presentaron.',
}

function Cell({ v }: { v: Celda }) {
  if (v === true) return <span className="inline-flex w-6 h-6 rounded-full bg-primary-container/60 text-secondary items-center justify-center"><Check className="w-3.5 h-3.5" /></span>
  if (v === false) return <Minus className="w-4 h-4 text-slate-300 mx-auto" />
  return <span className="chip bg-surface-container text-on-surface-variant text-[11px] whitespace-normal leading-tight">{v}</span>
}

export default function RolesPermisos() {
  return (
    <>
      <PageHeader title="Roles y permisos" subtitle="Matriz de accesos de cada rol. Los permisos son fijos y los valida el backend en cada petición." eyebrow="Solo Root"
        actions={<span className="chip bg-slate-100 text-slate-600 py-1.5 px-3"><Lock className="w-3.5 h-3.5" />Solo lectura</span>} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7 mb-6">
        {ROLES.map((r) => (
          <div key={r} className="card p-4">
            <p className="font-semibold text-secondary">{ROL_LABEL[r]}</p>
            <p className="text-xs text-neutral mt-1">{DESC[r]}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[1040px]">
          <thead>
            <tr className="bg-surface-low">
              <th className="th w-[30%]">Funcionalidad</th>
              {ROLES.map((r) => <th key={r} className="th text-center">{ROL_LABEL[r]}</th>)}
            </tr>
          </thead>
          <tbody>
            {MATRIZ.map((m) => (
              <Fragment key={m.modulo}>
                <tr><td colSpan={8} className="px-4 pt-5 pb-2 text-xs font-bold uppercase tracking-wider text-neutral">{m.modulo}</td></tr>
                {m.filas.map((row) => (
                  <tr key={row.f} className="tr">
                    <td className="td font-medium">{row.f}</td>
                    {row.v.map((v, i) => <td key={i} className="td text-center"><Cell v={v} /></td>)}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
