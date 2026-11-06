# SafeRutes · Frontend web

Panel web de SafeRutes (CBT Lic. Julián Díaz Arias) — React 19 + TypeScript + Vite + Tailwind 3.

## Correr en local

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

Por defecto usa **datos de prueba** (`VITE_USE_MOCK=true` en `.env`).
Usuarios demo (contraseña `saferutes`): root@ / directivo@ / vinculador@ / orientador@ / docente@example.org y el alumno con matrícula `20000001`.

## Conectar al backend Spring Boot

En `.env`:
```
VITE_USE_MOCK=false
VITE_API_URL=/api
```
En desarrollo, Vite redirige `/api` a `http://localhost:8080`. El contrato de la API está en `src/api/types.ts` y `src/api/http.ts`.

## Build de producción

```bash
npm run build      # genera dist/ (lo sirve Nginx dentro del contenedor)
```

## Estructura

- `src/api/` — contrato `Api`, cliente real (`http.ts`) y mock (`mock.ts`, `seed.ts`)
- `src/pages/admin/` — Root y Directivo (inicio, usuarios, carreras, días no laborables, roles)
- `src/pages/vinculador/` — inicio, empresas con mapa, mis alumnos / docentes
- `src/pages/orientador/` — inicio por grupos
- `src/pages/registro/` — alumno y docente: registrar con foto + GPS, mis registros, alumnos de la empresa
- `src/pages/` — compartidas: registros, reportes, detalle de persona
