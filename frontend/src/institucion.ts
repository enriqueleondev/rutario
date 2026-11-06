// Datos del plantel que aparecen en el pie de página, el aviso de privacidad y los términos.
// Los campos vacíos no se muestran. Complétalos con los datos oficiales y vuelve a desplegar.
export const INSTITUCION = {
  nombre: 'Centro de Bachillerato Tecnológico Lic. Julián Díaz Arias, Chapultepec',
  corto: 'CBT Lic. Julián Díaz Arias',
  ubicacion: 'Chapultepec, Estado de México',
  /** Dependencia de la que depende el plantel (ej. la Secretaría de Educación estatal). */
  dependencia: '',
  /** Clave de Centro de Trabajo */
  cct: '15XXX0000X',
  /** Calle, número, colonia, C.P. */
  domicilio: 'Calle Ejemplo No. 1, Col. Centro, Chapultepec, Estado de México',
  telefono: '(55) 0000 0000',
  correo: 'contacto@example.org',
  /** Correo de la Unidad de Transparencia o del área que atiende solicitudes de datos personales */
  correoTransparencia: 'contacto@example.org',
  sitio: 'https://rutario.example.org',
}

export const DESARROLLADOR = {
  nombre: 'Enrique Rentería León',
  titulo: 'Ingeniero en Software',
  linkedin: 'https://www.linkedin.com/in/enrique-renteria-le%C3%B3n-71ba393b5',
  github: 'https://github.com/enriqueleondev',
}

/** Debe coincidir con Legal.AVISO_VERSION del backend */
export const AVISO_FECHA = '17 de octubre de 2026'
export const PLAZO_CONSERVACION = '1 año'
