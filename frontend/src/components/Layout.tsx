import { useRef, useState, type ComponentType } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, GraduationCap, FileBarChart, CalendarOff, ShieldCheck, LogOut, Menu, X, Building2, ClipboardList,
  Camera, History, UserCheck, Briefcase, ClipboardCheck, UserCog,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import type { Rol } from '../types'
import { ROL_LABEL } from '../types'
import { cls, nombreCompleto } from '../utils'
import { Avatar, useDialogo } from './ui'
import { MarcaPin } from './Marca'
import { BotonCambiarPassword } from './Cuenta'
import { CreditoDesarrollador, PieInstitucional } from './Pies'
import { USE_MOCK } from '../api'

type Item = { to: string; label: string; icon: ComponentType<{ className?: string }> }

export const NAV: Record<Rol, Item[]> = {
  ROOT: [
    { to: '/inicio', label: 'Inicio', icon: LayoutDashboard },
    { to: '/usuarios', label: 'Usuarios', icon: Users },
    { to: '/carreras', label: 'Carreras y grupos', icon: GraduationCap },
    { to: '/empresas', label: 'Empresas', icon: Building2 },
    { to: '/empleadores', label: 'Empleadores', icon: UserCog },
    { to: '/registros', label: 'Registros', icon: ClipboardList },
    { to: '/reportes', label: 'Reportes', icon: FileBarChart },
    { to: '/dias', label: 'Días no laborables', icon: CalendarOff },
    { to: '/roles', label: 'Roles y permisos', icon: ShieldCheck },
  ],
  DIRECTIVO: [
    { to: '/inicio', label: 'Inicio', icon: LayoutDashboard },
    { to: '/usuarios', label: 'Usuarios', icon: Users },
    { to: '/carreras', label: 'Carreras y grupos', icon: GraduationCap },
    { to: '/empresas', label: 'Empresas', icon: Building2 },
    { to: '/empleadores', label: 'Empleadores', icon: UserCog },
    { to: '/registros', label: 'Registros', icon: ClipboardList },
    { to: '/reportes', label: 'Reportes', icon: FileBarChart },
    { to: '/dias', label: 'Días no laborables', icon: CalendarOff },
  ],
  VINCULADOR: [
    { to: '/inicio', label: 'Inicio', icon: LayoutDashboard },
    { to: '/empresas', label: 'Empresas', icon: Building2 },
    { to: '/empleadores', label: 'Empleadores', icon: UserCog },
    { to: '/mis-alumnos', label: 'Mis alumnos', icon: Users },
    { to: '/mis-docentes', label: 'Mis docentes', icon: Briefcase },
    { to: '/registros', label: 'Registros', icon: ClipboardList },
    { to: '/reportes', label: 'Reportes', icon: FileBarChart },
  ],
  ORIENTADOR: [
    { to: '/inicio', label: 'Inicio', icon: LayoutDashboard },
    { to: '/registros', label: 'Registros', icon: ClipboardList },
    { to: '/reportes', label: 'Reportes', icon: FileBarChart },
  ],
  DOCENTE: [
    { to: '/registrar', label: 'Registrar asistencia', icon: Camera },
    { to: '/mis-registros', label: 'Mis registros', icon: History },
    { to: '/alumnos-empresa', label: 'Mis alumnos', icon: UserCheck },
  ],
  ALUMNO: [
    { to: '/registrar', label: 'Registrar asistencia', icon: Camera },
    { to: '/mis-registros', label: 'Mis registros', icon: History },
  ],
  EMPLEADOR: [
    { to: '/validar', label: 'Validar asistencia', icon: ClipboardCheck },
  ],
}

export const SUBTITULO: Record<Rol, string> = {
  ROOT: 'Administración del sistema',
  DIRECTIVO: 'Gestión administrativa',
  VINCULADOR: 'Vinculación escolar',
  ORIENTADOR: 'Orientación educativa',
  DOCENTE: 'Portal docente',
  ALUMNO: 'Portal del alumno',
  EMPLEADOR: 'Portal de la empresa',
}

