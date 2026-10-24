# Heavy Metal Rock TV ⚡💀

> Plataforma web oficial, medio de comunicación, emisora online 24/7 y tienda especializada en indumentaria, accesorios y material discográfico de rock pesado y metal en el Perú.

[![CI/CD Heavy Metal Rock TV](https://github.com/heavymetalrocktv/HeavyMetalRockTV/actions/workflows/deploy.yml/badge.svg)](https://github.com/heavymetalrocktv/HeavyMetalRockTV/actions/workflows/deploy.yml)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-orange.svg)](site.webmanifest)
[![License: MIT](https://img.shields.io/badge/License-MIT-red.svg)](LICENSE)

---

## 🎸 Descripción General

**Heavy Metal Rock TV** integra tres pilares fundamentales de la escena metalera peruana e internacional:
1. **Canal Audiovisual y Emisora 24/7 (`emisora.html` y `youtube.html`):** Transmisión continua de rock y metal, entrevistas exclusivas a bandas underground y consagradas, cobertura de festivales y especiales históricos.
2. **Heavy Metal Store (`tienda.html`):** Catálogo interactivo con más de 330 reliquias indumentarias y discográficas filtradas en 12 categorías canónicas, con pedidos directos vía Deep Linking de WhatsApp.
3. **Venta y Difusión de Boletos (`venta-boletos.html`):** Plataforma de prensa, preventas y alianzas con promotores de conciertos a nivel nacional.

---

## 📁 Estructura del Proyecto

El repositorio sigue una arquitectura estricta y modular orientada a rendimiento estático y despliegue continuo en **GitHub Pages**:

```plaintext
HeavyMetalRockTV/
├── .github/
│   └── workflows/
│       └── deploy.yml            # Pipeline CI/CD: validación, minificación y despliegue
├── css/
│   └── style.css                 # Hoja de estilos universal (Mobile-First y Responsive)
├── data/
│   └── products.json             # Base de datos JSON con 334 productos catalogados
├── fonts/                        # Archivos de fuentes complementarias
├── icomoon/                      # Especificaciones y exportaciones de íconos vectoriales
├── img/
│   ├── estetica/                 # Identidad visual, logos, banners y afiches
│   └── products/                 # Imágenes optimizadas (.webp) organizadas por categoría
├── js/
│   ├── menu.js                   # Motor global: botón flotante, lightbox y PWA lifecycle
│   └── store.js                  # Motor de catálogo: reactivo, debounced y anti-XSS
├── music/                        # Pistas y temas musicales del canal
├── .gitignore                    # Reglas de exclusión para Git (Node, Python, SO, IDEs)
├── android-chrome-192x192.png    # Icono PWA para dispositivos móviles (192x192)
├── android-chrome-512x512.png    # Icono PWA para pantallas de alta densidad (512x512)
├── apple-touch-icon.png          # Icono para dispositivos iOS de Apple (180x180)
├── emisora.html                  # Sección de radio online 24/7 y programación
├── generate_products.py          # Script de sincronización y reconstrucción de catálogo
├── googlec2d4d6401ed996ce.html   # Token de verificación Google Search Console
├── index.html                    # Página de inicio oficial y bandas destacadas
├── README.md                     # Documentación técnica del proyecto
├── robots.txt                    # Directivas de rastreo e indexación para motores de búsqueda
├── site.webmanifest              # Manifiesto de aplicación web progresiva (PWA)
├── sitemap.xml                   # Mapa de sitio XML para motores de búsqueda
├── sw.js                         # Service Worker con estrategia de caché resiliente
├── tienda.html                   # Catálogo interactivo de la tienda oficial
├── venta-boletos.html            # Información de entradas y alianzas de conciertos
└── youtube.html                  # Repositorio multimedia de videos y especiales
```

---

## 🛠️ Stack Tecnológico

- **Frontend:** HTML5 Semántico, CSS3 Vanilla (variables CSS, Grid y Flexbox), JavaScript ES2022.
- **PWA (Progressive Web App):** Service Worker nativo con precaché offline y `site.webmanifest` estandarizado.
- **Seguridad:**
  - Content Security Policy (CSP Nivel 3) estricta contra XSS y Clickjacking.
  - Sanitización de entidades conforme al estándar OWASP Top 10.
  - Delegación de eventos atómica para prevención de fugas de memoria en el DOM.
  - Protección contra Reverse Tabnabbing (`rel="noopener noreferrer"`).
- **Backend / Tooling:** Python 3 (generador de catálogo y validador de esquema), Node.js (herramientas de minificación y validación estática).
- **CI/CD:** GitHub Actions (validación de esquema en PRs y despliegue automatizado a GitHub Pages).

---

## 🚀 Instalación y Desarrollo Local

No se requieren dependencias complejas ni frameworks pesados para ejecutar el proyecto localmente.

### Opción 1: Servidor Local con Node.js (Recomendado)
```bash
# Iniciar un servidor HTTP local en el puerto 8080
npx serve .
```

### Opción 2: Servidor Local con Python
```bash
# Python 3.x
python -m http.server 8000
```
Luego abre tu navegador en `http://localhost:8000`.

---

## ⚙️ Sincronización del Catálogo

Si agregas o modificas imágenes en `img/products/`, ejecuta el script de automatización para indexar nuevos artículos y sincronizar `data/products.json`:

```bash
python generate_products.py
```

El script valida las carpetas contra las 12 categorías oficiales:
`polos`, `poleras`, `casacas`, `pantalones`, `calzado`, `emo`, `mochilas`, `accesorios`, `posters`, `vinilos`, `album`, `estampado`.

---

## 📦 Pipeline CI/CD

Cada push a la rama `main` activa el flujo automatizado en `.github/workflows/deploy.yml`:
1. **Validación Estructural:** Comprueba que `data/products.json` cumpla con los 7 campos obligatorios y las categorías canónicas.
2. **Optimización y Minificación:** Ejecuta `terser`, `csso-cli` y `html-minifier-terser` con `--ignore-scripts`.
3. **Publicación Inmutable:** Despliega el artefacto optimizado directamente en **GitHub Pages**.

---

## 📄 Licencia

Este proyecto está bajo la licencia [MIT](LICENSE). Contenido audiovisual y marcas pertenecen a sus respectivos creadores y a Heavy Metal Rock TV.
