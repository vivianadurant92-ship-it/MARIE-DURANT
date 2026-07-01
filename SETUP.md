# NutriCoach.Ai — Setup Guide

## 1. Instalar Node.js
Descarga e instala desde: https://nodejs.org (LTS version)

## 2. Instalar dependencias
```bash
cd nutricoach-app
npm install
```

## 3. Correr en el navegador
```bash
npm run dev
# Abre http://localhost:3000
```

## 4. Agregar tu API Key de Anthropic
1. Ve a console.anthropic.com → API Keys
2. Crea una nueva key
3. En la app: pestaña Perfil → pega tu API key → Guardar

## 5. Build para producción
```bash
npm run build
```

## 6. Publicar en Android (Play Store)
```bash
npm run build
npx cap add android
npx cap sync
npx cap open android
# Desde Android Studio → Build → Generate Signed Bundle
```

## 7. Publicar en iOS (App Store)
```bash
npm run build
npx cap add ios
npx cap sync
npx cap open ios
# Desde Xcode → Product → Archive
```

## Estructura del proyecto
```
src/
├── components/
│   ├── Onboarding/   ← 5 pasos de configuración inicial
│   ├── Home/         ← Dashboard con stats del día
│   ├── Pantry/       ← Despensa + OCR de tickets
│   ├── Recipes/      ← Generación de recetas con IA
│   └── Profile/      ← Perfil + API key + idioma
├── hooks/
│   ├── useClaude.ts  ← Integración Anthropic API
│   └── useStorage.ts ← Persistencia localStorage
├── i18n/
│   ├── es.json       ← Español (idioma principal)
│   └── en.json       ← English
└── types/index.ts    ← Todos los tipos TypeScript
```