function Brand({ rol }: { rol: Rol }) {
  return (
    <div className="flex items-center gap-3 px-2">
      <MarcaPin oscuro className="w-11 h-11" />
      <div className="leading-tight">
        <p className="font-display text-xl font-extrabold text-white tracking-tight">Rutario</p>
        <p className="text-xs text-white/65">{SUBTITULO[rol]}</p>
      </div>
    </div>
  )
}

export default function Layout() {
  const { usuario, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLElement>(null)
  useDialogo(open, () => setOpen(false), menuRef)
  const loc = useLocation()
  if (!usuario) return null
  const items = NAV[usuario.rol]
  const actual = items.find((i) => loc.pathname.startsWith(i.to))

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="py-6 border-b border-white/10 mx-4"><Brand rol={usuario.rol} /></div>
      <nav aria-label="Menú principal" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map(({ to, label, icon: I }) => (
          <NavLink key={to} to={to} onClick={() => setOpen(false)}
            className={({ isActive }) => cls('flex items-center gap-3 rounded-lg px-3.5 h-11 text-[15px] transition border-l-4',
              isActive ? 'bg-white/10 text-white font-semibold border-aqua' : 'border-transparent text-white/75 hover:bg-white/5 hover:text-white')}>
            <I className="w-5 h-5" aria-hidden="true" />{label}
          </NavLink>
        ))}
      </nav>
      <div className="m-3 p-3 rounded-lg bg-white/5 flex items-center gap-3 text-white">
        <Avatar u={usuario} size={40} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{nombreCompleto(usuario)}</p>
          <span className="chip bg-aqua/15 text-aqua mt-0.5">{ROL_LABEL[usuario.rol]}</span>
        </div>
        <BotonCambiarPassword />
        <button className="icon-btn" onClick={logout} title="Cerrar sesión" aria-label="Cerrar sesión"><LogOut className="w-5 h-5" /></button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen lg:pl-72 flex flex-col">
      <a href="#contenido" onClick={(e) => { e.preventDefault(); document.getElementById('contenido')?.focus() }}
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] btn-primary">Saltar al contenido</a>
      <aside className="on-dark hidden lg:block fixed inset-y-0 left-0 w-72 bg-ink text-white z-30">{sidebar}</aside>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} aria-hidden="true" />
          <aside ref={menuRef} role="dialog" aria-modal="true" aria-label="Menú" tabIndex={-1} className="on-dark absolute inset-y-0 left-0 w-72 bg-ink text-white shadow-pop animate-fade-in">
            <button className="icon-btn absolute right-2 top-2" onClick={() => setOpen(false)} aria-label="Cerrar menú"><X className="w-5 h-5" /></button>
            {sidebar}
          </aside>
        </div>
      )}

      <header className="on-dark lg:hidden sticky top-0 z-30 bg-ink text-white h-14 flex items-center gap-2 px-3">
        <button className="icon-btn" onClick={() => setOpen(true)} aria-label="Abrir menú" aria-expanded={open}><Menu className="w-5 h-5" /></button>
        <MarcaPin oscuro className="w-7 h-7" />
        <span className="font-display font-extrabold">Rutario</span>
        <span className="text-sm text-white/65 truncate">· {actual?.label}</span>
      </header>

      {USE_MOCK && (
        <div className="bg-tertiary-container/50 text-tertiary text-xs text-center py-1.5 px-3">
          Modo demostración: datos de prueba guardados solo en este navegador.
        </div>
      )}

      <main id="contenido" tabIndex={-1} className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[1320px] mx-auto focus:outline-none">
        <Outlet />
      </main>
      <footer>
        <PieInstitucional className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-5 border-t border-line" />
        <CreditoDesarrollador />
      </footer>
    </div>
  )
}
