import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import { AVISO_FECHA, INSTITUCION, PLAZO_CONSERVACION } from '../../institucion'
import { CreditoDesarrollador, PieInstitucional } from '../../components/Pies'

const I = INSTITUCION
const contactoArco = I.correoTransparencia
  ? <>por correo a <a className="text-secondary underline" href={`mailto:${I.correoTransparencia}`}>{I.correoTransparencia}</a> o en la Dirección del plantel</>
  : <>en la Dirección del plantel</>
const responsable = <>el <b>{I.nombre}</b>, {I.ubicacion}{I.dependencia && <>, plantel adscrito a {I.dependencia}</>}{I.domicilio && <>, con domicilio en {I.domicilio}</>}</>

/* ---------- Estructura común ---------- */
export function LegalLayout({ titulo, children, imprimir }: { titulo: string; children: ReactNode; imprimir?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <header className="bg-white border-b border-line print:hidden">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3">
          <img src="./rutario-simbolo.svg" alt="" className="w-9 h-9" />
          <span className="font-bold text-on-surface">Rutario</span>
          <div className="ml-auto flex items-center gap-2">
            {imprimir && <button type="button" className="btn-outline h-9" onClick={() => window.print()}><Printer className="w-4 h-4" />Imprimir</button>}
            <Link to="/" className="btn-ghost h-9"><ArrowLeft className="w-4 h-4" />Volver</Link>
          </div>
        </div>
      </header>
      <main id="contenido" className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        <article className="card p-6 sm:p-10 legal print:shadow-none print:border-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-secondary leading-tight">{titulo}</h1>
          {children}
        </article>
        <PieInstitucional className="mt-6 print:hidden" />
      </main>
      <div className="print:hidden"><CreditoDesarrollador /></div>
    </div>
  )
}

const H2 = ({ children }: { children: ReactNode }) => <h2 className="text-lg font-semibold text-on-surface mt-8 mb-2">{children}</h2>
const P = ({ children }: { children: ReactNode }) => <p className="text-[15px] leading-relaxed text-on-surface-variant mt-2">{children}</p>
const UL = ({ children }: { children: ReactNode }) => <ul className="list-disc pl-6 mt-2 space-y-1 text-[15px] leading-relaxed text-on-surface-variant">{children}</ul>

/* ---------- Aviso simplificado (se muestra al momento de recabar los datos) ---------- */
export function AvisoSimplificado({ compacto }: { compacto?: boolean }) {
  return (
    <div className={compacto ? 'text-xs text-neutral leading-relaxed' : 'text-sm text-on-surface-variant leading-relaxed space-y-2'}>
      <p>
        <b>Aviso de privacidad simplificado.</b> El {I.corto} trata tu nombre, matrícula o correo, carrera, grupo, la empresa donde realizas
        tus prácticas y, al registrar asistencia, <b>una fotografía y tu ubicación GPS de ese momento</b>, con la única finalidad de acreditar
        tu asistencia y calcular tus horas de servicio social, estadías o prácticas. No se usan para otros fines ni se transfieren a terceros.
        La foto y la ubicación se eliminan automáticamente después de {PLAZO_CONSERVACION}. Puedes ejercer tus derechos de acceso, rectificación,
        cancelación y oposición {contactoArco}. {compacto ? 'Consulta el ' : 'Lee el '}
        <Link to="/privacidad" className="text-secondary font-medium underline">aviso de privacidad integral</Link>.
      </p>
    </div>
  )
}

