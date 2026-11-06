<p align="center">
  <img src="frontend/public/rutario-512.png" width="96" alt="Rutario" />
</p>

<h1 align="center">Rutario</h1>
<p align="center"><em>De la ruta al reporte, en un toque.</em></p>

<p align="center">
  <img alt="CI" src="https://github.com/enriqueleondev/rutario/actions/workflows/ci.yml/badge.svg" />
  <img alt="Java" src="https://img.shields.io/badge/Java-Spring_Boot-6DB33F?logo=springboot&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-TypeScript-61DAFB?logo=react&logoColor=black" />
  <img alt="Kotlin" src="https://img.shields.io/badge/Android-Kotlin_·_Compose-7F52FF?logo=kotlin&logoColor=white" />
  <img alt="Swift" src="https://img.shields.io/badge/iOS-SwiftUI-F05138?logo=swift&logoColor=white" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" />
</p>

Sistema de control de **prácticas escolares con evidencia verificable**: alumnos y docentes registran su
entrada y salida con **foto y GPS** desde el celular; vinculadores, orientadores y directivos ven en un mapa
dónde y cuándo se registró cada quien, administran empresas y vinculaciones y exportan reportes de horas a
Excel y Word.

Nació como mi proyecto de **servicio social** (jun–nov 2026) en un bachillerato tecnológico del Estado de México
y **está en producción**, diseñado para unos 400 alumnos en prácticas.

### 👉 [Probar la demo en vivo](https://enriqueleondev.github.io/rutario/)

La demo es la webapp completa con datos ficticios que viven solo en tu navegador. Entra con cualquiera de
los botones "Entrar como" y recorre los seis roles.

## Capturas

| Resumen del directivo | Registros con foto y ubicación |
|---|---|
| ![Resumen](docs/screenshots/web-resumen.png) | ![Registros](docs/screenshots/web-registros.png) |

| Reportes | Portal del alumno (móvil) |
|---|---|
| ![Reportes](docs/screenshots/web-reportes.png) | <img src="docs/screenshots/web-alumno-movil.png" width="240" alt="Portal del alumno" /> |

## Componentes

| Componente | Stack | Código |
|---|---|---|
| [`frontend/`](frontend) | Webapp PWA: React · TypeScript · Vite · Tailwind | Público (modo demo) |
| [`backend/`](backend) | API REST: Java · Spring Boot · PostgreSQL · Flyway | Privado |
| [`android/`](android) | App nativa offline-first: Kotlin · Compose · Room · CameraX · WorkManager | Privado |
| [`ios/`](ios) | App nativa: Swift · SwiftUI | Privado |

## Arquitectura

```mermaid
flowchart LR
  A[App Android<br/>Room + WorkManager] -->|HTTPS · JWT| API
  W[Webapp / PWA<br/>React] -->|HTTPS · JWT| API
  I[App iOS<br/>SwiftUI] -->|HTTPS · JWT| API
  API[API Spring Boot] --> DB[(PostgreSQL 16)]
  API --> F[(Fotos en volumen<br/>purga a 365 días)]
  P[Proxy inverso<br/>TLS automático] --> W
  P --> API
```

Decisiones que vale la pena revisar:

- **Offline-first en Android.** Los registros se guardan en Room y se sincronizan con WorkManager cuando
  vuelve la red; la sesión offline usa refresh token de 30 días.
- **Evidencia difícil de falsear.** La app Android se bloquea con *opciones de desarrollador* activas y rechaza
  ubicación simulada; la web captura la cámara dentro de la página y usa GPS con respaldo.
- **Sesión revocable.** `token_version` en el usuario invalida los JWT al cerrar sesión o restablecer contraseña.
- **Privacidad por diseño.** Aviso de privacidad versionado, cambio obligatorio de contraseña en el primer
  acceso, límite de intentos, purga de fotos y coordenadas a los 365 días, respaldos cifrados y cabeceras de seguridad.
- **Migraciones versionadas** con Flyway.
- **Seis roles:** Root, Directivo, Vinculador, Orientador, Docente y Alumno.
- **Despliegue:** Docker Compose y HTTPS automático con Caddy en un VPS.

## Correr la webapp en local (modo demo)

```bash
cd frontend
cp .env.example .env      # VITE_USE_MOCK=true
npm ci
npm run dev
```

## ¿Necesitas algo parecido?

Construyo sistemas a medida con este mismo enfoque (API, webapp y apps móviles nativas).
Escríbeme a leonenriquer201@gmail.com.

## Autor

**Enrique Rentería León** (enriqueleondev) — Ingeniería en Software, UAEM.
[GitHub](https://github.com/enriqueleondev) · [LinkedIn](https://www.linkedin.com/in/enrique-renteria-le%C3%B3n-71ba393b5)

## Licencia

Todos los derechos reservados. El código visible aquí es para evaluación. Ver [LICENSE](LICENSE).
