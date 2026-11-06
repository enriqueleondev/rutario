import type { ReactNode } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { ToastProvider } from './components/ui'
import Layout, { NAV } from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/admin/Dashboard'
import Usuarios from './pages/admin/Usuarios'
import Carreras from './pages/admin/Carreras'
import DiasNoLaborables from './pages/admin/DiasNoLaborables'
import RolesPermisos from './pages/admin/RolesPermisos'
import InicioVinculador from './pages/vinculador/InicioVinculador'
import Empresas from './pages/vinculador/Empresas'
import MisPersonas from './pages/vinculador/MisPersonas'
import InicioOrientador from './pages/orientador/InicioOrientador'
import Empleadores from './pages/vinculador/Empleadores'
import ValidarAsistencia from './pages/empleador/ValidarAsistencia'
import Registrar from './pages/registro/Registrar'
import MisRegistros from './pages/registro/MisRegistros'
import AlumnosEmpresa from './pages/registro/AlumnosEmpresa'
import Registros from './pages/Registros'
import Reportes from './pages/Reportes'
import PersonaDetalle from './pages/PersonaDetalle'
import { AutorizacionTutor, Privacidad, Terminos } from './pages/legal/Legal'
import { AceptarAviso, CambioPasswordObligatorio } from './components/Cuenta'

function Guard({ path, children }: { path: string; children: ReactNode }) {
  const { usuario } = useAuth()
  if (!usuario) return <Navigate to="/login" replace />
  const permitido = path === '/persona' ? usuario.rol !== 'ALUMNO' && usuario.rol !== 'EMPLEADOR' : NAV[usuario.rol].some((i) => i.to === path)
  return permitido ? <>{children}</> : <Navigate to={NAV[usuario.rol][0].to} replace />
}

function Inicio() {
  const { usuario } = useAuth()
  if (usuario?.rol === 'VINCULADOR') return <InicioVinculador />
  if (usuario?.rol === 'ORIENTADOR') return <InicioOrientador />
  return <Dashboard />
}

// Páginas legales: públicas y accesibles con o sin sesión
const legales = (
  <>
    <Route path="/privacidad" element={<Privacidad />} />
    <Route path="/terminos" element={<Terminos />} />
    <Route path="/autorizacion-tutor" element={<AutorizacionTutor />} />
  </>
)

function Rutas() {
  const { usuario } = useAuth()
  if (!usuario) return <Routes>{legales}<Route path="*" element={<Login />} /></Routes>
  if (usuario.avisoPendiente) return <Routes>{legales}<Route path="*" element={<AceptarAviso />} /></Routes>
  if (usuario.debeCambiarPassword) return <Routes>{legales}<Route path="*" element={<CambioPasswordObligatorio />} /></Routes>
  const g = (path: string, el: ReactNode) => <Route path={path === '/persona' ? '/persona/:id' : path} element={<Guard path={path}>{el}</Guard>} />
  return (
    <Routes>
      {legales}
      <Route element={<Layout />}>
        {g('/inicio', <Inicio />)}
        {g('/usuarios', <Usuarios />)}
        {g('/carreras', <Carreras />)}
        {g('/dias', <DiasNoLaborables />)}
        {g('/roles', <RolesPermisos />)}
        {g('/registros', <Registros />)}
        {g('/reportes', <Reportes />)}
        {g('/persona', <PersonaDetalle />)}
        {g('/empresas', <Empresas />)}
        {g('/empleadores', <Empleadores />)}
        {g('/validar', <ValidarAsistencia />)}
        {g('/mis-alumnos', <MisPersonas rol="ALUMNO" />)}
        {g('/mis-docentes', <MisPersonas rol="DOCENTE" />)}
        {g('/registrar', <Registrar />)}
        {g('/mis-registros', <MisRegistros />)}
        {g('/alumnos-empresa', <AlumnosEmpresa />)}
        <Route path="*" element={<Navigate to={NAV[usuario.rol][0].to} replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <ToastProvider>
          <Rutas />
        </ToastProvider>
      </AuthProvider>
    </HashRouter>
  )
}