/* ---------- Aviso integral ---------- */
export function AvisoIntegral() {
  return (
    <>
      <p className="text-sm text-neutral mt-2">Sistema Rutario · Última actualización: {AVISO_FECHA}</p>

      <H2>1. ¿Quién es el responsable de tus datos?</H2>
      <P>El responsable del tratamiento de los datos personales que se recaban en el sistema Rutario es {responsable}.</P>

      <H2>2. ¿Qué datos personales se recaban?</H2>
      <UL>
        <li><b>Identificación y contacto:</b> nombre y apellidos, matrícula (alumnos), correo institucional (personal) y, de forma opcional, teléfono.</li>
        <li><b>Académicos:</b> carrera, grado y grupo.</li>
        <li><b>De las prácticas:</b> empresa o institución receptora, tipo de práctica (servicio social, estadías o prácticas de ejecución), actividades, horario y periodo.</li>
        <li><b>Del registro de asistencia:</b> una fotografía tomada al registrar la entrada o la salida, la ubicación GPS del dispositivo en ese momento, la fecha y hora, y si se registró desde la web o la app.</li>
        <li><b>Técnicos y de seguridad:</b> la dirección IP de los intentos de inicio de sesión (solo para bloquear intentos fallidos repetidos durante 15 minutos).</li>
      </UL>
      <P>
        No se recaban datos personales sensibles. La fotografía se usa únicamente como evidencia visual del registro: <b>no se aplica reconocimiento
        facial ni ningún tratamiento biométrico</b>. La ubicación se obtiene solo en el momento de registrar; el sistema no rastrea tu ubicación en segundo plano.
      </P>

      <H2>3. ¿Para qué se usan tus datos?</H2>
      <P>Para las siguientes finalidades, todas necesarias para el servicio:</P>
      <UL>
        <li>Identificarte y darte acceso al sistema según tu rol.</li>
        <li>Acreditar tu asistencia y calcular las horas de servicio social, estadías o prácticas de ejecución.</li>
        <li>Verificar que el registro se realice en el lugar de prácticas asignado.</li>
        <li>Generar los reportes de horas que utilizan Dirección, Vinculación, Orientación y los docentes responsables.</li>
        <li>Proteger la seguridad de las cuentas y del sistema.</li>
      </UL>
      <P>No se usan para fines publicitarios, comerciales ni para elaborar perfiles.</P>

      <H2>4. Fundamento para el tratamiento</H2>
      <P>
        Los datos se tratan en ejercicio de las atribuciones del plantel para la organización y acreditación del servicio social y las prácticas,
        conforme a la Ley General de Protección de Datos Personales en Posesión de Sujetos Obligados, la Ley de Protección de Datos Personales en
        Posesión de Sujetos Obligados del Estado de México y Municipios y la normativa escolar aplicable.
      </P>

      <H2>5. Alumnos menores de edad</H2>
      <P>
        Los datos de alumnos menores de edad se tratan atendiendo a su interés superior. Su madre, padre o tutor puede conocer este aviso y ejercer
        en su nombre los derechos descritos en el punto 9. El plantel recaba un{' '}
        <Link to="/autorizacion-tutor" className="text-secondary underline">formato de conocimiento y autorización</Link> firmado por la madre, padre o tutor.
      </P>

      <H2>6. ¿Quién puede ver tus datos? ¿Se transfieren?</H2>
      <P>
        Solo el personal autorizado del plantel, de acuerdo con su función: Dirección, Vinculación (alumnos y docentes a su cargo),
        Orientación (alumnos de sus grupos y los docentes de sus empresas) y el docente responsable (alumnos de su misma empresa).
        Cada alumno ve únicamente sus propios registros.
      </P>
      <P>
        <b>Tus datos no se transfieren a terceros</b>, salvo los requerimientos de autoridades competentes debidamente fundados y motivados.
        El sistema se aloja en un servidor contratado por el plantel; el proveedor de alojamiento solo presta la infraestructura y no tiene
        permiso para usar los datos. Al mostrar mapas, tu navegador descarga las imágenes del mapa desde los servidores de OpenStreetMap,
        que reciben tu dirección IP; no se les envía tu nombre, matrícula ni fotografía.
      </P>

      <H2>7. ¿Cuánto tiempo se conservan?</H2>
      <UL>
        <li><b>Fotografía y ubicación GPS:</b> {PLAZO_CONSERVACION} contado desde el registro. Después se eliminan de forma automática.</li>
        <li><b>Fecha, hora y tipo de cada registro, y el total de horas:</b> forman parte del expediente de prácticas y se conservan conforme a los plazos del archivo escolar.</li>
        <li><b>Copias de seguridad:</b> están cifradas y se reemplazan cada 8 semanas.</li>
        <li><b>Registro de intentos de inicio de sesión:</b> 15 minutos.</li>
      </UL>

      <H2>8. ¿Cómo se protegen?</H2>
      <P>
        Conexión cifrada (HTTPS), contraseñas almacenadas con cifrado irreversible, acceso limitado por rol, fotografías disponibles solo mediante
        enlaces temporales, bloqueo de cuentas ante intentos fallidos repetidos, cierre de sesión automático tras 20 minutos de inactividad y
        copias de seguridad cifradas.
      </P>

      <H2>9. Tus derechos (ARCO y portabilidad)</H2>
      <P>
        Tienes derecho a <b>acceder</b> a tus datos, <b>rectificarlos</b> si son inexactos, <b>cancelarlos</b> cuando ya no sean necesarios,
        <b> oponerte</b> a su tratamiento y solicitar su <b>portabilidad</b>, en los términos de la ley. Puedes presentar tu solicitud {contactoArco},
        o a través del Sistema de Acceso, Rectificación, Cancelación y Oposición de Datos Personales del Estado de México (SARCOEM) o de la
        Plataforma Nacional de Transparencia.
      </P>
      <P>
        La solicitud debe incluir tu nombre, un medio para recibir notificaciones, el documento que acredite tu identidad (o la de tu representante),
        la descripción clara de los datos y del derecho que quieres ejercer. Si no estás conforme con la respuesta, puedes interponer un recurso de
        revisión ante el organismo garante del Estado de México (Infoem).
      </P>

      <H2>10. Cookies y almacenamiento en tu navegador</H2>
      <P>
        Rutario <b>no usa cookies, ni herramientas de analítica o publicidad</b>. Solo guarda en el almacenamiento local de tu navegador los datos
        mínimos para mantener tu sesión abierta; se borran al cerrar sesión o después de 20 minutos de inactividad. La tipografía y los demás
        recursos se sirven desde el propio sistema.
      </P>

      <H2>11. Cambios a este aviso</H2>
      <P>
        Cualquier cambio se publicará en esta misma página. Si el cambio es relevante, el sistema te pedirá leer y aceptar la nueva versión
        la próxima vez que inicies sesión.
      </P>
    </>
  )
}

export function Privacidad() {
  return <LegalLayout titulo="Aviso de privacidad integral" imprimir><AvisoIntegral /></LegalLayout>
}

/* ---------- Términos y condiciones ---------- */
export function Terminos() {
  return (
    <LegalLayout titulo="Términos y condiciones de uso" imprimir>
      <p className="text-sm text-neutral mt-2">Sistema Rutario · Última actualización: {AVISO_FECHA}</p>

      <H2>1. Objeto</H2>
      <P>
        Rutario es el sistema del {I.nombre} para registrar la asistencia y calcular las horas de servicio social, estadías y prácticas de ejecución.
        Su uso es exclusivo para alumnos, docentes y personal del plantel con una cuenta asignada. Al iniciar sesión aceptas estos términos.
      </P>

      <H2>2. Cuentas</H2>
      <UL>
        <li>Tu cuenta es personal e intransferible. No compartas tu contraseña.</li>
        <li>Si tu contraseña la asignó otra persona, el sistema te pedirá cambiarla al entrar.</li>
        <li>Si olvidas tu contraseña o crees que alguien más la conoce, avisa de inmediato a tu vinculador o a Dirección.</li>
        <li>Después de 5 intentos fallidos la cuenta se bloquea durante 15 minutos.</li>
      </UL>

      <H2>3. Registro de asistencia</H2>
      <UL>
        <li>La entrada y la salida deben registrarse personalmente, en el lugar de prácticas y en el momento real, con una foto tomada en ese momento.</li>
        <li>Está prohibido registrar por otra persona, usar fotografías anteriores o de terceros, y alterar o simular la ubicación del dispositivo.</li>
        <li>Solo se permite una entrada y una salida por día. Un registro hecho por error puede deshacerse dentro de los 5 minutos siguientes.</li>
        <li>Un día sin salida se considera incompleto y no suma horas.</li>
      </UL>
      <P>
        Los registros que incumplan estas reglas podrán invalidarse, y el caso se atenderá conforme al reglamento escolar del plantel.
      </P>

      <H2>4. Obligaciones del personal</H2>
      <UL>
        <li>Consultar solo la información necesaria para su función y usarla únicamente con fines escolares.</li>
        <li>Guardar la confidencialidad de los datos, en especial las fotografías y ubicaciones; no copiarlas, publicarlas ni compartirlas fuera del sistema.</li>
        <li>Mantener actualizados los datos de alumnos, empresas y vinculaciones que registra.</li>
      </UL>

      <H2>5. Disponibilidad</H2>
      <P>
        El plantel procura que el sistema esté disponible de forma continua, pero puede haber interrupciones por mantenimiento o fallas de conexión.
        Si no puedes registrar por una falla del sistema, avisa a tu vinculador el mismo día.
      </P>

      <H2>6. Privacidad</H2>
      <P>El tratamiento de tus datos se rige por el <Link to="/privacidad" className="text-secondary underline">aviso de privacidad</Link>.</P>

      <H2>7. Cambios</H2>
      <P>Estos términos pueden actualizarse; la versión vigente siempre estará publicada en esta página.</P>
    </LegalLayout>
  )
}

/* ---------- Formato para madre, padre o tutor (imprimible) ---------- */
const Linea = ({ w = 'flex-1' }: { w?: string }) => <span className={`inline-block border-b border-on-surface ${w} min-w-24 translate-y-1`} />

export function AutorizacionTutor() {
  return (
    <LegalLayout titulo="Formato de conocimiento y autorización de madre, padre o tutor" imprimir>
      <p className="text-sm text-neutral mt-2">{I.nombre} · Sistema Rutario</p>
      <div className="mt-8 space-y-6 text-[15px] leading-loose text-on-surface">
        <p className="flex flex-wrap items-end gap-2">Yo, <Linea />, en mi carácter de madre / padre / tutor(a) del alumno(a)</p>
        <p className="flex flex-wrap items-end gap-2"><Linea />, matrícula <Linea w="w-32" />, grado y grupo <Linea w="w-24" />,</p>
        <p>
          manifiesto que conozco el aviso de privacidad del sistema Rutario, publicado en {location.host}/#/privacidad,
          y que estoy enterado(a) de que, para acreditar su asistencia a las prácticas (servicio social, estadías o prácticas de ejecución), al registrar
          su entrada y salida se recaban <b>una fotografía y la ubicación GPS de ese momento</b>, que se conservan por {PLAZO_CONSERVACION} y después se
          eliminan, y que no se transfieren a terceros.
        </p>
        <p>Por lo anterior, <b>autorizo</b> el tratamiento de dichos datos para las finalidades descritas en el aviso de privacidad.</p>
        <div className="grid sm:grid-cols-2 gap-10 pt-10">
          <div className="text-center"><span className="block border-b border-on-surface h-10" /><p className="text-sm mt-1">Nombre y firma de la madre, padre o tutor(a)</p></div>
          <div className="text-center"><span className="block border-b border-on-surface h-10" /><p className="text-sm mt-1">Fecha</p></div>
        </div>
        <p className="text-sm text-neutral pt-4">El formato firmado se entrega al área de Vinculación y se resguarda en el expediente del alumno.</p>
      </div>
    </LegalLayout>
  )
}
