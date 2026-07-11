# INVENTARIO — Migración CLAP a Astro (Fase 0)

Fuente analizada (solo lectura): `~/Escritorio/elba/clapedu-diseño/clap-web/*.html`
Método: 6 análisis independientes (uno por página), citando `archivo:línea` para cada afirmación sobre disparadores de animación y comportamiento JS — nada se asumió sin verse en el código.

## 0. Cómo está armado el HTML fuente (para entender las citas de abajo)

Cada `.html` es un export de una herramienta de prototipado ("dc"):
- `<head>` real: **mínimo siempre** — solo charset/viewport/script del runtime del prototipador (`support.js`, irrelevante, se descarta) y un `<template>` decorativo del bundler (irrelevante). **Ninguna página tiene `<title>` ni `<meta name="description">` reales.** El SEO se construye 100% desde cero.
- `<x-dc><helmet>`: preconnects a Google Fonts + un bloque `<style>` grande por página (reset, `@font-face`, `@keyframes`, reglas `:hover`). Es CSS real, pero **duplicado casi íntegro en cada página** con nombres de keyframe distintos (ver §5).
- Marcado real de la página: HTML normal con estilos inline y atributos `data-*` como hooks de JS.
- `<script type="text/x-dc" data-dc-script"> class Component extends DCLogic {...}`: **este es el comportamiento real** (event listeners, `IntersectionObserver`, `setTimeout`/`setInterval`). Se verificó método por método.
- `<image-slot>`: solo aparece en `equipo.html`; es un placeholder de imagen propio de la herramienta de prototipado (drag&drop, persistencia en sidecar). Para Astro se trata como `<img>` normal — el comportamiento de "slot editable" no se migra (no existe en producción).

---

## 1. Mapa de rutas

| Origen | Ruta Astro | Anclas |
|---|---|---|
| `index.html` | `/` | `#inicio`, `#ecosistema`, `#contacto` (referenciadas desde otras páginas) |
| `sobre-nosotros.html` | `/sobre-nosotros` | `#que-es`, `#valores`, `#filosofia`, `#historia` (confirmadas, existen como `id` reales) |
| `metodologia.html` | `/metodologia` | `#fases`, `#competencias` |
| `equipo.html` | `/equipo` | — |
| `programas.html` | `/programas` | `#rutas`; **`#empresas` NO es un `id` real** (ver nota crítica abajo) |
| `politica-privacidad.html` | `/politica-privacidad` | — (sin `id` en ningún heading; ver §7) |

**Nota crítica sobre `programas.html#empresas`:** no existe ningún elemento con `id="empresas"` en el DOM fuente. Lo que existe son dos secciones `#empresas-circulo` y `#empresas-laboratorio`, y un **toggle de "track"** (`data-track="personas"` / `data-track="empresas"`, dos `<div>` wrapper, uno oculto por defecto). El anchor `#empresas` se intercepta vía JS (`hashchange` + chequeo en el mount) para: (1) activar el track empresas, (2) hacer scroll al tope de la página — **no** hace scroll a ninguna sección específica. Al migrar, hay que decidir explícitamente cómo se resuelve esto en Astro (opciones: sección real con `id="empresas"` que se muestra siempre en la página con `scroll-margin-top`, o mantener el patrón de toggle con JS mínimo). Lo trato como pendiente de decisión de producto, no lo resuelvo unilateralmente en el inventario.

---

## 2. Arquitectura compartida entre las 6 páginas

Todas las páginas repiten el mismo nav/menú móvil/footer con la misma lógica, reimplementada 6 veces en el HTML fuente. En Astro esto es **un solo componente cada uno**, no seis copias.

### 2.1 Header / Nav (`Header.astro` o `Nav.astro`)
- Logo, links desktop, 2 dropdowns ("Conócenos", "Educación") — **el dropdown desktop es CSS puro `:hover`**, sin JS, en las 6 páginas (`[data-dd]:hover [data-ddmenu]`).
- CTA "Sé voluntario" (WhatsApp).
- Botón hamburguesa.

### 2.2 Menú móvil (dentro de Nav o componente propio `MobileMenu.astro`)
- Panel overlay full-screen + 2 submenús acordeón ("Conócenos", "Educación").

### 2.3 Footer (`Footer.astro`)
- Logo + 4 columnas de links + redes sociales + copyright. Contenido casi idéntico en las 6 páginas (revisar diffs menores por página al construir).

### 2.4 Comportamientos JS compartidos (deben ir en módulos reutilizables, cada instancia con su propio root, no un solo `document.querySelector` global)

| Comportamiento | Qué hace | Disparador real | Presente en |
|---|---|---|---|
| **burger-menu** | Abre/cierra panel móvil, anima ícono a X | `click` en `[data-burger]` | Las 6 páginas |
| **mobile-submenu-accordion** | Expande/colapsa submenú dentro del menú móvil (`max-height`), cierra los demás al abrir uno | `click` en `[data-msub-btn]` | Las 6 páginas |
| **nav-scroll-shrink** | Cambia fondo/blur del `<nav>` al hacer scroll | `scroll` window, `scrollY > 60` | Las 6 páginas |
| **scroll-to-top** | Botón flotante, aparece y hace scroll suave al tope | `scroll` window (umbral varía: 480/500/600/900 según página — **inconsistencia del original**, unificar) | Las 6 páginas |
| **reveal-on-scroll** | Fade + translate al entrar en viewport, vía `data-reveal`/`data-delay` | `IntersectionObserver` (threshold 0.08–0.15 según página) | index, sobre-nosotros, metodologia, equipo, programas (**no** en politica-privacidad — no tiene ningún `data-reveal`) |
| **count-up** | Anima números 0→valor con `requestAnimationFrame` | `IntersectionObserver` sobre `[data-count]`/`[data-statnum]` | index (hero + impacto), sobre-nosotros (impacto), metodologia (stat cards) |
| **scroll-to-anchor-on-load** | Si la URL trae `#hash` al cargar, hace scroll con reintentos escalonados (la página se monta progresivamente) | `componentDidMount`, chequeo de `location.hash` | index, sobre-nosotros (confirmado explícitamente; verificar al construir si aplica igual en las demás) |

⚠️ **`dropdown-nav` desktop NO es un comportamiento JS** — es CSS `:hover` puro en las 6 páginas. No crear un módulo para esto.

### 2.5 Anti-patrón a NO migrar: `applyResponsive()`

Las 6 páginas tienen su propia función gigante (200–450 líneas cada una) que reimplementa breakpoints a mano: cambia `display`, `gridTemplateColumns`, tamaños de fuente y hasta reordena nodos del DOM (`insertAdjacentElement`) según `window.innerWidth`, disparada en `resize`. Esto es exactamente el patrón que la migración debe evitar — en Astro esto se resuelve con **CSS real** (media queries, `clamp()`, grid responsive) dentro del `<style>` con scope de cada componente. No se porta como JS. Se documenta aquí solo para que quede registro de qué comportamiento visual reemplaza cada media query al construir cada componente.

---

## 3. Inventario por página

### 3.1 `index.html` → `/` (10 162 líneas fuente)

**a) Secciones (orden DOM):**

| id | Contenido | Línea |
|---|---|---|
| `#inicio` (hero) | H1, subcopy, 2 CTAs, franja "una década transformando...", 4 contadores, imagen + 2 tarjetas flotantes | 1194 |
| `#aliados` (dentro de `#inicio`) | Marquee infinito de 20 logos | 1709 |
| `#destacados` | Grid/carrusel de 4 tarjetas-link | 1778 |
| `#ecosistema` | Bento grid de 6 tarjetas (100% CSS en desktop) | 2514 |
| `#metodologia` (versión home, 4 pasos) | Stepper desktop / acordeón móvil con scroll-sync | 4047 |
| `#impacto` | 6 métricas con count-up | 5372 |
| `#espacios` | Checklist animado + mosaico con lightbox móvil | 6010 |
| `#testimonios` | Scroll vertical infinito de tarjetas | 6778 |
| `#eventos` | Carrusel de 4 tarjetas | 7821 |
| `#contacto` | Redes + formulario (envío simulado, sin backend) | 8386 |

**b) Animaciones propias (más allá de las compartidas en §2):**
- `clapGrad`/`clapFloatA-C`/`clapRing`/`clapUp`/`clapBob`: loops CSS puros al load, sin JS, en hero/impacto/contacto.
- `fadeInUp`/`bounceInLeft`/`bounceInRight`: disparadas por `IntersectionObserver` en `setupEspacios()` (9648), específico de `#espacios`, no confundir con el `reveal-on-scroll` genérico.
- `clapMarq`: marquee de aliados, loop CSS puro.
- **Bug detectado (documentar, no heredar):** la pausa en hover del scroll de testimonios apunta a `[data-testitrack]` (CSS línea 325) pero el elemento real usa `data-testimscroll` (línea 6933) — el selector no coincide, la pausa nunca se activa.

**c) Comportamientos JS propios de esta página:**
- `carousel-destacados`: autoplay 4500ms, dots, flechas, drag en desktop, pausa 8s tras interacción.
- `carousel-eventos`: mismo patrón, instancia independiente, con loop al final.
- `metodologia-stepper-home`: **distinto del stepper de `/metodologia`** — 4 pasos, hover+click en desktop, acordeón con scroll-sync + auto-scroll suave en móvil.
- `lightbox-espacios`: solo activo si `window.innerWidth < 1100`; navegación prev/next, cierre por click-fuera/Escape/flechas.
- `checklist-hub-creativo`: anima ticks secuenciales + barra de progreso al entrar en viewport (`IntersectionObserver`, threshold 0.5).
- `form-contacto`: `preventDefault()` + toggle de estado local `sent`. **No hay envío real a ningún backend/API.**
- `ecosistema-hover`: reducido a solo `box-shadow` en hover; el propio código fuente indica que el layout ya es 100% CSS (`setupEcoStack()` desactivado).

**d) data-* propios relevantes:** `data-destgrid/-arrow/-dot`, `data-eventgrid/-arrow/-dot`, `data-metroot/-item/-panel/-stage` (versión home), `data-espimg/-esplightbox/-esplb-*`, `data-hubchecklist/-row/-bar/-tick`, `data-count/-prefix/-suffix`, `data-testimscroll`.

**e) Código muerto detectado (no migrar):** `MET_INTERVAL = 5000` definida y nunca usada; `scrollVertical`, `clapShine`, `clapPulse` (keyframes sin ningún uso); `componentWillUnmount` no limpia todos los timers/observers (fuga menor, irrelevante para SPA de una sola carga pero documentado).

---

### 3.2 `sobre-nosotros.html` → `/sobre-nosotros` (1610 líneas)

**a) Secciones:** `#que-es` (hero) → `#expertise` (6 tarjetas) → `#circulo` (diagrama 3 anillos) → `#valores` (4 valores en cruz) → `#impacto` (6 métricas) → `#filosofia` (triángulo 4 nodos) → `#historia` (timeline 2015–2026) → modal de video → footer.

**b) Animaciones propias:** `circBurst` (efecto de partícula al llegar al 3er anillo del círculo, dispara `setCirc()` cuando `i===2`); `circHintFloat` (loop CSS, pero su opacidad la controla JS al primer click); resto de keyframes (`clapGrad`, `clapFloatA-C`, etc.) compartidos visualmente con index.html pero con nombres iguales aquí (mismo prefijo `clap*`, sí reutilizables tal cual).

**c) Comportamientos JS propios:**
- `video-modal`: lightbox YouTube, abre por CTA, cierra por botón/overlay/`Escape`.
- `circulo-dorado-interactivo`: 3 anillos, hover+click, auto-tour de 700/1350/1350ms vía `IntersectionObserver` + `setTimeout` en cadena, se cancela al primer interactivo real del usuario.
- `triangulo-filosofal-interactivo`: 4 nodos, click/hover, secuencia de intro animada (revela nodos uno a uno) y re-animación del header cada vez que entra/sale del viewport.
- `historia-timeline`: rail de años, click/hover, auto-tour (recorre todos los años, 1250ms c/u), checklist progresivo por año con `setTimeout` escalonado.
- `valores-grid-interactivo`: hover highlight en desktop, tarjeta móvil con auto-tour vía `setInterval` (una sola vez por visita).

**d) data-* propios:** `data-circgrid/-ring/-item/-q/-a`, `data-trinode/-tripanel/-trihead`, `data-yearbtn/-panel/-dot/-bar/-histcheck`, `data-valcell/-vallabel/-valcard`, `data-videocta/-videomodal`.

**e) Notas:** `data-herogrid`/`data-misiongrid` se referencian en `applyResponsive()` pero no existen en el markup de esta página (código heredado sin efecto).

---

### 3.3 `metodologia.html` → `/metodologia` (1048 líneas)

**a) Secciones:** hero → "Importancia" (2 stat cards + imagen con efecto wipe) → `#fases` (**stepper de 4 fases: Explorar/Crear/Actuar/Resolver**) → `#competencias` (diagrama "orbit" radial, 4 nodos) → CTA final → footer → modal de diagrama.

**b) Animaciones propias:** `metFloat`/`metPulse` (loops CSS puros); transiciones en `[data-phasetab]`/`[data-compnode]` disparadas por JS. `metFadeUp`/`metSpin` definidas y **sin ningún uso** — no migrar.

**c) Comportamientos JS propios:**
- `fases-stepper`: click detiene auto-avance + cambia fase; hover (solo desktop ≥1100px) previsualiza sin detener; auto-avance **solo en móvil**, es una cadena de `setTimeout` (no `setInterval`) que recorre las 4 fases una vez y para.
- `competencias-orbit`: hover/click detiene auto-cycle; auto-cycle único vía `setInterval` cada 1400ms que da una vuelta completa y se detiene solo.
- `diagram-pill-hover`: popup en hover sobre el nodo central "Liderar".
- `img-wipe-reveal`: efecto cortina sobre la imagen de "Importancia" al entrar en viewport.
- `stat-cards-count`: variante de count-up para las 2 tarjetas de esta sección.

**d) data-* propios:** `data-phasetab/-panel/-icon/-num`, `data-compnode/-card/-accent`, `data-orbitcenter`, `data-imgwipe`, `data-statcard/-statnum`.

**e) Código huérfano detectado (no migrar tal cual):** `openDiagram()` y `setDiagramBtn` existen en el script pero **ningún elemento del markup los invoca** — solo el cierre del modal está cableado. Si el modal de diagrama es una feature deseada, hay que decidir con el cliente qué la debe abrir (probablemente el nodo central del orbit, a confirmar).

---

### 3.4 `equipo.html` → `/equipo` (804 líneas)

**a) Secciones:** hero → Equipo Directivo (9 tarjetas flip) → Equipos por área (7 tabs, solo "Marca y Comunicaciones" tiene miembros reales cargados) → footer.

**b) Animaciones propias:** flip 3D vía `transform:rotateY()` con `transition .7s cubic-bezier`, `perspective`, `backface-visibility:hidden`; en desktop también hay un `:hover` CSS puro que voltea la tarjeta si no está "fijada" por click (`data-locked`).

**c) Comportamientos JS propios:**
- `flip-card-equipo`: click voltea la tarjeta (ignora clicks en `<a>` o en el `<image-slot>`); `syncAvatar()` copia la imagen del frente al círculo del reverso leyendo el `shadowRoot` del `<image-slot>` (o su atributo `src` si no hay shadowRoot), reintentado a los 400/1000/2200ms para dar tiempo a que la imagen se resuelva.
- `area-tabs`: 7 tabs, click cambia panel visible, área activa por defecto = índice 3.

**d) data-* propios:** `data-flipcard/-flipinner/-locked/-backavatar`, `data-areatab/-areapanel/-ac`.

**e) Contenido faltante — fotos de equipo sin `src` (crítico para checkpoint de esta página):**
`dir-ivonne`, `dir-jorge`, `dir-mariapaz`, `dir-diana` (equipo directivo) y `mk-laura`, `mk-liam`, `mk-juancamilo` (Marca y Comunicaciones) — 7 personas sin foto asignada, y ningún asset de reserva en `assets/` con esos nombres (confirmado contra el listado completo de 66 archivos).
Caso especial: **Elba Méndez** usa un `<div style="background:url(...)">` en vez de `<image-slot>` — al no ser `<image-slot>`, el mecanismo `syncAvatar()` no la detecta, por lo que su foto en el reverso de la tarjeta probablemente no se sincroniza en el original. A resolver al construir (trivial en Astro: ambas caras usan la misma fuente de imagen).

---

### 3.5 `programas.html` → `/programas` (2414 líneas — la segunda más grande)

**a) Secciones:** hero (con toggle personas/empresas + countdown) → `#rutas` (tabs 3 programas) → CTA empresas → "Así aprenderás" → "Qué desarrollarás" → "Información del programa" → Pricing → "Por qué CLAP" → "Dirigido a" → Metodología (stepper 4 fases, **instancia propia**, distinta de `/metodologia`) → CTA final — todo esto es el track "personas"; el track "empresas" (oculto por defecto) contiene `#empresas-circulo` y `#empresas-laboratorio` → footer.

**b) Animaciones propias:** `peMarq` (marquee aliados), `peGrad`/`peFloatA-C`/`peDrift1-3` (loops CSS); `peHeroIn`/`peHeroInRight` (entrada del hero al load, sin IO). `peSpin`/`peBob` definidas y sin uso — no migrar. **No hay carrusel de testimonios ni slider tradicional** en esta página — lo más parecido es el marquee de aliados (loop CSS, sin controles).

**c) Comportamientos JS propios:**
- `track-switch` (personas ↔ empresas): botones `data-go`, oculta/muestra wrappers, resetea animaciones `data-reveal` del destino, scroll a tope. Es quien resuelve (parcialmente) el anchor virtual `#empresas` (ver nota crítica §1).
- `program-tabs-rutas`: 3 tabs, click + hover-preview (desktop), en móvil el click puede colapsar (acordeón), reveal escalonado de ítems internos.
- `program-tabs-empresas` (`#eprogtab`): duplicado del anterior para el track empresas.
- `circulo-toggle`: alterna entre vista "beneficios/costos" y vista "programas" dentro de `#empresas-circulo` — **el botón que lo dispara no se encontró en el markup analizado** (posible elemento faltante o selector distinto).
- `fases-stepper` (instancia propia de esta página, mismo patrón que en `/metodologia` pero código duplicado, no compartido).
- `countdown`: fecha objetivo hardcodeada (`2026-08-01T23:59:59-05:00`), animación de "roll-up" inicial + luego `setInterval` real cada 1000ms.
- `manifiesto-collapse`: colapsable "ver más/ver menos", solo visible en `<560px`.
- `sticky-cta` (móvil): lógica existe (`setupSticky()`) pero **el elemento `[data-stickycta]` no se encontró en el markup** — feature no renderizada en esta página o pendiente.

**d) data-* propios:** `data-track/-trackbtn/-go/-herovar`, `data-cd/-countdown`, `data-progtab/-panel` (×2 sets, personas/empresas), `data-phasetab/-panel` (instancia propia), `data-manifcollapse/-maniftoggle`.

**e) Código huérfano detectado:** `setupMet()`/`setMet()` referencian `data-mettab`/`data-metpanel`, atributos que **no existen en ningún lugar del HTML de esta página** — código copiado de otra plantilla, sin efecto, no migrar. Inconsistencia de datos: dos números de WhatsApp distintos usados en la página (`573114481160` vs `3114481160`) — señalar al cliente para unificar el copy.

---

### 3.6 `politica-privacidad.html` → `/politica-privacidad` (425 líneas)

**a) Secciones:** hero (título + fecha de vigencia) → cuerpo legal (definiciones + 17 apartados numerados en romano, con 4 sub-apartados dentro del XV) → footer → botón volver arriba.

**b) Animaciones:** **ningún `@keyframes` en todo el archivo.** Solo transiciones CSS estándar en nav/menú/botones (compartidas, ver §2).

**c) Comportamientos JS:** únicamente los compartidos de §2 (burger-menu, submenu-accordion, nav-scroll-shrink, scroll-to-top, layout responsive). **No hay `reveal-on-scroll`** en esta página — el cuerpo legal no tiene ninguna animación de entrada.
⚠️ Se detectó una duplicación de declaración de `setMenu`/`toggleMenu`/`closeMenu` como class fields (una versión simple sobrescrita por la real) — código muerto del original, no replicar el patrón.

**d) data-*:** solo los compartidos de nav/footer/scroll-to-top.

**e) Nota de estructura:** ningún elemento del documento tiene `id` real (ni siquiera los 17 apartados) — para dar navegación interna (índice de contenidos, o separar visualmente "Política de privacidad" de "Tratamiento de datos", hoy apuntan al mismo link en el footer) habrá que **asignar ids nuevos** a cada `<h2>`/`<h3>` al construir esta página; no es una omisión del inventario, es contenido a decidir en la migración.

---

## 4. Catálogo de módulos de comportamiento (`src/scripts/*.ts`)

Un módulo por comportamiento, cada uno recibe su elemento raíz como parámetro (nunca `document.querySelector` compartido entre comportamientos no relacionados), instanciado desde el `<script>` del componente `.astro` que lo necesita:

| Módulo | Usado por componentes |
|---|---|
| `burger-menu.ts` | `Nav.astro` (todas las páginas) |
| `mobile-submenu-accordion.ts` | `Nav.astro` / `MobileMenu.astro` |
| `nav-scroll-shrink.ts` | `Nav.astro` |
| `scroll-to-top.ts` | `Footer.astro` o componente propio `ToTopButton.astro` |
| `reveal.ts` | Cualquier sección con `data-reveal` (5 de 6 páginas) |
| `count-up.ts` | `Hero.astro`/`Impacto.astro` (index, sobre-nosotros), `Importancia.astro` (metodologia) |
| `scroll-to-anchor-on-load.ts` | `BaseLayout.astro` (comportamiento de navegación, no de una sección) |
| `carousel.ts` (genérico, parametrizable) | `Destacados.astro`, `Eventos.astro` (index) |
| `lightbox.ts` | `Espacios.astro` (index) |
| `video-modal.ts` | `sobre-nosotros` (historia/impacto) |
| `checklist-progress.ts` | `Espacios.astro` (index, checklist Hub Creativo) |
| `contact-form.ts` | `Contacto.astro` (index) — **nota: reimplementar como envío real o mockeado explícitamente, el original no envía a ningún backend** |
| `home-methodology-stepper.ts` | sección `#metodologia` de index (distinta del stepper de `/metodologia`) |
| `methodology-phase-stepper.ts` | `/metodologia` (`#fases`) — **evaluar si se reutiliza también en `/programas`** dado que es el mismo patrón (tabs con auto-avance), para no duplicar código entre 2 páginas |
| `competencias-orbit.ts` | `/metodologia` (`#competencias`) |
| `flip-card.ts` | `/equipo` (directorio) |
| `area-tabs.ts` | `/equipo` (equipos por área) |
| `circulo-dorado.ts` | `/sobre-nosotros` |
| `triangulo-filosofal.ts` | `/sobre-nosotros` |
| `historia-timeline.ts` | `/sobre-nosotros` |
| `valores-grid.ts` | `/sobre-nosotros` |
| `track-switch.ts` | `/programas` (personas/empresas) |
| `program-tabs.ts` (genérico, parametrizable) | `/programas` (rutas + empresas, 2 instancias) |
| `countdown.ts` | `/programas` |
| `manifiesto-collapse.ts` | `/programas` |

**Nota de diseño:** varios patrones (`fases-stepper` en metodologia/programas, `program-tabs` con 2 instancias, `carousel` en destacados/eventos) comparten la misma lógica de "tabs con click+hover+auto-avance opcional". Construiré un módulo genérico y parametrizable para cada patrón repetido en vez de 2-3 copias del mismo código — se decide en el checkpoint correspondiente, no cambia el inventario.

---

## 5. Consolidación de animaciones (keyframes duplicados por página)

Los prefijos (`clap*` en index/sobre-nosotros, `met*` en metodologia, `eq*` en equipo, `pe*` en programas) son la misma paleta de efectos reinventada por página. Propuesta de unificación en `global.css`:

| Efecto | Nombres originales | Nombre unificado propuesto |
|---|---|---|
| Fondo degradado en movimiento | `clapGrad`, `peGrad` | `--anim-gradient-shift` |
| Blobs flotantes decorativos | `clapFloatA/B/C`, `metFloat`, `eqFloatA/B`, `peFloatA/B/C`, `peDrift1/2/3`, `circDriftA/B/C` | `--anim-float` (con variantes de duración/delay vía CSS custom properties, no keyframes distintos) |
| Anillos pulsantes | `clapRing`, `peRing` | `--anim-ring-pulse` |
| Entrada al cargar (fade+up) | `clapUp`, `clapFadeInUp`, `metFadeUp` (sin uso), `eqFadeUp`, `peHeroIn`, `fadeInUp` | `--anim-fade-up-in` |
| Punto/badge pulsante | `clapPulse` (sin uso en index), `metPulse`, `pePulse`, `circPulse` | `--anim-pulse-dot` |
| Marquee horizontal infinito | `clapMarq`, `peMarq` | `--anim-marquee` |
| Bounce lateral (espacios) | `bounceInLeft`, `bounceInRight` | mantener como variante de `--anim-fade-up-in` con eje horizontal |
| Spin | `clapSpin`, `clapSpinR`, `metSpin` (sin uso), `peSpin` (sin uso) | verificar uso real antes de migrar — varias instancias están muertas |

Keyframes confirmados **sin ningún uso** en el HTML fuente (no migrar): `metFadeUp`, `metSpin`, `peSpin`, `peBob`, `scrollVertical`, `clapShine`, `clapPulse` (en index.html específicamente).

---

## 6. Contenido faltante / preguntas para el cliente — RESUELTO (decisiones del 2026-07-09)

1. **7 fotos de equipo faltantes** (equipo.html, ver §3.4) → **usar placeholder genérico**, no inventar contenido real. Pendiente: reemplazar cuando el cliente entregue las fotos.
2. **Caso Elba Méndez** (sync roto en el original) → se corrige naturalmente al construir `/equipo` (ambas caras de la tarjeta usan la misma fuente de imagen).
3. **`circulo-toggle` y `sticky-cta` móvil en `programas.html`** → **no existen en el sitio aprobado actual — descartar, no implementar.** Si se necesitan a futuro, se evalúan como feature nueva fuera de esta migración.
4. **Modal de diagrama en `metodologia.html` sin disparador** → es HTML/JS muerto en el original (sin trigger). **No migrar, no inventar un disparador.**
5. **`#empresas` en `programas.html`** → confirmado: **no es un anchor de scroll**, es un toggle de estado (tab "personas" vs "empresas"). Se implementa como estado local del componente (ej. `data-active-tab`), **sin usar la URL/fragmentos de ruta** para este propósito.
6. **Dos números de WhatsApp distintos en `programas.html`** → **dejar cada uno exactamente como en el original**, sin unificar ni corregir.
7. **Footer de política de privacidad** (dos textos → mismo documento) → **mantener ambos apuntando al mismo documento**, sin cambios.
8. **`t1-t6.jpg` de testimonios** → **usar como placeholder por ahora**; el cliente confirma después si son definitivas.
9. **Fuentes** → **self-hostear todas**, incluyendo Montserrat (antes vía Google Fonts). Antes de descargar, se listaron los pesos realmente usados en el CSS original (ver §9.9) y solo se descargó ese subconjunto, no la familia completa.

---

## 7. SEO — estado de partida

Confirmado en las 6 páginas: **cero** `<title>`, **cero** `<meta name="description">`, cero Open Graph, cero canonical, cero JSON-LD. Todo se construye desde cero según lo pedido (título/descripción únicos por página, OG + Twitter Card vía props del layout, JSON-LD Organization en el layout base + BreadcrumbList en interiores, sitemap y robots.txt). El copy de cada hero (ya inventariado arriba) es la base de contenido para redactar cada meta description.

---

## 8. Assets a copiar a `public/`

- `assets/` → 66 archivos (imágenes), todas referenciadas existen físicamente, cero rutas rotas detectadas en las 6 páginas.
- `fonts/` → 9 archivos: Proxima Nova (6 pesos, woff2), Neulis (2 pesos, otf), Sinete (1 peso, otf). Se preservará `font-display: swap` y se añadirá `<link rel="preload">` para las fuentes críticas (probablemente Proxima Nova Regular/Semibold, usadas en body text) en `BaseLayout.astro`.
- Google Fonts (Montserrat 300–800) vía `<link>` — evaluar si se auto-hostea con `@font-face` local igual que las demás, para evitar dependencia externa y mejorar performance (decisión a confirmar, no bloqueante).

---

## 9. Entorno confirmado

- Node activo vía nvm: **v24.16.0**, npm 11.13.0.
- Proyecto Astro escafoldado en `~/Escritorio/migracion/clap-web` (`npm create astro@latest`, plantilla `minimal`, Astro v7.0.7, TypeScript).
- Git inicializado, commit inicial de scaffold ya realizado (`chore: scaffold Astro project (minimal template)`).

### 9.9 Pesos de Montserrat realmente usados (self-hosted)

Verificado por grep contra los 6 `.html` fuente, distinguiendo cada `font-weight` del `font-family` que lo acompaña (Proxima Nova/Neulis/Sinete tienen sus propios pesos vía `@font-face`, no cuentan aquí):

- **Usados**: 400, 500, 600, 700, 800 (este último confirmado por herencia en `metodologia.html:131`, `<strong>` sin `font-family` propio dentro de un párrafo con Montserrat por defecto).
- **NO usado** pese a estar en el `<link>` de Google Fonts del original: 300 (todo `font-weight:300` real encontrado pertenece a Proxima Nova Light, Neulis Light o Sinete, nunca a Montserrat) y 900.
- **Sin cursiva** en ningún lugar del sitio (`grep italic` → 0 resultados).
- Google Fonts, al pedir varios pesos de una variable font vía `css2?family=Montserrat:wght@400;500;600;700;800`, sirve el **mismo archivo woff2 variable** para los 5 pesos (confirmado: 5 URLs únicas devueltas por el endpoint corresponden a subsets de idioma — cyrillic/vietnamese/latin-ext/latin —, no a pesos). Se descargó solo el subset **latin** (suficiente para español, cubre tildes/ñ/¿¡ en el rango U+0000-00FF) como un único archivo: `public/fonts/Montserrat-Variable.woff2`, declarado con `font-weight: 400 800` (rango variable) en `global.css`.

---

## Checkpoint 1 — BaseLayout + Nav + Footer (completado 2026-07-09)

Ver tabla de verificación de animaciones/comportamientos y resultado de comandos en el resumen entregado al usuario en el chat. Resumen de archivos creados: `src/styles/global.css`, `src/scripts/{burger-menu,mobile-submenu-accordion,nav-scroll-shrink,scroll-to-top,scroll-to-anchor-on-load}.ts`, `src/components/layout/{Header,MobileMenu,Footer,ToTopButton}.astro`, `src/layouts/BaseLayout.astro`, `astro.config.mjs` (site + @astrojs/sitemap), `public/robots.txt`.

### Nota de dominio pendiente de confirmar

`astro.config.mjs` usa `site: 'https://clapedu.org'` para generar canonical/OG/sitemap — inferido del copyright y el email de contacto del sitio original (`clapedu.org`), no confirmado explícitamente por el cliente. Avisar si el dominio final es otro.

### Nota de imagen social pendiente

No existe en el material fuente una imagen social 1200×630 diseñada para Open Graph/Twitter Card. Por ahora `ogImage` usa el logo (`public/social-preview-fallback.png`, 150×57, se ve mal en la vista previa de redes) como placeholder funcional. Reemplazar con un asset real cuando exista.

---

---

## Checkpoint 2a — Hero de `/` (completado 2026-07-09)

Archivos: `src/components/sections/Hero.astro`, `src/scripts/count-up.ts`.

| Comportamiento/animación | Disparador | Implementado en |
|---|---|---|
| Gradiente de fondo en movimiento | `load`, loop CSS infinito (16s) | `Hero.astro` `.hero` → `clap-gradient-shift` |
| 3 blobs decorativos flotando | `load`, loop CSS infinito | `Hero.astro` `.blob--a/b/c` → `clap-float-a/b/c` |
| 3 anillos expansivos concéntricos | `load`, loop CSS infinito, delays escalonados 0/2.3s/4.6s | `Hero.astro` `.ring` → `clap-ring-pulse` |
| Entrada del H1/subcopy/CTAs/stats | `load`, CSS puro con `animation-delay` escalonado (no IntersectionObserver — el hero siempre es visible al cargar) | `Hero.astro` → `clap-fade-up-in` |
| 2 tarjetas flotantes con "bob" | `load`, loop CSS infinito | `Hero.astro` `.hero-float--left/right` → `clap-bob` |
| Contador animado (4 métricas) | `IntersectionObserver` threshold 0.4, 1500ms ease-out cúbico, formato `de-DE` | `src/scripts/count-up.ts`, invocado desde `Hero.astro` |

**Verificaciones:** `grep style="` → 0 ocurrencias · `astro check` → 0 errores/warnings/hints · `npm run build` → OK (imagen del hero optimizada automáticamente de 571kB a 34kB webp vía `astro:assets`).

---

---

## Checkpoint 2b — Aliados (completado 2026-07-09)

Archivo: `src/components/sections/Aliados.astro`.

| Animación | Disparador | Implementado en |
|---|---|---|
| Marquee horizontal infinito (18 aliados) | `load`, loop CSS infinito (34s linear) | `Aliados.astro` → `clap-marquee` |

Nota de arquitectura: en el original `#aliados` es un `<div>` anidado dentro de la `<section id="inicio">`, compartiendo directamente el fondo degradado animado del Hero. Como en Astro es un componente hermano independiente (no anidado), `Aliados.astro` reproduce el mismo `background` + `clap-gradient-shift` para mantener la continuidad visual — ambos corren la misma animación de 16s sincronizada porque arrancan en el mismo `load`. El scrim oscuro (`rgba(12,10,26,.22)` + blur) y el `mask-image` de los bordes se separaron en dos elementos anidados (`.aliados-scrim` / `.aliados-mask`) para que la máscara no recorte también el scrim, tal como en el original.

**Verificaciones:** `grep style="` → 0 · `astro check` → 0/0/0 · `npm run build` → OK.

---

---

## Checkpoint 2c — Destacados (completado 2026-07-09)

Archivos: `src/components/sections/Destacados.astro`, `src/scripts/carousel.ts` (genérico, reutilizable también para Eventos).

| Comportamiento/animación | Disparador | Implementado en |
|---|---|---|
| Grilla estática 2 columnas (tablet/desktop) → carrusel horizontal con drag + autoplay (móvil <768px) | `matchMedia` en `carousel.ts`; layout base vía `@media` en `Destacados.astro` | `carousel.ts` + `Destacados.astro` |
| Autoplay del carrusel móvil, pausa 8s tras interacción | `setInterval` 4500ms, solo si `active` (móvil) | `carousel.ts` |
| Swap de imagen desktop/móvil en tarjetas Escuela/Hackatón | antes JS (`data-banimg`) → ahora **CSS puro** `@media (max-width: 1099.98px)` | `Destacados.astro` |
| Título oculto en móvil en tarjetas Escuela/Hackatón | antes JS (`data-hide-mobile`) → ahora **CSS puro** `@media (max-width: 767.98px)` | `Destacados.astro` |

Nota de arquitectura: `carousel.ts` es el primer módulo **genérico y parametrizable** del catálogo (§4) — usa atributos `data-carousel-*` locales al `root` que recibe, no nombres específicos de página (`data-destgrid`/`data-eventgrid` del original). Eventos (Checkpoint 2h) reutilizará este mismo módulo sin duplicar lógica.

**Verificaciones:** `grep style="` → 0 · `astro check` → 0/0/0 · `npm run build` → OK (imagen `eco-programas.webp` optimizada de 548kB a 22kB).

---

---

## Corrección al Checkpoint 2c (Destacados) — reveal.ts faltante

Al construir Ecosistema detecté que en Destacados me había saltado el módulo `reveal.ts` (fade+translate al hacer scroll, `data-reveal` en el original). Verifiqué el algoritmo exacto en `index.html:9337` (`setupReveal()`): threshold 0.12, `rootMargin:-10%`, `.8s cubic-bezier(.2,.7,.2,1)`, y **se repite** (el elemento vuelve a ocultarse si sale del viewport, no es "una sola vez" como en otras páginas). Construí `src/scripts/reveal.ts` con esa réplica exacta y lo apliqué retroactivamente al bloque de intro de `Destacados.astro` (badge+h2 y el párrafo, que sí tenían `data-reveal` en el original).

Dato curioso confirmado en el mismo código fuente: **las tarjetas de Destacados y de Ecosistema NO tienen reveal** — el propio `setupReveal()` original les remueve el atributo `data-reveal` explícitamente antes de armar el observer (comentario en el código: *"Bento (Ecosistema) cards are driven by the join/separate effect, not the generic reveal"*). Así que mi Checkpoint 2c estaba bien en eso — dejé las tarjetas sin animación de entrada intencionalmente, coincide con el comportamiento real del sitio.

---

## Checkpoint 2d — Ecosistema (completado 2026-07-09)

Archivo: `src/components/sections/Ecosistema.astro`.

### Simplificación de arquitectura importante

El original renderiza el Ecosistema **dos veces**: un bloque `[data-bento]` (grid CSS, con la mitad de sus reglas literalmente muertas — ver abajo) y un bloque `[data-eco-desktop]` completo y duplicado (mismas 6 tarjetas, markup flexbox distinto), alternados por `display:none/block` vía media query. Es el mismo anti-patrón de "dos marcados para un componente" que este proyecto evita explícitamente. Construí **una sola lista de 6 tarjetas** y dejé que CSS Grid resuelva ambos layouts:
- Desktop/tablet (≥1100px): grid de 5 columnas, tarjeta 1 (Formación) con `grid-column:1/-1` (ancho completo, 300px alto) + fila de 5 tarjetas iguales (280px alto) — mismo resultado visual que el `[data-eco-desktop]` real.
- Mobile/tablet (<1100px): `position:sticky` con offsets escalonados por tarjeta (78/90/102/114/126/138px) — efecto de tarjetas apilándose al hacer scroll, 100% CSS, sin JS. Réplica exacta de la única regla `@media(max-width:1099px)` que sí está viva en el CSS original.

**Código muerto detectado y NO migrado:** el bloque de reglas `#ecosistema [data-bento]{display:grid;grid-template-columns:repeat(6,1fr)...}` (bento de 6 columnas "para desktop") en realidad nunca se aplica — está oculto por `display:none` a esa misma resolución por una regla posterior. Es un remanente de una iteración de diseño anterior al `[data-eco-desktop]` actual.

| Comportamiento/animación | Disparador | Implementado en |
|---|---|---|
| Reveal del intro (badge+h2+p) | `IntersectionObserver`, réplica exacta (ver arriba) | `reveal.ts` |
| Tarjetas apilándose al hacer scroll (mobile/tablet) | CSS puro `position:sticky`, sin JS | `Ecosistema.astro` `@media (max-width:1099.98px)` |
| Hover de flecha (bento → morado) | CSS `:hover` puro | `Ecosistema.astro` |

**Verificaciones:** `grep style="` → 0 (encontré y corregí 1 `style=""` residual que dejé sin querer en una tarjeta) · `astro check` → 0/0/0 · `npm run build` → OK. Ahorro de imagen notable: `hub-creativo-bg.png` 1519kB → 5kB, `urbit-lab-bg.png` 1355kB → 1kB.

---

---

## Corrección post-Checkpoint 2d — bugs de mobile en tarjetas (2026-07-09)

Reportado por el usuario: estilos mobile rotos en las tarjetas de Destacados y Ecosistema (tamaño/recorte, espaciado/superposición). Auditoría del CSS (sin poder ver el navegador) encontró dos bugs reales, ambos corregidos:

1. **Destacados** (`Destacados.astro`): las tarjetas "Escuela Santandereana" y "Hackatón" perdieron el `position: absolute; inset: 0;` en `.card-overlay--escuela`/`.card-overlay--hackaton` al portar el CSS — el overlay (badge + título) caía en flujo normal DEBAJO de la foto en vez de superpuesto sobre ella, inflando la altura de esas 2 tarjetas muy por encima de las otras 2 del mismo grid/carrusel. Corregido.
2. **Ecosistema** (`Ecosistema.astro`): la tarjeta grande "Formación" dependía de la "blockificación" automática que CSS Grid aplica a sus hijos (`<a>` es `inline` por defecto) — en desktop `.cards` es `display:grid` así que funcionaba por accidente, pero en mobile `.cards` pasa a `display:block` y la tarjeta grande volvía a comportarse como `inline`, rompiendo `min-height`, `position:sticky` y el efecto de apilado. Agregado `display:block` explícito a la regla base `.card` (las 5 tarjetas chicas ya lo tenían vía `display:flex` propio, por eso solo fallaba esta). También reduje el padding interno de esa tarjeta en `<768px` (52px por lado era demasiado en pantallas angostas).

Verificado de nuevo: `grep style="` → 0, `astro check` → 0/0/0, `npm run build` → OK.

---

---

## Checkpoint 2e — Metodología, versión home (completado 2026-07-09)

Archivos: `src/components/sections/MetodologiaHome.astro`, `src/scripts/home-methodology-stepper.ts`.

### Código muerto detectado y NO migrado

`metScrollSync()` y `centerMetItem()` (auto-abrir el acordeón móvil según posición de scroll + centrar con scroll suave al abrir) están **definidas en el script original pero nunca invocadas en ningún listener** — confirmado por grep, cero call-sites. El acordeón móvil real es un simple toggle por click (`toggleMetAcc`), sin scroll-sync. Implementé el comportamiento real, no el código muerto.

### Simplificación de arquitectura

El original mueve los paneles en el DOM con JS (`insertAdjacentElement`) para pasar de "grid con paneles superpuestos" (desktop) a "acordeón con panel justo debajo de su item" (mobile). Evité esa reescritura de DOM: cada paso es un `<div class="step-pair">` que contiene su item Y su panel juntos desde el marcado inicial; en desktop `display:contents` los deja participar directamente del CSS Grid (item → columna 1, los 4 paneles → misma celda columna 2 vía `grid-row:1/-1`, superpuestos); en mobile `.step-pair` vuelve a `display:block` y el orden natural del DOM (item seguido de su panel) ya es la estructura de acordeón correcta — cero JS moviendo nodos.

El color activo por paso (rosa/amarillo/verde/azul) lo resuelve CSS con selectores de atributo (`[data-step="0"].is-active`), no JS mutando `style.background`.

| Comportamiento | Disparador | Implementado en |
|---|---|---|
| Cambio de panel en desktop | `click` + `mouseenter` en el item | `home-methodology-stepper.ts` |
| Acordeón en mobile (un panel abierto a la vez) | `click` (toggle) | `home-methodology-stepper.ts` |
| Reveal del intro + CTA final | `IntersectionObserver` | `reveal.ts` |
| Blob decorativo flotando | load, loop CSS infinito | `MetodologiaHome.astro` |

**Verificaciones:** `grep style="` → 0 (corregí 1 `style=""` dinámico que se me coló en el color de barra del mini-grid del paso "Crear", ahora resuelto con clases `.mini-bar--teal/yellow/purple`) · `astro check` → 0/0/0 · `npm run build` → OK.

---

---

## Corrección post-Checkpoint 2e — bug real de CSS Grid en el stepper

Reportado por el usuario: la maquetación de Metodología no coincidía con el diseño (las animaciones sí funcionaban). Encontrado: el truco de "superponer los 4 paneles en la misma celda" usaba `grid-row: 1 / -1` sin que `.stepper` tuviera `grid-template-rows` declarado. Por spec de CSS Grid, `-1` se resuelve contra el **grid explícito**; sin `grid-template-rows`, el grid explícito no tiene filas, así que `-1` colapsaba a la misma línea que `1` — el navegador terminaba ubicando los 4 paneles solo en la fila 1 (junto al primer paso, "Explorar"), dejando las filas 2-4 (Crear/Actuar/Resolver) con la columna derecha completamente vacía. Esto explica exactamente el síntoma: la interacción (JS alternando `.is-active`) funcionaba, pero la posición estática de los paneles estaba rota.

Corregido: agregado `grid-template-rows: repeat(4, auto)` explícito a `.stepper`, y cambiado el panel a `grid-row: 1 / span 4` (evita además cualquier ambigüedad futura con líneas negativas). Verificado en el CSS compilado que el navegador ahora coloca los paneles correctamente (`grid-area:1/2/span 4`).

**Verificado de nuevo:** `grep style="` → 0, `astro check` → 0/0/0, `npm run build` → OK.

---

---

## Segunda corrección post-Checkpoint 2e — flexbox + reveal faltante

El primer fix (grid-template-rows) no resolvió del todo el problema reportado. Por pedido explícito del usuario, abandoné el truco de CSS Grid con superposición de paneles (ya había fallado dos veces) y volví a la estructura simple y probada, igual al mecanismo real del original:

- `.step-list` (flexbox columna, los 4 botones) y `.step-stage` (`position:relative`, los 4 paneles `position:absolute; inset:0` superpuestos) como **contenedores separados**, unidos por `.stepper { display:flex; gap:64px }` en vez de grid.
- En móvil, el acordeón necesita que cada panel esté físicamente junto a su item — como ya no comparten wrapper en el marcado, `home-methodology-stepper.ts` ahora reubica los paneles con `insertAdjacentElement` (idéntico mecanismo a `layoutMet()` del original), y los devuelve a `.step-stage` al volver a desktop.

También encontré la causa del segundo síntoma reportado ("la animación solo funciona en el título y botón de abajo"): se me había olvidado agregar `data-reveal="left"` / `data-reveal="right"` a la lista y al stage — nunca estuvieron en el marcado, así que `reveal.ts` no tenía nada que animar ahí. Agregado a `.step-list` y `.step-stage` respectivamente.

**Verificado:** `grep style="` → 0, `astro check` → 0/0/0, `npm run build` → OK, confirmé en el CSS compilado que `.stepper` usa `display:flex` y que `data-reveal="left"/"right"` están en el HTML servido.

---

---

## Checkpoint 2f — Impacto (completado 2026-07-09)

Archivo: `src/components/sections/Impacto.astro`. Reutiliza `reveal.ts` y `count-up.ts` (ya existentes, sin módulos nuevos).

| Comportamiento/animación | Disparador | Implementado en |
|---|---|---|
| Gradiente de fondo en movimiento + 2 blobs | load, loop CSS infinito | `Impacto.astro` (mismos keyframes que Hero) |
| Reveal del bloque izquierdo (título+CTA) | `IntersectionObserver` | `reveal.ts`, `data-reveal="left"` |
| Reveal escalonado de las 6 métricas (delay 40/120/200/280/360/440ms) | `IntersectionObserver` | `reveal.ts` |
| Contador animado en las 6 métricas | `IntersectionObserver` threshold 0.4 | `count-up.ts` |

**Verificaciones:** `grep style="` → 0 · `astro check` → 0/0/0 · `npm run build` → OK.

---

---

## Checkpoint 2g — Espacios (completado 2026-07-09)

Archivos: `src/components/sections/Espacios.astro`, `src/scripts/hub-checklist.ts`, `src/scripts/lightbox.ts`, `src/scripts/espacios-reveal.ts`.

### Simplificación en `espacios-reveal.ts`

El original selecciona las tarjetas del lado derecho con `rightDiv.querySelectorAll('div > div')`, un selector genérico que en la práctica atrapa 5 elementos (el wrapper del link "Explora" + el contenedor del mosaico + sus 3 celdas) contra un array de solo 4 direcciones de "bounce" — el 5º elemento se queda sin animación (`animation: undefined...`, inválido, ignorado silenciosamente). Es un efecto colateral de un selector demasiado genérico, no un diseño intencional. Implementé la versión limpia: 4 elementos reales (el link "Explora" + las 3 celdas del mosaico), cada uno con su propia dirección de bounce alternada — mismo efecto visual pretendido, sin el elemento huérfano.

`lightbox.ts` se escribió genérico (atributos `data-lightbox-*` sin prefijo de página) para poder reutilizarse en otras páginas que tengan galerías, no solo aquí.

| Comportamiento/animación | Disparador | Implementado en |
|---|---|---|
| Checklist: marca cada fila secuencialmente (350ms + 520ms c/u) + barra de progreso + badge "¡Completo!" | `IntersectionObserver` threshold 0.5, se repite al salir/entrar | `hub-checklist.ts` |
| Lightbox del mosaico (solo <1100px) | `click` en celda; navegación por botones + flechas de teclado + Escape | `lightbox.ts` |
| Entrada especial: texto izquierdo con fade+slide escalonado, mosaico con bounce alternado escalonado | `IntersectionObserver` threshold 0.2 | `espacios-reveal.ts` |

**Verificaciones:** `grep style="` → 0 · `astro check` → 0/0/0 · `npm run build` → OK (imágenes de sede optimizadas, ej. `sede-fachada.jpg` 190kB→26kB).

---

### Ajuste post-checkpoint: orden mobile (revisado dos veces)

Primer intento: `order:-1` en `.col-right` (fotos arriba de todo el bloque izquierdo). El usuario pidió algo más específico: **1)** título + texto "Trae tu equipo...", **2)** imágenes, **3)** checklist "Todo lo que incluye" + botón WhatsApp — el bloque izquierdo original tenía que partirse en dos.

Reestructuré el marcado: `.col-left` (un solo `<div>`) pasó a ser dos hermanos, `.col-left-top` (eyebrow+h2+p) y `.col-left-bottom` (checklist+WhatsApp), con `.col-right` (imágenes) entre ambos en el DOM. En desktop (`≥1100px`) los tres se ubican con `grid-column`/`grid-row` explícitos para que `.col-left-top`+`.col-left-bottom` sigan ocupando la columna 1 (uno arriba del otro, sin gap extra entre ellos — separé `column-gap`/`row-gap` para que no se sumara el gap de 56px que sí aplica entre columnas) y `.col-right` la columna 2 completa (`grid-row:1 / span 2`) — igual al diseño original. En `<1100px`, `order:1/2/3` en los tres bloques da el orden pedido, sin duplicar marcado ni tocar `espacios-reveal.ts` (que sigue encontrando `h2`/`p`/`.whatsapp-cta` y `.explore-link`/`.mosaic-cell` sin importar en qué contenedor estén).

De paso quité `data-reveal="left"/"right"` de estos contenedores — eran atributos muertos (Espacios usa su propio `espacios-reveal.ts`, nunca llamé a `attachReveal()` en esta sección; se me habían colado por copiar el patrón de otras secciones).

**Verificado:** `grep style="` → 0, `astro check` → 0/0/0, `npm run build` → OK, confirmado en el CSS compilado que `.col-left-top/.col-right/.col-left-bottom` tienen `order:1/2/3` respectivamente dentro del media query.

### Segunda corrección: `.col-right` no bajaba, quedaba al lado

El usuario reportó que las imágenes seguían apareciendo al lado del título en vez de debajo. Causa: `.col-right` tiene `grid-column:2` explícito en desktop (para ocupar la columna derecha completa), y se me olvidó resetearlo a `grid-column:1` dentro del media query mobile — solo reseteé `grid-row`. Con `grid-template-columns:1fr` (una sola columna) pero un hijo pidiendo explícitamente `grid-column:2`, el navegador crea una columna implícita adicional en vez de ignorar el valor, así que `.col-right` terminaba al lado, no debajo. Agregado `grid-column:1` explícito a los tres bloques dentro del media query. Confirmado en el CSS compilado (`grid-area:auto/1` en los tres, con `order:1/2/3`).

---

---

## Checkpoint 2h — Testimonios (completado 2026-07-09)

Archivo: `src/components/sections/Testimonios.astro`. Sin módulos JS nuevos — el scroll vertical infinito es **CSS puro** (`clap-scroll-vertical`, ya en `global.css` desde el Checkpoint 1).

### Nota: bug de pausa-en-hover del original, no heredado

El inventario (§3.1) ya había detectado que en el original la regla CSS de pausa al hacer hover (`[data-testitrack]:hover{animation-play-state:paused}`) apunta a un selector que no coincide con el elemento real (`data-testimscroll`) — la pausa nunca funcionó, el scroll es continuo e ininterrumpible incluso con el mouse encima. Implementé el comportamiento real (sin pausa), no el bug ni una pausa "arreglada" que el original nunca tuvo — cambiarlo sería inventar una feature nueva, no migrar la existente.

### Estructura

6 testimonios únicos, duplicados una vez (12 tarjetas totales) para el loop continuo — mismo patrón que el marquee de Aliados. El set duplicado lleva `aria-hidden="true"` (accesibilidad: un lector de pantalla no debería anunciar el mismo testimonio dos veces).

| Comportamiento | Disparador | Notas |
|---|---|---|
| Scroll vertical infinito (3/2/1 columnas según viewport) | load, loop CSS puro (28s linear) | Sin JS; responsive vía `@media` (antes resuelto por JS en `applyResponsive`) |

**Verificaciones:** `grep style="` → 0 · `astro check` → 0/0/0 · `npm run build` → OK.

---

---

## Checkpoint 2i — Eventos (completado 2026-07-09)

Archivo: `src/components/sections/Eventos.astro`. Reutiliza `carousel.ts` y `reveal.ts` existentes, sin módulos nuevos.

Nota de fidelidad verificada en el script original: a diferencia de Destacados (cuyas tarjetas están explícitamente excluidas del reveal genérico), las tarjetas de Eventos **sí** tienen `data-reveal` real en el original y **no** están en la lista de exclusión de `setupReveal()` — sí llevan fade-in escalonado (delay 0/80/160/240ms).

| Comportamiento | Disparador | Implementado en |
|---|---|---|
| Grilla estática 4/2 columnas (desktop/tablet) → carrusel con drag+autoplay (móvil) | `matchMedia` | `carousel.ts` (mismo módulo de Destacados) |
| Reveal escalonado de las 4 tarjetas | `IntersectionObserver` | `reveal.ts` |

**Verificaciones:** `grep style="` → 0 · `astro check` → 0/0/0 · `npm run build` → OK (imágenes de eventos optimizadas, ej. `event-networking.jpg` 105kB→10kB).

---

### Corrección post-checkpoint: overflow vertical accidental en carruseles mobile

Reportado por el usuario en Eventos: el carrusel permitía scroll vertical dentro de sí mismo, y las tarjetas no quedaban centradas al deslizar. Causa raíz: `.track` tenía `overflow-x: auto` sin `overflow-y` explícito — por la especificación CSS, cuando un eje de overflow no es `visible`, el otro eje (si estaba en `visible`, su valor inicial) se recalcula también como `auto`. Es decir, `overflow-y` quedaba implícitamente en `auto`, habilitando scroll vertical accidental apenas el contenido fuera un píxel más alto que el contenedor — típico en gestos táctiles donde un swipe horizontal se "escapa" verticalmente.

**El mismo bug estaba en Destacados** (copié el patrón de carrusel de ahí a Eventos). Corregido en ambos:
- `overflow-y: hidden` explícito (bloquea el scroll vertical accidental).
- `touch-action: pan-x` (le dice al navegador que este contenedor solo espera gestos horizontales, evita que capture swipes verticales).
- `scroll-snap-align: center` en vez de `start` (a pedido del usuario, las tarjetas quedan centradas en el viewport al deslizar, no pegadas al borde izquierdo — es una mejora de UX intencional sobre el original, no un error de fidelidad).

**Verificado:** `grep style="` → 0, `astro check` → 0/0/0, `npm run build` → OK. Confirmado en el CSS compilado: `overflow:auto hidden` y `scroll-snap-align:center` presentes en ambos carruseles.

---

### Segunda corrección: ancho de tarjeta y puntos rotos en Eventos

El usuario reportó que el slider seguía sin verse igual: puntos de paginación rotos y tarjetas "menos anchas" que el diseño original. Volví a `applyResponsive()` del original con más cuidado (línea 10058-10092) y encontré que **Eventos y Destacados usan configuraciones distintas en mobile, no la misma**:

| | Destacados (`destGrid`) | Eventos (`eventGrid`) |
|---|---|---|
| Ancho de tarjeta | `flex:0 0 85%` (con peek del siguiente) | `flex:0 0 100%; width:100%` (una tarjeta completa a la vez) |
| `scroll-snap-align` | `start` | `center` |
| `overflowY` explícito | **no lo setea** (bug real del original, no reproducido — ver abajo) | `hidden` (el original sí lo hace acá) |

Yo había copiado el patrón de Destacados (85% + `start`) para Eventos sin verificar que el original usa valores distintos — eso explica el "menos ancho". Y al haber forzado `scroll-snap-align:center` sobre un ancho de 85% (mezcla que el original nunca usa), el cálculo de índice de `carousel.ts` (`scrollLeft / cardWidth`) dejaba de coincidir con la posición real donde el navegador snapeaba la tarjeta — de ahí que los puntos no reflejaran la tarjeta visible. Con Eventos en 100% de ancho, centrar y alinear al inicio son visualmente equivalentes (la tarjeta ya ocupa todo el contenedor), así que el cálculo simple vuelve a coincidir.

Corregido: Eventos → `flex:0 0 100%; width:100%; scroll-snap-align:center` (igual al original). Destacados → revertido a `scroll-snap-align:start` (igual al original; el `center` fue un cambio de más que apliqué sin que correspondiera). El fix de `overflow-y:hidden`/`touch-action:pan-x` se mantiene en ambos — Eventos porque así es el original, Destacados porque es un bug real del original (nunca setea `overflowY`) que sí vale la pena corregir en la migración.

**Verificado:** `grep style="` → 0, `astro check` → 0/0/0, `npm run build` → OK. Confirmado en el CSS compilado: Destacados `flex:0 0 85%;scroll-snap-align:start`, Eventos `flex:0 0 100%;width:100%;scroll-snap-align:center`.

---

### Tercera corrección: puntos de paginación — bug estructural, no de cálculo

El ancho ya quedó bien, pero los puntos seguían sin funcionar. Causa real: en el marcado, `[data-carousel-dots]` estaba como **hermano** de `[data-carousel-root]`, no como hijo:

```
<div class="carousel" data-carousel-root>...track, flechas...</div>
<div class="dots" data-carousel-dots>...puntos...</div>   ← fuera del root
```

`attachCarousel(root)` recibe justo ese `[data-carousel-root]` como `root`, y busca los puntos con `root.querySelectorAll('[data-carousel-dot]')` — como los puntos vivían fuera de `root`, esa búsqueda siempre devolvía una lista vacía: nunca se les enganchaba el `click`, y `updateDots()` no tenía nada que actualizar. No era un problema del cálculo de índice (eso ya había quedado bien en la corrección anterior) sino que el módulo directamente nunca encontraba los botones.

**El mismo bug estaba en Destacados** (mismo marcado copiado) — sus puntos tampoco funcionaban, aunque no se había reportado. Corregido en ambos: `[data-carousel-dots]` ahora es el último hijo dentro de `[data-carousel-root]`, sin cambios de CSS (el contenedor ya usa flujo normal, no posicionamiento absoluto).

**Verificado:** `grep style="` → 0, `astro check` → 0/0/0, `npm run build` → OK, confirmado en el HTML servido que `data-carousel-dots` ahora anida dentro de `data-carousel-root` en ambas secciones.

---

---

## Checkpoint 2j — Contacto (completado 2026-07-09) — CIERRA EL CHECKPOINT 2 (home completa)

Archivos: `src/components/sections/Contacto.astro`, `src/scripts/contact-form.ts`.

| Comportamiento | Disparador | Notas |
|---|---|---|
| Toggle formulario → mensaje de confirmación | `submit` del form, `preventDefault()` | `contact-form.ts` |
| Reveal del intro (izq) y de la tarjeta del form (der) | `IntersectionObserver` | `reveal.ts` |
| Gradiente animado + blob | load, loop CSS | `Contacto.astro` |

### Pendiente de decisión — no es parte de esta migración

El formulario, igual que el original, **no envía a ningún backend real** — el submit solo alterna al estado "¡Gracias!" en el cliente. Si se quiere envío real (email, API propia, servicio tipo Formspree/Resend, etc.) hay que decidirlo explícitamente; no lo inventé por mi cuenta.

**Verificaciones:** `grep style="` → 0 · `astro check` → 0/0/0 · `npm run build` → OK.

### `index.astro` — página completa

Con Contacto, `index.astro` queda en **30 líneas** (bien por debajo del límite de 200-300 del hard rule #2) — es solo imports + lista de 10 componentes de sección. Las 10 secciones del home (Hero, Aliados, Destacados, Ecosistema, Metodología, Impacto, Espacios, Testimonios, Eventos, Contacto) están completas y confirmadas.

---

---

## Corrección antes de Checkpoint 3 — highlight de nav activo faltante

Al empezar `/sobre-nosotros` detecté que el Header compartido (Checkpoint 1) nunca implementó el resaltado en teal del trigger del dropdown ("Conócenos"/"Educación") cuando estás en una página de ese grupo — presente en el original en sobre-nosotros.html y equipo.html ("Conócenos") y programas.html ("Educación"), mezclado con una inconsistencia real: metodologia.html NO lo resalta pese a estar bajo el mismo dropdown (así es el sitio original, no la corregí). Agregué la prop `activeDropdown` a `Header.astro`/`BaseLayout.astro` (`"conocenos" | "educacion" | undefined`), cada página la pasa según corresponda.

**Verificado:** `grep style="` → 0, `astro check` → 0/0/0, `npm run build` → OK, confirmado en HTML servido que `/sobre-nosotros` marca "Conócenos" con `is-active-page` y no toca "Educación".

---

## Checkpoint 3a — `/sobre-nosotros`: Hero (#que-es) (completado 2026-07-09)

Archivo: `src/components/sobre-nosotros/QueEs.astro`. Sin comportamiento JS — todas las animaciones son `clapUp`/`clapPulse` (ya en `global.css` desde el Checkpoint 1), disparadas al cargar con delay escalonado, igual que el Hero del home.

**Verificaciones:** `grep style="` → 0 · `astro check` → 0/0/0 · `npm run build` → OK (`hero-sobre-manos.webp` optimizada 463kB→110kB). El build ya reporta "2 page(s) built", confirmando que `/sobre-nosotros` es una ruta real e independiente.

---

### Corrección post-checkpoint: dos discrepancias reales con el diseño

El usuario reportó que el Hero no se veía idéntico al diseño. Revisé el original línea por línea contra mi CSS y encontré dos discrepancias reales (no eran percepción):

1. Al badge "¿Qué es CLAP?" le faltaba `letter-spacing: 0.05em` — se me quedó afuera al portar el estilo.
2. El tamaño del `h1` en pantallas angostas usaba breakpoints y valores inventados por mí (`40px` bajo 767px) en vez de los reales del original, que son **específicos de esta sección** y no coinciden con los breakpoints estándar del resto del proyecto: `w<640px → 38px`, `w<900px → 46px`, si no `58px` (verificado en `heroH1.style.fontSize` dentro de `applyResponsive()`).

Ambos corregidos. **Verificado:** `grep style="` → 0, `astro check` → 0/0/0, `npm run build` → OK, confirmado directamente en el HTML servido de `/sobre-nosotros` que el `<style>` inline incluye `letter-spacing:.05em` y los media queries en `639.98px`/`899.98px`.

---

### Segunda corrección: contenido centrado, no pegado a la izquierda

El usuario aclaró que el diseño real centra el contenido del Hero — el HTML de la maqueta lo tenía pegado a la izquierda (`margin-left:0`, sin `justify-content:center`), que es exactamente el tipo de discrepancia que se espera al usar el HTML solo como fuente de copy/contenido, no de maquetado (ver reglas del proyecto). Corregido: `.content` ahora centra con `justify-content:center` + `text-align:center`, y `.inner` es flex-column con `align-items:center` (badge, h1 y párrafo quedan centrados como bloque).

**Nota para verificar visualmente (no puedo verlo yo):** el scrim de fondo sigue siendo el degradado izquierda-a-derecha del original (oscuro a la izquierda, más transparente a la derecha) — pensado para texto pegado a la izquierda. Con el texto centrado, es posible que el lado derecho del texto quede sobre una zona más clara de la foto y pierda contraste. Si se ve mal, aviso y ajusto el scrim a algo más simétrico.

**Verificado:** `grep style="` → 0, `astro check` → 0/0/0, `npm run build` → OK.

---

---

## Checkpoint 3b — `/sobre-nosotros`: Expertise (completado 2026-07-09)

Archivo: `src/components/sobre-nosotros/Expertise.astro`.

### Hallazgo importante: el reveal de esta página NO es igual al del home

Verifiqué `setupReveal()` en el script de `sobre-nosotros.html` línea por línea y **no es el mismo comportamiento** que en `index.html`:
- Se dispara **una sola vez** (`unobserve` tras revelar) — no se repite al salir/entrar del viewport como en el home.
- `rootMargin: -8%` (el home usa -10%).
- Las tarjetas de Expertise (`data-expcard`) tienen una entrada **distinta** al resto: caída con rebote (`translateY(-26px) scale(.94)`, `.7s cubic-bezier(.34,1.45,.5,1)`) en vez del fade+slide estándar.

Generalicé `reveal.ts` con opciones (`threshold`, `rootMargin`, `repeat`) en vez de crear un módulo nuevo — mantiene retrocompatibilidad total con las 7 secciones del home que ya lo usan (sin opciones, se comportan exactamente igual que antes). La variante "caída con rebote" se activa por atributo (`data-reveal-variant="drop"`), no está hardcodeada a `data-expcard` — cualquier futura sección puede reusarla.

| Comportamiento | Disparador | Notas |
|---|---|---|
| Reveal del intro, una sola vez | `IntersectionObserver`, rootMargin -8% | `reveal.ts` con `repeat:false` |
| Entrada "caída con rebote" de las 6 tarjetas, escalonada (140ms c/u) | `IntersectionObserver` | `reveal.ts` con `data-reveal-variant="drop"` |
| Hover de tarjeta (icono escala, flecha se pinta del color de acento) | CSS `:hover` puro | `Expertise.astro` |
| Grid 3→2 columnas + compactado de íconos/padding en mobile (con un breakpoint extra en 430px) | `@media`, antes resuelto por JS en `applyResponsive` | `Expertise.astro` |

**Verificaciones:** `grep style="` → 0 · `astro check` → 0/0/0 · `npm run build` → OK.

---

---

## Checkpoint 3c — `/sobre-nosotros`: Círculo dorado (completado 2026-07-09)

Archivos: `src/components/sobre-nosotros/Circulo.astro`, `src/scripts/circulo-dorado.ts`.

Comportamiento verificado con detalle en el script original (no es un simple hover/click — tiene varias reglas específicas):

| Comportamiento | Disparador | Detalle |
|---|---|---|
| Selección de nivel (3 anillos anidados + 3 tarjetas) | `click` siempre; `hover` solo **≥1100px** (el umbral de hover es 1100, no el breakpoint de mobile 768 — son dos cosas distintas) | `circulo-dorado.ts` |
| Relleno anidado de anillos (elegir "qué" rellena los 3; "por qué" solo el interno) + burbuja de celebración (`circBurst`) la primera vez que se llega a "qué" | click/hover | clases CSS `.is-filled`/`.is-active`, sin colores inline por JS |
| Al sacar el mouse del diagrama (solo desktop, sin auto-tour corriendo): los anillos vuelven a blanco plano, **pero la tarjeta seleccionada sigue expandida** — es un reset solo visual de los anillos, no de la selección | `mouseleave` | replicado tal cual, incluida la asimetría |
| Auto-tour de una sola pasada (0→1→2→reposo) al entrar en viewport si el usuario no interactuó; se puede repetir si sales de la sección y vuelves a entrar | `IntersectionObserver` threshold 0.5 | `circulo-dorado.ts` |
| En mobile (<768px) solo se muestra la tarjeta activa (las otras 2 se ocultan) y el texto del hint cambia a "Toca los círculos" | CSS `@media`, antes resuelto en parte por JS | `Circulo.astro` |

**Verificaciones:** `grep style="` → 0 · `astro check` → 0/0/0 (corregí una variable sin usar) · `npm run build` → OK.

---

---

## Checkpoint 3d — `/sobre-nosotros`: Valores (completado 2026-07-09)

Archivos: `src/components/sobre-nosotros/Valores.astro`, `src/scripts/valores-grid.ts`. La sección más elaborada visualmente hasta ahora: 4 iconos SVG dibujados a mano en una caja 2×2, flanqueada por etiquetas a la izquierda/derecha en forma de cruz.

**Breakpoint propio de esta sección:** `999.98px` (no es ninguno de los breakpoints estándar del proyecto — verificado como `valSmall = w<1000` en el original).

| Comportamiento | Disparador | Detalle |
|---|---|---|
| Ensamblado: la caja aparece, luego las 4 piezas (celda+etiqueta) "vuelan" desde su esquina y encajan, escalonado | `IntersectionObserver` threshold 0.4, se repite | vía transiciones CSS con `transition-delay` por `nth-child`, no JS calculando cada delay |
| Hover en una celda O su etiqueta correspondiente resalta ambas a la vez (celda se rellena del color del valor, etiqueta se acerca y cambia de color) | `mouseenter`/`mouseleave` (sin restricción de ancho — activo siempre, igual que el original) | `valores-grid.ts` |
| Mobile/tablet (<1000px): solo se ve la caja 2×2 centrada + una tarjeta con el valor activo debajo; tap en una celda cambia la tarjeta | `click` | `valores-grid.ts` |
| Recorrido automático de una pasada (0→1→2→3) la primera vez que la sección entra en viewport, solo en mobile/tablet | `IntersectionObserver` threshold 0.35 | `valores-grid.ts` |

**Verificaciones:** `grep style="` → 0 · `astro check` → 0/0/0 · `npm run build` → OK.

---

### Corrección post-checkpoint: hover roto por transition-delay heredado + ensamblado sin desactivar en mobile

El usuario reportó que el hover celda↔etiqueta no disparaba la animación/cambio de fondo, y que mobile tampoco funcionaba. Dos bugs reales, ambos en cómo armé el "ensamblado":

1. **Hover con delay heredado:** usaba `transition-delay: 0.22s/0.38s/0.54s/0.7s` en `.wrap.is-assembled .cell` para escalonar la entrada — pero `transition-delay` sin propiedad específica aplica a **todas** las propiedades en transición del elemento, incluyendo `background` (la misma que usa el hover). Una vez ensamblado, `.is-assembled` queda pegado en el DOM, así que cualquier hover posterior heredaba ese delay — hasta 0.7s de espera antes de que el fondo cambiara, lo cual se percibía como "no pasa nada". Reescribí el ensamblado con `@keyframes` + `animation` (en vez de `transition`+`transition-delay`), completamente desacoplado de la `transition: background .4s` que usa el hover — cada mecanismo CSS es independiente, sin herencia de delay.
2. **Ensamblado sin desactivar en mobile:** el `IntersectionObserver` que dispara `.is-assembled` no distingue de ancho de pantalla (igual que el original), así que la animación de "volar desde la esquina" (offset fijo de 52px) se seguía aplicando en mobile, pero con la caja reducida a `min(340px,82vw)` el desfase quedaba desproporcionado. El original evita esto directamente en JS (fuerza `opacity:1` sin pasar por el observer en mobile). Repliqué el mismo efecto: encerré las reglas de ensamblado en `@media (min-width:1000px)`, así en mobile no compiten en absoluto contra las reglas que fuerzan todo visible sin animación.

**Verificado:** `grep style="` → 0, `astro check` → 0/0/0, `npm run build` → OK. Confirmado en el CSS compilado real (`dist/_astro/sobre-nosotros.*.css`, ya no inline por el tamaño de la página): `.cell` transiciona solo `background`, `@keyframes val-cell-in` presente, y el ensamblado queda dentro de `@media (width>=1000px)`.

---

### Tercera corrección: atributo `data-vi` faltante en las celdas — el bug real

El fix anterior (transition-delay) era real pero no era la causa principal. La causa real: en el marcado, cada celda (`data-valcell="0"`) **nunca tenía un atributo `data-vi` separado** — solo las etiquetas lo tenían. El script lee `el.dataset.vi` para saber qué valor corresponde a cada elemento; para las celdas eso daba `undefined` → `Number(undefined)` → `NaN`. Comparar `NaN === NaN` es siempre `false` en JS, así que el hover/click en una celda nunca encontraba coincidencia — ni con la etiqueta, ni consigo misma. Esto también explica por qué mobile tampoco funcionaba: el tap en una celda llamaba `setActive(NaN)`, que tampoco seleccionaba nada.

Corregido agregando `data-vi="0/1/2/3"` a cada celda (el original sí separa `data-valcell=""` de `data-vi="N"` como atributos independientes — se me habían colapsado en uno solo al escribir el marcado).

**Verificado:** `grep style="` → 0, `astro check` → 0/0/0, `npm run build` → OK, confirmado en el HTML servido que las 4 celdas ahora tienen `data-vi`.

---

## Checkpoint 3e — `/sobre-nosotros`: Cifras / Impacto (completado 2026-07-09)

Archivos: `src/components/sobre-nosotros/Cifras.astro`, `src/scripts/video-modal.ts`. Reutiliza `reveal.ts` y `count-up.ts` (sin cambios).

Nota de nombre: llamé al componente `Cifras.astro` (no `Impacto.astro`) para no chocar con el `Impacto.astro` que ya existe en `src/components/sections/` (versión home) — son secciones distintas con copy y métricas diferentes, ambas mapean al mismo `id="impacto"` de sus páginas fuente respectivas.

Verificado contra `sobre-nosotros.html` líneas 350-404 (sección), 602-608 (markup del modal) y 789-813 (`setupVideo()`/`countUp()`): mismo algoritmo de count-up que el home (1500ms, ease-cubic, formato `de-DE`), pero **6 métricas y etiquetas distintas** a las del home (confirmado, no es una copia): +42 Proyectos desarrollados, +$10.000 mill. Ejecutados, +15 Territorios impactados, +15.000 Personas impactadas, +10 Años de experiencia acumulada, +150 Alumnos.

`video-modal.ts` es un módulo nuevo del catálogo (ya estaba previsto en §4): abre el modal por click en el CTA `data-videocta`, inyecta el iframe de `youtube-nocookie.com` con `autoplay=1` recién al abrir (no antes, para no cargar el embed innecesariamente), limpia `iframe.src` al cerrar (detiene la reproducción en vez de solo ocultar). Cierre por botón/click en el overlay/`Escape`. Implementado con `classList.add/remove("is-open")` en vez de mutar `style.display` inline, para no introducir `style=""`.

| Comportamiento/animación | Disparador | Implementado en |
|---|---|---|
| Gradiente de fondo en movimiento + 2 blobs + anillos decorativos | load, loop CSS infinito | `Cifras.astro` (mismos keyframes compartidos que Hero/Impacto home) |
| Reveal del bloque izquierdo (eyebrow+h2+p+CTA) | `IntersectionObserver`, una sola vez | `reveal.ts` con `repeat:false`, `rootMargin:-8%` (mismo patrón que el resto de esta página, no el del home) |
| Reveal escalonado de las 6 métricas (delay 40/120/200/280/360/440ms) | `IntersectionObserver` | `reveal.ts` |
| Contador animado en las 6 métricas | `IntersectionObserver` threshold 0.4 | `count-up.ts` |
| Modal de video (abrir/cerrar) | `click` en CTA / botón cerrar / click fuera / `Escape` | `video-modal.ts` |

**Verificaciones:** `grep -c 'style="'` → 0 · `astro check` → 0 errores/0 warnings/0 hints · `npm run build` → OK (2 páginas). Inspeccioné `dist/sobre-nosotros/index.html` compilado: 0 `style="`, los 4 `data-video*` presentes, los 6 `data-count` con sus valores correctos. Confirmé que el bundle de Cifras (`dist/_astro/Cifras.astro_astro_type_script_index_0_lang.*.js`) contiene `youtube-nocookie`/`is-open`/`videocta` — el módulo de video quedó correctamente scopeado al `<script>` propio del componente, no mezclado con Circulo/Valores/Expertise (cada uno generó su propio chunk `.js` independiente).

---

## Checkpoint 3f — `/sobre-nosotros`: Filosofía (completado 2026-07-09)

Archivos: `src/components/sobre-nosotros/Filosofia.astro`, `src/scripts/triangulo-filosofal.ts`.

Verificado contra `sobre-nosotros.html` líneas 407-474 (markup) y 971-1126 (`setupTri()`/`setTri()`/`hideTriHint()`/`setupTriHeader()`/`setupTriIntro()`).

### Comportamiento del diagrama (4 nodos: PROPÓSITO al centro + LIDERAZGO/SOCIEDAD/INNOVACIÓN en los vértices)

- **Selección:** `click` o `mouseenter` en cualquier nodo (sin restricción de ancho, a diferencia del Círculo dorado que sí limita el hover a ≥1100px — verificado, aquí no hay ese chequeo en `setupTri()`).
- **Armado de entrada:** al entrar el diagrama en el viewport (`IntersectionObserver` threshold 0.4), los 4 nodos aparecen uno por uno (LIDERAZGO→SOCIEDAD→INNOVACIÓN→PROPÓSITO, 880ms entre cada uno) y cada uno se previsualiza como activo justo al aparecer; al terminar, todo se asienta en reposo (contorno de color, sin relleno) con la tarjeta de PROPÓSITO visible por defecto. Si el usuario interactúa (click/hover) antes de que termine el armado, este se cancela y el resto de nodos se revela de inmediato sin esperar su turno. Si la sección sale del viewport y se vuelve a entrar, el armado se repite desde cero (a diferencia del Círculo dorado, cuyo auto-tour también se repite, mismo patrón).
- **Colores por nodo** (verificados en `TRI_BG`/`TRI_LINE`, línea 972-973): PROPÓSITO usa relleno degradado amarillo (`#FFD84D→#FFC200→#E8A400`) con texto/ícono tinta (`#341C65`) solo cuando está activo — en reposo su contorno/texto es ámbar (`#E8A400`), no tinta. LIDERAZGO teal `#13b89a`, SOCIEDAD morado `#7b4dff`, INNOVACIÓN: relleno activo `#43197C` pero **contorno/reposo en un morado más claro `#5b2ea6`** — colores distintos a propósito, confirmado, no es error de transcripción.
- **Tarjetas (paneles):** una por nodo, apiladas (`position:absolute`, la activa pasa a `position:relative`), contenido específico por vértice (badge + h3 + párrafo con frase destacada en `<strong>`).
- **Hint "Toca cada concepto":** se oculta permanentemente tras la primera interacción real (`hideTriHint()`), vuelve a aparecer cuando el diagrama se re-arma al reingresar al viewport.

### Simplificaciones deliberadas (siguiendo el mismo criterio ya aplicado en Círculo dorado/Valores)

- **Escala mobile fija en vez de cálculo JS continuo:** el original calcula `sc = clamp(.62, (w-40)/470, .82)` en cada resize y compensa con `getBoundingClientRect` en pantallas <415px (`centerDiagX`). Igual que se hizo con el Círculo dorado (`scale(.78)` fijo), usé un valor CSS fijo `scale(.74)` bajo `@media(max-width:767.98px)` — el diagrama de 420×380 se reduce a ~311×281px, tamaño final comparable al que resultaba de la fórmula original en los anchos de teléfono más comunes (375-414px). Sin JS de resize, sin el ajuste de sub-píxel de `centerDiagX`.
- **Cabecera reutiliza `reveal.ts` en vez de un módulo nuevo:** `setupTriHeader()` en el original observa el contenedor del header y escalona sus 3 hijos (badge/h2/p) con `setTimeout` de 130ms, repitiéndose cada vez que entra/sale del viewport — es funcionalmente el mismo patrón que ya soporta `reveal.ts` (`data-reveal` + `data-delay` + `repeat:true`), así que en vez de crear un módulo nuevo apliqué `attachReveal(header, { threshold:0.5, repeat:true })` con `data-delay="0/130/260"` en los 3 hijos. Esta misma cabecera reaparece en Historia (`#historia`, Checkpoint 3g) con idéntico comportamiento — se reutilizará igual, sin duplicar código.
- Corregí sobre la marcha un `style={{...}}` (directiva de Astro que sí compila a `style=""` en el HTML final) que había usado para los colores del badge de cada tarjeta — reemplazado por 4 clases `.badge--proposito/liderazgo/sociedad/innovacion`, coherente con el resto del proyecto (cero estilos inline, ni siquiera vía directiva).

| Comportamiento/animación | Disparador | Implementado en |
|---|---|---|
| Entrada escalonada de cabecera (badge/h2/p), se repite | `IntersectionObserver` threshold 0.5 | `reveal.ts` con `data-delay` |
| Reveal de columnas diagrama/panel (izq/der) | `IntersectionObserver`, una sola vez | `reveal.ts` con `repeat:false`, `rootMargin:-8%` (mismo patrón que el resto de la página) |
| Armado punto por punto del triángulo (4 nodos) | `IntersectionObserver` threshold 0.4, se repite | `triangulo-filosofal.ts` |
| Selección de nodo + tarjeta correspondiente | `click`/`mouseenter`, sin restricción de ancho | `triangulo-filosofal.ts` |
| Ocultar hint tras primera interacción, reaparece al re-entrar | ídem | `triangulo-filosofal.ts` |

**Verificaciones:** `grep -c 'style="'` → 0 (incluye la corrección del `style={{}}` detectada antes del build) · `astro check` → 0 errores/0 warnings/0 hints · `npm run build` → OK (3 páginas). Confirmé en `dist/sobre-nosotros/index.html`: 0 `style="`, los 4 `data-tri-node`/`data-tri-panel` presentes con sus keys (incluyendo tildes `PROPÓSITO`/`INNOVACIÓN`). Confirmé en el bundle propio (`dist/_astro/Filosofia.astro_astro_type_script_index_0_lang.*.js`) que la lógica de `is-active`/`is-visible` quedó scopeada a su propio chunk.

---

## Checkpoint 3g — `/sobre-nosotros`: Historia (completado 2026-07-09) — última sección de la página

Archivos: `src/components/sobre-nosotros/Historia.astro`, `src/scripts/historia-timeline.ts`. Reutiliza `reveal.ts` (cabecera con `data-tri-header`, igual que Filosofía; y el reveal estándar de la sección).

Verificado contra `sobre-nosotros.html` líneas 476-600 (markup) y 1128-1232 (`setupHistoria()`/`setYear()`/`setupHistAuto()`/`fillChecks()`/`resetChecks()`).

### Datos: 11 hitos, **2017 no existe** (confirmado, no es un hueco accidental — el rail salta de 2016 a 2018 en el propio markup fuente)

Transcribí los 11 años con su título, lista de logros y color exactos. Detalle no obvio encontrado al comparar `data-acc` (panel) contra `data-histcheck` (cada item): **en los años morados (2018/2020/2022/2024) se usan DOS tonos de morado distintos a propósito** — `data-acc="#7b4dff"` (morado oscuro) solo tiñe el punto del riel y la barra de progreso, mientras que el ícono del año y los círculos del checklist usan `data-histcheck="#a78bff"` (morado más claro). En los años teal/amarillo ambos tonos coinciden, así que ahí no se nota la distinción. Lo repliqué con dos custom properties CSS separadas por tema (`--acc` para el riel, `--icon-color` para ícono+checklist) en vez de una sola, para no perder el matiz.

También verifiqué que el número de logros por año determina el layout de la lista (no es una decisión mía): años con 4-5 logros (2018/2019/2020/2021/2026) usan grid de 2 columnas y texto 15px; años con 1-3 logros usan lista de 1 columna y texto 16px — encontré esta correlación exacta en el propio markup (atributo `data-histtwo` presente solo en esos 5 años) y la mantuve como una clase `checklist--two`.

### Comportamiento

- **Selección de año:** `click`/`mouseenter` en cualquier botón del riel (sin restricción de ancho, igual que Filosofía) detiene el auto-tour y salta a ese año.
- **Barra de progreso + puntos:** la barra (gradiente teal→morado) avanza a `i/(n-1)*100%`; cada punto se rellena con el color de su año (`--acc`) al llegar o pasar por él, y el punto activo se agranda con un glow — usé `.style.width` directo para el porcentaje de la barra (igual que `hub-checklist.ts` ya hacía para su barra de progreso, es un valor genuinamente continuo, no vale la pena una clase por cada uno de los 11 valores posibles) y clases (`is-done`/`is-active`) para todo lo demás.
- **Checklist progresivo:** al activarse un año, sus círculos de logro se rellenan uno por uno (220ms + 160ms por ítem) con el color del tema; al desactivarse se resetean sin transición pendiente.
- **Auto-tour de una sola pasada** (600ms + 1250ms por año, ~13s totales) al entrar el riel en el viewport si el usuario no interactuó; se repite si sales de la sección y regresas. Mismo patrón que Círculo dorado/Filosofía.
- **Auto-scroll horizontal del riel:** al cambiar de año (por click, hover o auto-tour), si el botón correspondiente no es visible dentro del riel, este hace scroll suave para centrarlo — réplica de la lógica final de `setYear()` (sin disparar scroll de la página, solo del contenedor horizontal).

### Simplificación deliberada: sin el hack de sincronizar altura por JS

El original fija `height:700px` en `#historia` en desktop y en mobile lo cambia a `height:auto` vía JS, re-sincronizando manualmente (`requestAnimationFrame` + `scrollHeight`) la altura de los overlays decorativos (`inset:0` + una altura fija en píxeles pisando ese `inset`) para que sigan cubriendo la sección. Es un parche innecesario: si nunca se fija una altura en píxeles a los overlays decorativos (solo `position:absolute;inset:0`), CSS los estira automáticamente para cubrir exactamente la caja real del `<section>` en cualquier alto, sin JS. No fijé ninguna altura en la sección — crece con el contenido en todos los anchos, y los overlays (`.overlay`/`.blob`) se ajustan solos. Mismo criterio que ya se aplicó para descartar `applyResponsive()` en general (§2.5 del inventario).

| Comportamiento/animación | Disparador | Implementado en |
|---|---|---|
| Entrada escalonada de cabecera, se repite | `IntersectionObserver` threshold 0.5 | `reveal.ts` con `data-delay` |
| Reveal del riel + panel-root | `IntersectionObserver`, una sola vez | `reveal.ts` con `repeat:false`, `rootMargin:-8%` |
| Selección de año + auto-scroll del riel | `click`/`mouseenter` en botón de año | `historia-timeline.ts` |
| Barra de progreso + puntos del riel | ídem | `historia-timeline.ts` |
| Checklist progresivo por año (220+160ms por ítem) | al activarse el panel del año | `historia-timeline.ts` |
| Auto-tour de una pasada por los 11 años, se repite | `IntersectionObserver` threshold 0.55 | `historia-timeline.ts` |

**Verificaciones:** `grep -c 'style="'` → 0 · `astro check` → 0 errores/0 warnings/0 hints · `npm run build` → OK (3 páginas). Confirmé en `dist/sobre-nosotros/index.html`: 0 `style="`, los 11 `data-year-btn`/`data-year-panel` presentes, los 11 años (2015-2026 sin 2017) en el HTML servido. Confirmé en el bundle propio (`dist/_astro/Historia.astro_astro_type_script_index_0_lang.*.js`) que `is-checked`/`is-done`/`scrollTo` quedaron scopeados a su propio chunk.

---

## `/sobre-nosotros` — página completa (7 de 7 secciones)

Con Historia, `/sobre-nosotros` queda completa: Hero (Qué es) → Expertise → Círculo dorado → Valores → Cifras/Impacto → Filosofía → Historia. Siguiente hito de la Fase 6: iniciar `/metodologia` (Checkpoint 4), siguiendo el mismo protocolo de un checkpoint por sección con parada explícita para confirmación del usuario.

---

### Ajuste post-checkpoint 3g: checklist a 1 columna en mobile

El usuario pidió que en vista mobile los logros bajo el año/título fueran siempre una sola columna (los años con 4-5 logros usaban `checklist--two`, grid de 2 columnas, incluso en mobile). Agregado `@media(max-width:759.98px){.checklist--two{grid-template-columns:1fr}}` con el texto vuelto a 16px (el tamaño que ya usaban los años de 1 columna) para que se vea uniforme. Confirmado por el usuario. `grep style="` → 0, `astro check` → 0/0/0, `npm run build` → OK.

---

## Checkpoint 4a — `/metodologia`: Hero (completado 2026-07-09)

Archivos: `src/components/metodologia/Hero.astro`, `src/pages/metodologia.astro`. Primera sección de la cuarta página de la Fase 6.

Verificado contra `metodologia.html` líneas 98-117 (markup) y 674-708 (`setupReveal()` propio de esta página).

### `setupReveal()` de `/metodologia` es una tercera variante, distinta de home y de sobre-nosotros

Ya había 2 variantes documentadas (home: se repite, threshold 0.12, rootMargin -10%; sobre-nosotros: una vez, threshold 0.12, rootMargin -8%). Esta página usa una tercera combinación: **una sola vez** (como sobre-nosotros) pero con **threshold 0.08 y rootMargin -4%** (ambos distintos a los dos anteriores) — confirmado línea 706. `reveal.ts` ya soporta esto sin cambios (las opciones son parametrizables desde que se generalizó en el Checkpoint 3a): `attachReveal(section, { threshold: 0.08, rootMargin: '0px 0px -4% 0px', repeat: false })`.

El original también incluye una lógica extra para revelar instantáneamente (sin esperar el IntersectionObserver) cualquier elemento que ya esté visible al montar — pensada para el hero, que está arriba del fold. No la porté: un `IntersectionObserver` normal ya dispara su callback inicial casi de inmediato para elementos visibles en el momento de `observe()`, y este mismo mecanismo (sin ese refuerzo extra) ya se usó tal cual en el Hero de home y quedó confirmado visualmente correcto por el usuario en el Checkpoint 2a — mismo criterio aplicado aquí.

### Corrección de nav: esta página NO resalta ningún dropdown activo (inconsistencia real, no un olvido)

Al armar `metodologia.astro` inicialmente puse `activeDropdown="educacion"`, pero verifiqué el nav real de `metodologia.html` (línea 52) y confirmé dos cosas: (1) el link "Metodología" vive dentro del dropdown **"Conócenos"** en el nav (no en "Educación", que solo contiene "Programas Especializados CLAP") — un error mío al asumir la agrupación sin verificar; y (2) esta página específicamente **no aplica ningún estilo de página-activa** a su propio trigger "Conócenos" (a diferencia de sobre-nosotros.html/equipo.html/programas.html, que sí lo hacen) — la misma inconsistencia del original ya documentada en el Checkpoint 3a (`Header.astro`), aquí confirmada también desde el lado de esta página. Corregido: `metodologia.astro` no pasa la prop `activeDropdown` en absoluto.

### Otras notas

- El anillo decorativo (`metFloat`, 18s ease-in-out, `translate(30px,-24px) scale(1.1)`) es visualmente casi idéntico al `clap-float-a` ya consolidado en `global.css` (`translate(40px,-30px) scale(1.12)`) — lo reutilicé en vez de crear un keyframe nuevo, mismo criterio de consolidación del §5 del inventario.
- No encontré ningún tamaño de `h1` específico por breakpoint para este hero en `applyResponsive()` (a diferencia del hero de "Qué es" en sobre-nosotros, que sí tenía valores exactos verificados) — usé `38px` en `<768px` como un valor razonable, sin inventar precisión donde el original no la tiene.

| Comportamiento/animación | Disparador | Implementado en |
|---|---|---|
| Anillo decorativo flotando | load, loop CSS infinito | `Hero.astro`, reutiliza `clap-float-a` |
| Entrada escalonada (badge/h1/p/CTAs) | `IntersectionObserver` threshold 0.08, rootMargin -4%, una sola vez | `reveal.ts` con `data-delay` |

**Verificaciones:** `grep -c 'style="'` → 0 · `astro check` → 0 errores/0 warnings/0 hints · `npm run build` → OK (3 páginas; imagen de hero optimizada de 7.7MB a 132KB webp). Confirmé en `dist/metodologia/index.html`: 0 `style="`, `<title>`/canonical presentes, y 0 ocurrencias de `is-active-page` (confirma que la inconsistencia del nav se replicó correctamente, no se "arregló" por accidente).

---

## Checkpoint 4b — `/metodologia`: Importancia (completado 2026-07-09)

Archivos: `src/components/metodologia/Importancia.astro`, `src/scripts/stat-cards.ts`, `src/scripts/img-wipe.ts`.

Verificado contra `metodologia.html` líneas 119-168 (markup) y 602-671 (`setupImgReveal()`/`setupStatCards()`).

### Bug real evitado: el orden mobile NO es "imagen primero"

Al leer el comentario del propio código (`applyResponsive()` línea 924: *"en móvil orden = texto/párrafos → foto → tarjetas"*) por poco asumo que bastaba un `order:-1` en la columna de imagen — hice esa primera versión y, antes de darla por buena, releí `applyResponsive()` completo (líneas 928-947): en realidad el original **reubica el bloque de estadísticas** (`impStats`) con `insertAdjacentElement` para que quede *después* de la imagen, dejando el orden real: texto (sin estadísticas) → imagen → estadísticas. Un `order:-1` en la imagen habría puesto la imagen ANTES del texto, exactamente al revés de lo pedido. Corregido antes de construir: separé `.stats` como hermano de grid en vez de hijo de la columna de texto (mismo patrón ya usado en Espacios, Checkpoint 2g), con `order:1/2/3` en `<900px` sobre los 3 bloques (`.col-text-top`/`.col-media`/`.stats`) y `grid-column:1/2/1` + `grid-row:1/(1→3)/2` explícitos en desktop para que la imagen ocupe las 2 filas de la columna derecha.

### Tres puntos de quiebre distintos para las tarjetas de estadística (verificado, no una sola)

`impStats.style.flexDirection = w<1200 ? 'column' : ''` — un umbral propio de esta sección (1200px) that no coincide con ningún breakpoint estándar del proyecto: en escritorio grande (≥1200px) las 2 tarjetas van lado a lado; entre 900-1199px (aún con el grid de 2 columnas) ya se apilan verticalmente; y por debajo de 900px se apilan con menor espaciado (`gap:12px`/`margin-top:10px` en vez de `14px`/`30px`). Repliqué los 3 breakpoints exactos (`1199.98px`, `899.98px`).

### `stat-cards-count`: por qué es un módulo aparte y no una variante de `count-up.ts`

A diferencia del count-up genérico (1500ms, threshold 0.4, formato `de-DE`, disparado por su propio observer sobre el número), aquí el número solo empieza a contar **300ms después de que la tarjeta contenedora se revela** (no apenas el número entra en viewport) y dura 900ms — un observer sobre la TARJETA dispara tanto el fade+slide como (con ese delay extra) el conteo del número que está dentro. Es un comportamiento compuesto distinto, no una simple variación de parámetros, así que quedó en su propio módulo (`stat-cards.ts`), tal como ya estaba previsto en el catálogo del §4 (`stat-cards-count`).

### `img-wipe-reveal`: cortina de color sobre la foto

Nuevo módulo (`img-wipe.ts`, también ya previsto en el catálogo). Al entrar la sección en viewport (threshold 0.22, una sola vez) y tras 260ms, el overlay degradado (morado→teal) se contrae desde el borde derecho (`scaleX(0)`, transform-origin right) mientras la foto —que arranca ligeramente ampliada (`scale(1.07)`)— vuelve a su escala normal en 1.5s. Implementado con una sola clase `.is-open` en el contenedor (`data-img-wipe-root`) que controla ambas transiciones vía CSS, en vez de mutar `transform` por JS en dos elementos por separado.

| Comportamiento/animación | Disparador | Implementado en |
|---|---|---|
| Entrada escalonada de texto (badge/h2/p/p/stats-wrapper) | `IntersectionObserver` threshold 0.08, rootMargin -4%, una sola vez | `reveal.ts` con `data-delay` |
| Reveal + auto-scroll de la columna de imagen | ídem, `data-reveal="right"` | `reveal.ts` |
| Reveal individual de cada tarjeta + conteo del número (delay 300ms, 900ms) | `IntersectionObserver` threshold 0.15 sobre cada tarjeta | `stat-cards.ts` |
| Cortina de color + zoom-out de la foto | `IntersectionObserver` threshold 0.22, delay 260ms | `img-wipe.ts` |

**Verificaciones:** `grep -c 'style="'` → 0 · `astro check` → 0 errores/0 warnings/0 hints · `npm run build` → OK (3 páginas; imagen de territorio optimizada de 900KB a 59KB). Confirmé en `dist/metodologia/index.html`: 0 `style="`, las 2 `data-stat-card`/`data-stat-num="4"`, `data-img-wipe-root`/`data-img-wipe` presentes. Confirmé en el bundle propio (`dist/_astro/Importancia.astro_astro_type_script_index_0_lang.*.js`) que la lógica de `is-visible`/`is-open`/`statNum` quedó scopeada a su propio chunk.

---

## Checkpoint 4c — `/metodologia`: Fases (completado 2026-07-09)

Archivos: `src/components/metodologia/Fases.astro`, `src/scripts/phase-stepper.ts`. Cuatro imágenes nuevas (`metodologia-fase-{explorar,crear,actuar,resolver}.webp`).

Verificado contra `metodologia.html` líneas 171-308 (markup) y 712-788 (`setupPhases()`/`setPhase()`/`setupPhaseAuto()`), más `applyResponsive()` líneas 982-1000 para el responsive específico de esta sección.

### El original no tiene ningún `@media` real — confirmado de nuevo, esta vez para todo el archivo

Antes de decidir cómo portar el responsive de esta sección, grepeé el archivo completo por `@media` y no hay ninguno: absolutamente todo el comportamiento mobile de `metodologia.html` (incluida esta sección) se resuelve vía `applyResponsive()` en JS, atado a `window.innerWidth`. Confirma lo que ya se había asumido implícitamente en Importancia (Checkpoint 4b): la reducción de padding/tamaño de `h2` en `≤767.98px` que ya se usó ahí (y se repite aquí) es una decisión de robustez nuestra, no una réplica de una regla real del original — se mantiene por consistencia visual dentro de la misma página, ya aprobada una vez.

### Colores por pestaña: clases CSS, no `style{{}}` ni mutación JS de color

El original resuelve el color activo/inactivo de cada pestaña mutando `style.background`/`style.color`/`style.boxShadow` por JS con un `data-color` hexadecimal por botón. Como el conjunto de colores es fijo y pequeño (4 fases: rosa/ámbar/verde/azul, conocidos en tiempo de build), se replicó con clases modificadoras (`.tab--explorar/crear/actuar/resolver`, activadas por `is-active`) en vez de JS — mismo criterio que `circulo-dorado.ts` (colores de un conjunto enumerable fijo van en CSS, no en JS ni en `style{{}}`). `phase-stepper.ts` solo hace `classList.toggle`.

### Autocorrección: dos fugas de `style=""` inline antes de presentar el checkpoint

Al armar el panel "Crear" (barras de color del tablero) y el panel "Resolver" (números de impacto en 3 colores) escribí primero `style="background:#3BE0BB"` y `style="color:#FFC200"` inline sobre elementos con colores únicos por instancia — detectado con el grep de verificación antes de mostrar el checkpoint. Corregido con clases `.board-bar--{teal,yellow,white,emerald}` e `.impact-num--{teal,yellow,white}`.

### Auto-tour del stepper: idéntico patrón a `circulo-dorado.ts`/`triangulo-filosofal.ts`

Solo corre en `<1100px` (el `mouseenter` de las pestañas hace la previsualización equivalente en desktop), arranca a los 500ms de entrar la sección en viewport (threshold 0.4) y avanza cada 1600ms por las 4 fases; un click detiene el auto-tour de forma permanente (`userActed=true`) hasta que la sección sale del viewport y vuelve a entrar (mismo mecanismo de "reset al reingresar" ya documentado para Círculo dorado en sobre-nosotros). Panel activo: `classList.add('is-active')` fuerza `display:grid` y en el frame siguiente `classList.add('is-visible')` dispara el fade+slide — evita mutar `opacity`/`transform` por JS reutilizando el patrón `.is-open`/`.is-visible` ya usado en Importancia.

### Breakpoints propios de esta sección (no el estándar 767.98)

- Pestañas: `≤639.98px` pasan a columna (ícono arriba, texto centrado, ícono de 34px en vez de 52px, oculta "fase 0X") — verificado línea 983 (`phaseSmall = w < 640`).
- Paneles: `≤759.98px` el grid de 2 columnas colapsa a 1 (texto arriba, imagen abajo, sin necesidad de `order` porque el DOM ya viene en ese orden) — verificado línea 999 (`w < 760`).

| Comportamiento/animación | Disparador | Implementado en |
|---|---|---|
| Entrada escalonada (badge/h2/p/tabs/stage/CTA) | `IntersectionObserver` threshold 0.08, rootMargin -4%, una sola vez | `reveal.ts` con `data-delay` |
| Selección de fase por click | click en pestaña | `phase-stepper.ts`, detiene auto-tour |
| Preview de fase por hover (solo ≥1100px) | `mouseenter` en pestaña | `phase-stepper.ts` |
| Auto-tour de las 4 fases (solo <1100px) | `IntersectionObserver` threshold 0.4, 500ms + 1600ms/fase | `phase-stepper.ts` |
| Fade+slide del panel activo | cambio de fase | `phase-stepper.ts` vía clases `.is-active`/`.is-visible` |
| CTA "Conoce nuestros proyectos" | hover | `:hover` CSS puro |

**Verificaciones:** `grep -c 'style="'` → 0 · `astro check` → 0 errores/0 warnings/0 hints · `npm run build` → OK (3 páginas; las 4 fotos de fase optimizadas de ~250-620KB a ~28-44KB cada una). Confirmé en `dist/metodologia/index.html`: 0 `style="`. Confirmé que `phase-stepper.ts` quedó bundleado en su propio chunk (`dist/_astro/Fases.astro_astro_type_script_index_0_lang.*.js`), sin cruzarse con `stat-cards.ts`/`img-wipe.ts` de Importancia. Usuario confirmó en navegador (clic en pestañas, hover desktop, auto-tour en mobile).

---

## Checkpoint 4d — `/metodologia`: Competencias (completado 2026-07-09)

Archivos: `src/components/metodologia/Competencias.astro`, `src/scripts/comp-orbit.ts`. Imagen `metodologia-diagram.png` (ya estaba en `assets/images`, sin usar hasta ahora).

Verificado contra `metodologia.html` líneas 311-386 (markup, incluidos el popup y el modal fijos) y 790-893/488-502 (`setupComp()`/`setComp()`/`startCompAuto()`/`setupDiagramPill()`), más `this.COMP` (líneas 587-600).

### Los 3 sets de colores de "Analizar/Articular/Gestionar/Intervenir" NO coinciden entre sí — confirmado, no es un error

Como quedó anotado como pendiente de verificar tras el Checkpoint 4c: los nombres de competencia se repiten en 3 lugares del sitio con 3 paletas de color distintas y ninguna coincide con otra: (1) las píldoras "Competencias que activa" dentro de cada panel de fase (Checkpoint 4c) usan un primer set; (2) los nodos orbitales de esta sección usan un segundo set (`#6978df`/`#fc7859`/`#8fbf40`/`#40a1bc`, tomado de `data-color` en cada botón); y (3) los chips "Presente en las fases" dentro de la tarjeta de detalle de esta misma sección usan un tercer set, el de `this.COMP[i].phases` (`#ff1f7a`/`#f5b82e`/`#37bc43`/`#4497ea`, coloreando las FASES no las competencias). Los tres se preservaron literalmente, sin unificar.

### Modal de pantalla completa del diagrama: código muerto, no se portó

El markup incluye un modal fijo a pantalla completa (`ref="{{ setDiagramModal }}"`, con `openDiagram`/`closeDiagram`/`stopProp` ya definidos como métodos de la clase) pensado para abrirse hacienda click en algo con `ref="{{ setDiagramBtn }}"`. Grepeé el archivo completo por `setDiagramBtn` y por `openDiagram` buscando dónde se dispara: `setDiagramBtn` nunca se usa como atributo `ref` en ningún elemento del markup, y `openDiagram` nunca aparece en ningún `onClick`. Es decir, el modal existe en el DOM y su lógica de apertura/cierre está completamente implementada, pero **no hay ningún elemento interactivo que lo abra** — inalcanzable por el usuario en la práctica. No lo porté: solo implementé el popup de hover (`setupDiagramPill()`), que sí es funcional (mouseenter/mouseleave sobre el hub "Liderar").

### Autocorrección post-confirmación: el popup se veía "incompleto" en mobile — imagen deformada por el mapeo de atributos HTML a CSS

Después de que confirmaste el checkpoint la primera vez, señalaste que la imagen del popup se veía incompleta en mobile. Primero corregí un error real: le había pasado `width={580} height={435}` (relación 4:3) al `<Image>` de Astro para una imagen que en realidad es casi cuadrada (768×767px nativo) — la estaba deformando. Corregido a `width={580} height={580}`.

Pero el problema persistía en mobile. Usé Playwright (headless, instalado ad-hoc en el scratchpad, no es una dependencia del proyecto) para inspeccionar el `boundingBox()` real del popup en viewport 390×844: el ancho sí respetaba `min(580px,85vw)` (331.5px), pero el **alto quedaba fijo en 580px** — nada cuadrado. Causa raíz: el atributo HTML `height="580"` que Astro genera en el `<img>` se mapea directamente a la propiedad CSS `height` vía la hoja de estilos por defecto del navegador (no es solo un hint para el aspect-ratio); mi regla `.diagram-popup img{width:100%; object-fit:cover}` sobreescribía el ancho pero nunca el alto, así que el alto heredado del atributo (580px) quedaba fijo sin importar cuánto se achicara el ancho en pantallas angostas. Corregido agregando `height:auto` explícito (y quitando el `object-fit:cover`, que ya no hace nada útil una vez que la caja respeta la relación de aspecto real). Verificado de nuevo con Playwright: `boundingBox()` da 331.5×331.5px en mobile, cuadrado y centrado.

### Auto-tour de una sola pasada, sin reinicio al reingresar — variante nueva

A diferencia de Círculo dorado/Filosofía/Fases (que resetean su intro/auto-tour cada vez que la sección vuelve a entrar en viewport), aquí el `IntersectionObserver` se desconecta (`io.unobserve`) apenas dispara una vez (threshold 0.45) y nunca se vuelve a armar — el recorrido automático (Analizar→Articular→Gestionar→Intervenir→Analizar, 1400ms cada paso) ocurre como máximo una vez por carga de página, y cualquier hover/click en un nodo lo cancela para siempre. Documentado como una cuarta variante real del patrón "auto-tour", no una simplificación nuestra.

### Tarjeta de detalle: contenido pre-renderizado, no reescritura de texto por JS

El original reescribe `textContent`/`innerHTML` de la tarjeta de detalle en cada `setComp()`. Para evitar cualquier manipulación de texto por JS (y mantenerlo como HTML semántico real, ya indexable/inspeccionable), pre-rendericé las 4 variantes completas de la tarjeta como hermanos (mismo patrón que los paneles de Filosofía y de Fases) y el script solo hace `classList.toggle`. El color del borde de la tarjeta activa se resuelve con `:has()` en CSS puro (`.card-wrap:has(.card--analizar.is-active){border-color:...}`), sin ninguna mutación de `style` por JS.

| Comportamiento/animación | Disparador | Implementado en |
|---|---|---|
| Entrada escalonada (badge/h2/p/orbit/card/CTA) | `IntersectionObserver` threshold 0.08, rootMargin -4%, una sola vez | `reveal.ts` con `data-delay` |
| Selección de competencia por click/hover (sin restricción de ancho) | click o `mouseenter` en un nodo | `comp-orbit.ts` |
| Auto-tour de una sola pasada completa | `IntersectionObserver` threshold 0.45, una vez por carga, 1400ms/paso | `comp-orbit.ts` |
| Popup con el diagrama completo | `mouseenter`/`mouseleave` en el hub "Liderar" | `comp-orbit.ts`, clase `.is-open` |
| CTA "Conoce nuestros programas" | hover | `:hover` CSS puro |

**Verificaciones:** `grep -c 'style="'` → 0 · `astro check` → 0 errores/0 warnings/0 hints · `npm run build` → OK (3 páginas; diagrama optimizado de 148KB a 30KB webp). Confirmé en `dist/metodologia/index.html`: 0 `style="`. Confirmé que `comp-orbit.ts` quedó bundleado en su propio chunk (`dist/_astro/Competencias.astro_astro_type_script_index_0_lang.*.js`). Verificación adicional con Playwright (headless, no es dependencia del proyecto — instalada solo para depurar visualmente) confirmando `boundingBox()` cuadrado del popup en mobile. Usuario confirmó en navegador tras la corrección del popup.

---

## Checkpoint 4e — `/metodologia`: CTA final (completado 2026-07-09)

Archivo: `src/components/metodologia/CtaFinal.astro`. Última sección de la cuarta página de la Fase 6.

Verificado contra `metodologia.html` líneas 387-400 (sección sin `id`, no es un anchor de nav).

### Un solo `data-reveal` envolvente, no escalonado

A diferencia de todas las demás secciones de esta página (que escalonan badge/h2/p/etc. con `data-delay` individual), aquí el original pone `data-reveal=""` en un único `div` que envuelve h2+p+botones — todo el bloque entra junto, sin stagger. Repliqué exactamente eso: un solo `data-reveal` en `.content`, sin `data-delay` en los hijos.

### Ícono de flecha distinto al resto de CTAs de la página

Fases y Competencias usan una flecha diagonal (`M7 17 17 7 / M7 7h10v10`) en sus CTAs; esta sección usa una flecha recta (`M5 12h14 / m12 5 7 7-7 7`), igual que los CTAs del home. Preservado tal cual, sin unificar con el resto de la página.

| Comportamiento/animación | Disparador | Implementado en |
|---|---|---|
| Entrada del bloque completo (h2+p+botones) | `IntersectionObserver` threshold 0.08, rootMargin -4%, una sola vez | `reveal.ts`, sin stagger |
| Botón "Probar nuestros programas" (sólido) | hover | `translateY(-3px)` |
| Botón "Conoce nuestros proyectos" (glass) | hover | `translateY(-3px)` + fondo semi-transparente → blanco sólido |

**Verificaciones:** `grep -c 'style="'` → 0 · `astro check` → 0 errores/0 warnings/0 hints · `npm run build` → OK (3 páginas). Confirmé en `dist/metodologia/index.html`: 0 `style="`, 5 enlaces internos a `/programas` (nav, footer×2, y los 2 CTAs de esta página). Verificado visualmente con Playwright en desktop (1280px) y mobile (390px) antes de presentar el checkpoint. Usuario confirmó.

---

## `/metodologia` — página completa (5 de 5 secciones)

Con el CTA final, `/metodologia` queda completa: Hero → Importancia → Fases (stepper de 4 fases) → Competencias (diagrama orbital) → CTA final. Van 2 de 6 páginas terminadas (`/sobre-nosotros` y `/metodologia`). Siguiente hito de la Fase 6: iniciar `equipo.astro` (Checkpoint 5), mismo protocolo de un checkpoint por sección con parada explícita para confirmación del usuario.

---

### Corrección post-checkpoints: `reveal.ts` usaba 0.8s en `/metodologia`, el original usa 0.7s

Al empezar a revisar `equipo.html` para el inventario de la Fase 6, verifiqué su `setupReveal()` (línea 639) y encontré `transition: opacity .7s..., transform .7s...` — distinto del `.8s` que `reveal.ts` tiene hardcodeado. Grepeé `el.style.transition = 'opacity` en los 5 archivos originales para confirmar el patrón real antes de asumir nada:

| Página | Duración real |
|---|---|
| `index.html` (home) | 0.8s |
| `sobre-nosotros.html` (reveal principal) | 0.8s |
| `metodologia.html` | **0.7s** |
| `equipo.html` | **0.7s** |
| `programas.html` (aún no construida) | 0.95s |

`reveal.ts` nunca parametrizó la duración (solo threshold/rootMargin/repeat), así que los 5 checkpoints ya construidos de `/metodologia` (4a-4e) usaron 0.8s en vez del 0.7s real — un desajuste sutil (100ms) pero real, no una licencia creativa. Corregido: `reveal.ts` ahora acepta `duration` (ms, default 800 preservando el comportamiento de home/sobre-nosotros sin tocarlas), y los 5 componentes de `/metodologia` (`Hero`, `Importancia`, `Fases`, `Competencias`, `CtaFinal`) ahora pasan `duration: 700`. Reverificado: `grep -c 'style="'` → 0 en los 5 · `astro check` → 0/0/0 · `npm run build` → OK. `equipo.astro` se construirá desde el inicio con `duration: 700` ya correcto (mismo valor que metodología, confirmado en su propio `setupReveal()`).

---

## Checkpoint 5a — `equipo.astro`: Hero (completado 2026-07-09)

Archivos: `src/components/equipo/Hero.astro`, `src/pages/equipo.astro`. Primera sección de la quinta página de la Fase 6. Inventario completo de `equipo.html` confirmado: Hero Equipo → Equipo Directivo → Equipos por área (3 secciones, **sin CTA final** — termina directo en footer, a diferencia de `/metodologia`).

Verificado contra `equipo.html` líneas 99-113 (markup) y 761-762 (`applyResponsive()`, tamaño de `h1`).

### Animación de entrada `eqFadeUp` → `reveal.ts`, mismo criterio que los otros 3 heroes

Igual que en home/sobre-nosotros/metodología, el original anima el hero al cargar con un `@keyframes eqFadeUp` + `animation-delay` fijo por elemento (badge 0.1s, h1 0.27s, p 0.46s). No porté el keyframe: usé `data-reveal`+`data-delay` (100/270/460ms) vía `reveal.ts`, que dispara casi de inmediato en un elemento ya visible al cargar — mismo razonamiento ya documentado en el Checkpoint 4a. `activeDropdown="conocenos"` (ya soportado por `Header.astro` desde antes, sin cambios necesarios ahí).

### Autocorrección: no inventar breakpoints de mobile sin verificar

Al armar el CSS responsivo escribí primero un `@media(max-width:639.98px)` con `padding`/`min-height`/tamaño de párrafo "razonables" por analogía con otras páginas. Antes de presentar el checkpoint, grepeé `applyResponsive()` de `equipo.html` completo y solo encontré un ajuste real: `h1.style.fontSize = w<640?'40px':w<900?'48px':'58px'` (línea 762) — ni padding, ni min-height, ni tamaño de párrafo cambian en el original. Quité todo lo inventado y dejé solo los 2 breakpoints de `h1` verificados (con `48px`, no los `50px` que había puesto al inicio por analogía con metodología).

### Corrección post-confirmación: imagen del hero se veía borrosa — resolución generada insuficiente

Confirmaste el checkpoint y luego señalaste que la foto se veía borrosa. Causa: le pasé `width={1600} height={1120}` al `<Image>` para una foto de fondo a pantalla completa (`object-fit:cover`, `position:absolute;inset:0`) — en monitores de 1920px o más el navegador escala la imagen de 1600px hacia arriba, generando el desenfoque. Aumentado a `width={2400} height={1600}` (proporción 1.5, igual a la nativa de la foto 5729×3819), nítido hasta pantallas ~2400px de ancho. Verificado con Playwright (`naturalWidth`/`naturalHeight` del `<img>` renderizado) que el navegador efectivamente descarga y decodifica la imagen a esa resolución antes de confirmar visualmente.

| Comportamiento/animación | Disparador | Implementado en |
|---|---|---|
| Entrada del badge/h1/p (100/270/460ms) | `IntersectionObserver` threshold 0.08, rootMargin -4%, una sola vez, duración 0.7s | `reveal.ts` con `data-delay` |
| "Conócenos" resaltado en teal en el nav | — | `activeDropdown="conocenos"` (ya existía en `Header.astro`) |
| Tamaño de `h1` responsivo (58px→48px→40px) | resize, breakpoints 899.98px/639.98px | CSS, verificado contra `applyResponsive()` línea 762 |

**Verificaciones:** `grep -c 'style="'` → 0 · `astro check` → 0 errores/0 warnings/0 hints · `npm run build` → OK (4 páginas; foto de equipo optimizada de 504KB a 211KB a la resolución corregida). Usuario confirmó nitidez tras el ajuste.

---

## Checkpoint 5b — `equipo.astro`: Equipo Directivo (completado 2026-07-09)

Archivos: `src/components/equipo/EquipoDirectivo.astro`, `src/scripts/flip-cards.ts`. 9 tarjetas volteables (Ivonne Angarita, Daniel Corzo, Jorge Toledo, Renzo Cuadra, Francisco Rey, Julián Amorocho, María Paz Cuadra, Diana Rodríguez, Erika Gaspar), 5 temas de color reutilizados (purple/teal/gold/orange/violet).

Verificado contra `equipo.html` líneas 116-306 (markup) y 655-684 (`setupEquipo()`, mecánica de volteo) y 755 (`applyResponsive()`, columnas del grid).

### 4 de 9 directivos no tienen foto real — decisión del usuario

`<image-slot>` es un custom element exclusivo de la herramienta de mockup (confirmado leyendo `image-slot.js`: placeholder de imagen rellenable dentro del editor, no forma parte del sitio real). De los 9 directivos, 5 tienen `src` real apuntando a un archivo en `assets/` (Daniel, Renzo, Francisco, Julián, Erika) y 4 no tienen ningún `src` — son placeholders vacíos sin foto real en el material fuente (Ivonne, Jorge, María Paz, Diana). Se le preguntó al usuario cómo resolverlo; eligió **placeholder con iniciales** sobre el degradado de color propio de cada tarjeta (mismo degradado que ya usa el reverso), tanto en la foto del frente como en el avatar circular del reverso.

### `syncAvatar()` no se portó: era exclusiva de `<image-slot>`

El original copia en runtime la imagen ya cargada en el `<image-slot>` del frente hacia el `background-image` del avatar del reverso (leyendo el shadow DOM del custom element). Como ahora ambos lados usan directamente el mismo recurso importado vía `astro:assets` (o el mismo placeholder de iniciales), no hace falta ninguna sincronización en runtime — cada cara referencia su propia fuente ya en tiempo de build.

### Volteo: CSS puro en desktop, JS solo para el "candado" de click/touch

`[data-flipcard]:hover [data-flipinner]:not([data-locked])` es 100% CSS (`@media(hover:hover)`) en el original — sin JS. El click añade un candado (`data-locked` + `style.transform` inline) que mantiene la tarjeta abierta incluso sin hover, útil en touch pero funciona igual en desktop. Repliqué la parte CSS tal cual y porté el candado a `flip-cards.ts` usando `classList.toggle('is-locked'/'is-open')` en vez de mutación de `style` — el hard rule de "solo JS para valores continuos" no aplica acá porque el flip es un estado binario (abierto/cerrado), igual que el resto de componentes con estado discreto del proyecto.

### Fidelidad sutil confirmada: el degradado del scrim varía según si el directivo tiene foto o no

Comparando el `linear-gradient` del overlay de cada tarjeta directivo por directivo (mismo tema de color, ej. Ivonne vs Erika ambas "purple"), encontré que los stops difieren: `.55/30%/62%` en las 5 tarjetas CON foto real vs `.6/35%/68%` en las 4 SIN foto — una distinción sistemática, no ruido aleatorio. Preservada como dos variantes (`scrim--photo`/`scrim--placeholder`) en vez de unificarlas.

### Autocorrección: breakpoints inventados de padding/h2 removidos antes de presentar

Por analogía con otras secciones había agregado `padding` reducido y un tamaño intermedio de `h2` a 767.98px sin verificarlos. Grepeé `applyResponsive()` de `equipo.html` completo: el único ajuste real para esta sección es `teamH2.style.fontSize = w<415?'28px':'40px'` (un solo breakpoint, sin escalón intermedio, y sin cambios de padding). Corregido antes de mostrar el checkpoint.

| Comportamiento/animación | Disparador | Implementado en |
|---|---|---|
| Entrada del badge/h2/p (0/160/300ms) | `IntersectionObserver` threshold 0.12, rootMargin -6%, duración 0.7s, una sola vez | `reveal.ts` |
| Volteo 3D de la tarjeta | hover (desktop, `@media(hover:hover)`) | CSS puro |
| Volteo "fijado" | click (desktop y touch) | `flip-cards.ts`, clases `.is-locked`/`.is-open` |
| Grid responsivo (3→2→1 columnas) | resize, breakpoints 979.98px/619.98px | CSS, verificado línea 755 |

**Verificaciones:** `grep -c 'style="'` → 0 · `astro check` → 0 errores/0 warnings/0 hints · `npm run build` → OK (4 páginas; fotos de tarjeta ~600KB→~16KB, avatares circulares ~2KB). Verificado visualmente con Playwright: grid 3/2/1 columnas, hover con foto real, hover con placeholder de iniciales, mobile. Usuario confirmó.

---

## Checkpoint 5c — `equipo.astro`: Equipos por área (completado 2026-07-09)

Archivos: `src/components/equipo/EquiposPorArea.astro`, `src/scripts/area-tabs.ts`. 7 tabs de área, 1 con 5 integrantes reales (Marca y Comunicaciones), 6 vacíos con 3 placeholders "Integrante por confirmar" cada uno.

Verificado contra `equipo.html` líneas 306-493 (markup) y 689-723 (`setArea()`, parte de `setupEquipo()`) y línea 755 (mismo `cols` de `applyResponsive()` que Equipo Directivo, reutilizado para `[data-areagrid]`).

### Inconsistencia real: el nombre del líder de Marca y Comunicaciones no coincide con su propia tarjeta

El panel de esta sección dice "Liderado por **Julián Amorocho Becerra**" (línea 361), pero la tarjeta de Julián en Equipo Directivo (Checkpoint 5b) dice solo "**Julián Amorocho**" (sin el segundo apellido). Confirmado que es la misma persona (mismo rol, Director de Marca y Comunicaciones) — una inconsistencia real del original, no un error mío; preservada tal cual en cada lugar.

### La teoría del scrim por presencia de foto (Checkpoint 5b) no se sostiene en este panel

En Equipo Directivo, el degradado del scrim variaba sistemáticamente según si el directivo tenía foto real (`.55/30%/62%`) o no (`.6/35%/68%`). Verifiqué línea por línea las 5 tarjetas de "Marca y Comunicaciones" esperando el mismo patrón: **no se cumple** — Mariana y Elba SÍ tienen foto real pero sus scrims usan igual `.6/35%/68%` que Laura/Liam/Juan Camilo (sin foto). Es decir, las 5 tarjetas de este panel usan un único degradado, sin distinción. Documentado como hallazgo nuevo (no se puede generalizar la regla de 5b a todo el sitio); implementado con una sola clase `.scrim` en este componente en vez de las dos variantes de `EquipoDirectivo.astro`.

### Elba Méndez: foto hardcodeada, no `<image-slot>`

A diferencia de los demás integrantes (que usan `<image-slot>`, el placeholder de imagen exclusivo del mockup), la foto de Elba está directamente hardcodeada como `background:url('assets/foto-elba.png') top center/cover no-repeat` en un `<div>` — un caso real y distinto de los demás, aunque el resultado final es el mismo (una foto real vía `astro:assets`), no cambió nada en la implementación.

### Reutilización de `flip-cards.ts`, CSS de tarjetas casi duplicado a propósito

El mecanismo de volteo (`attachFlipCards`) se reutiliza sin cambios desde el Checkpoint 5b, pasándole la sección completa como root (detecta cualquier `[data-flipcard]`, incluidos los 5 de este panel). El CSS de las tarjetas (temas, caras, avatar, etc.) se duplicó casi íntegro entre `EquipoDirectivo.astro` y `EquiposPorArea.astro` en vez de extraerlo a un módulo compartido — consistente con el resto del proyecto, donde cada componente de sección es dueño de todo su CSS sin depender de clases globales entre componentes.

| Comportamiento/animación | Disparador | Implementado en |
|---|---|---|
| Entrada del badge/h2/p (0/160/300ms) | `IntersectionObserver` threshold 0.12, rootMargin -6%, duración 0.7s | `reveal.ts` |
| Selección de área por click | click en tab | `area-tabs.ts`, default "Marca y Comunicaciones" (índice 3) |
| Fade+slide del panel activo | cambio de área | `area-tabs.ts` vía `.is-active`/`.is-visible` |
| Volteo de las 5 tarjetas reales | hover/click | `flip-cards.ts` (mismo módulo que Equipo Directivo) |
| Grid responsivo (3→2→1 columnas) | resize, breakpoints 979.98px/619.98px | CSS |

**Verificaciones:** `grep -c 'style="'` → 0 · `astro check` → 0 errores/0 warnings/0 hints · `npm run build` → OK (4 páginas; foto de Mariana 749KB→26KB, foto de Elba 804KB→12KB). Verificado visualmente con Playwright: panel por defecto (Marca y Comunicaciones), cambio a panel vacío (Administrativo y Financiero, placeholders + footer inmediatamente después, sin CTA), mobile 1 columna. Usuario confirmó.

---

## `equipo.astro` — página completa (3 de 3 secciones)

Con Equipos por área, `/equipo` queda completa: Hero → Equipo Directivo (9 tarjetas volteables) → Equipos por área (7 tabs, 1 con integrantes reales). Van 3 de 6 páginas terminadas (`/sobre-nosotros`, `/metodologia`, `/equipo`). Siguiente hito de la Fase 6: iniciar `programas.astro` (Checkpoint 6), mismo protocolo de un checkpoint por sección con parada explícita para confirmación del usuario.

---

## Inventario de `programas.html` — arquitectura de dos "tracks"

Antes de construir, se hizo el inventario completo: esta página es sustancialmente más grande y estructuralmente distinta de las anteriores. El selector "Para personas"/"Para empresas" del Hero no solo cambia el texto del hero — oculta/muestra **dos bloques completos de secciones** vía `[data-track]`:

- **Track "personas"** (visible por defecto, 10 secciones): Aprender haciendo → Elige tu ruta (`#rutas`) → CTA Empresas (banner) → Así aprenderás → Qué desarrollarás → Información del programa → Inversión → Por qué CLAP → Dirigido a → Metodología (stepper) → CTA Final.
- **Track "empresas"** (oculto por defecto, 3 secciones): Círculo Empresas que Lideran (`#empresas-circulo`) → Laboratorio de Innovación (`#empresas-laboratorio`) → Empresas · CTA Final.
- Hero y Footer son compartidos (no pertenecen a ningún track).

Total: Hero + 10 + 3 + Footer = 15 secciones. Se seguirá construyendo en el mismo orden del documento (que ya agrupa personas antes de empresas), un checkpoint por sección.

`reveal.ts` de esta página usa una quinta combinación de parámetros, confirmada en su propio `setupReveal()` (línea 1733): threshold 0.15, rootMargin -12%, duración 0.95s, **se repite** (como home, a diferencia de sobre-nosotros/metodología/equipo), distancias 46px vertical/58px horizontal (mayores a las 34/36px de las demás páginas), y easing `cubic-bezier(.16,.8,.3,1)` (distinto del `cubic-bezier(.2,.7,.2,1)` usado en todas las demás). `reveal.ts` generalizado una vez más para aceptar `distanceY`/`distanceX`/`easing` como parámetros opcionales (default = valores ya usados, no afecta páginas previas).

---

## Checkpoint 6a — `programas.astro`: Hero (completado 2026-07-09)

Archivos: `src/components/programas/Hero.astro`, `src/scripts/track-toggle.ts`, `src/scripts/countdown.ts`, `src/scripts/countdown-position.ts`, `src/pages/programas.astro` (con los dos contenedores `data-track` vacíos, listos para recibir secciones). Utilidad compartida `.is-track-hidden` agregada a `global.css` (cruza los límites de varios componentes, no puede vivir en un `<style>` scopeado).

Verificado contra `programas.html` líneas 142-259 (markup), 1281-1322 (`setTrack()`/`selectTrack()`), 1666-1716 (`setupCountdown()`), 1886-1928 (`positionCountdown()`) y fragmentos de `applyResponsive()` (líneas 1943-1961, 2191-2194, 2284-2307).

### Dos hallazgos de código muerto, ninguno portado

1. **CTA flotante "sticky"** (`data-stickycta`): `setupSticky()` está completamente implementado (aparece/desaparece según scroll) y hasta tiene un prop de configuración (`stickyCta`, default `true`) en el editor, pero grepeé el markup completo y el atributo `data-stickycta` nunca aparece en ningún elemento — inalcanzable, mismo patrón que el modal del diagrama en metodología (Checkpoint 4d).
2. El wrapper `<sc-if value="{{ showCountdown }}">` alrededor de la tarjeta de cuenta regresiva es el toggle de visibilidad del editor de mockups (default `true`); como no es una condición real del sitio final, se renderiza siempre.

### El `h1` sí se resizea en mobile — encontrado tarde, corregido tras confirmación del usuario

Al armar el Hero busqué `querySelector('h1')` en `applyResponsive()` y no until encontré nada en el primer barrido (la función es enorme, ~370 líneas, con reglas para secciones que ni siquiera existen todavía en el proyecto). El checkpoint se presentó sin ningún ajuste de tamaño de `h1` para mobile. El usuario reportó que el título se veía "algo grande" en mobile — al revisar de nuevo con más cuidado encontré la regla real en la línea 2192: `querySelectorAll('h1')` (con **s**, agarra ambas variantes personas/empresas) con `w<640?'38px':w<900?'46px':'58px'`. También había una reducción de `padding-top` del Hero a 92px (desde 158px) en `w<560` (línea 2194) que tampoco había portado. Ambas corregidas con `@media` puro. Lección: en páginas con `applyResponsive()` muy largas, no basta un solo grep rápido — hay que releer la función completa antes de dar un checkpoint por cerrado, no solo la parte que a simple vista parece relevante a la sección en construcción.

### Countdown: fecha real, cuenta activa

Cuenta regresiva hasta el 1 de agosto de 2026, 23:59:59 (hora Colombia, UTC-5) — con la fecha actual del proyecto (9 de julio de 2026) sigue vigente y corriendo. Pinta ceros, espera 350ms, hace un "roll-up" de 1.1s (ease-out cúbico) desde 0 hasta el valor real, y arranca el conteo en vivo cada 1s. La tarjeta de cuenta regresiva **no se oculta** al cambiar a la variante "empresas" — confirmado que el original no tiene ningún toggle de visibilidad para `[data-cdcell]` ligado al track, solo reposicionamiento por ancho.

### Reposicionamiento de la tarjeta: 3 estados reales, no 2

`positionCountdown()` mueve la tarjeta a 3 posiciones distintas según ancho: ≥980px vive en su propia columna del grid; 560-979px se mueve justo DESPUÉS del párrafo activo (`insertAdjacentElement('afterend', ...)`); <560px se mueve justo ANTES del párrafo (`insertAdjacentElement('beforebegin', ...)`) — es decir, entre el h1 y el párrafo, no en el mismo lugar que la posición de tablet. Repliqué las 3 posiciones exactas con `countdown-position.ts`, recalculando también al cambiar de track (ya que cada variante tiene su propio párrafo `[data-heropara]`) vía un evento personalizado `programas:track-change` disparado por `track-toggle.ts`.

### Reordenamiento de chips: CSS puro, sin JS

El original reordena las 3 tarjetas de datos (`data-herofacts`/`data-herofacts-emp`) en mobile vía `style.order`/`style.gridColumn` en JS. Como es un conjunto fijo y conocido (siempre 3 ítems, mismo orden de reordenamiento cada vez), se replicó con `:nth-child()` + `order`/`grid-column` en CSS puro — sin necesidad de JS. Nota real: el patrón de reordenamiento es DISTINTO entre personas (ítems 1 y 3 arriba, ítem 2 abajo a ancho completo) y empresas (ítems 1 y 2 arriba, ítem 3 abajo a ancho completo) — no es la misma regla aplicada dos veces.

### `track-toggle.ts`: no se reimplementó el "catch-up" manual de reveals

El original, al cambiar de track, recalcula manualmente qué elementos del track recién mostrado ya están en viewport y los revela sin esperar al `IntersectionObserver`. No se portó: como `reveal.ts` ya usa `repeat:true` en esta página, el observer nativo vuelve a evaluar la intersección automáticamente en cuanto el `display:none` del ancestro cambia — no hace falta duplicar esa lógica a mano.

| Comportamiento/animación | Disparador | Implementado en |
|---|---|---|
| Entrada del hero completo | `IntersectionObserver` threshold 0.15, rootMargin -12%, duración 0.95s, se repite, distancias 46/58px | `reveal.ts` |
| Selector "Para personas"/"Para empresas" | click | `track-toggle.ts`, vía `.is-track-hidden` |
| Cuenta regresiva | carga de página | `countdown.ts` |
| Reposición de la tarjeta de cuenta regresiva | resize + cambio de track | `countdown-position.ts`, 3 posiciones |
| Reordenamiento de chips informativos | resize, <560px | CSS puro |
| Tamaño de `h1` responsivo (58px→46px→38px) | resize, breakpoints 899.98px/639.98px | CSS, corregido post-confirmación |

**Verificaciones:** `grep -c 'style="'` → 0 · `astro check` → 0 errores/0 warnings/0 hints · `npm run build` → OK (5 páginas; imagen de fondo optimizada de 416KB a 118KB). Verificado visualmente con Playwright: track personas, track empresas, mobile (con el fix de `h1` aplicado). Usuario confirmó tras la corrección.

---

## Checkpoint 6b — `programas.astro`: Aprender haciendo (completado 2026-07-09)

Archivos: `src/components/programas/AprenderHaciendo.astro`, `src/scripts/manif-collapse.ts`, `src/scripts/manif-cards-position.ts`.

Verificado contra `programas.html` líneas 264-304 (markup), 1796-1826 (`toggleManif()`/`applyManifCollapse()`) y fragmentos de `applyResponsive()` (líneas 2086-2123).

### `style-before` → `::before` real con la técnica de máscara para el borde degradado

El mockup usa un atributo propio (`style-before`) para simular un pseudo-elemento `::before`; lo repliqué como un `::before` real con la técnica estándar de "borde degradado" (`padding` + `mask-composite:exclude`), parametrizando el color por tarjeta con una custom property (`--border-grad`) en vez de 4 reglas `::before` casi idénticas.

### "Ver más/Ver menos": `maxHeight` medido en JS (legítimo), el resto vía `classList`

El bloque de párrafos empieza colapsado solo en mobile (<560px; en desktop el botón está oculto por CSS y el texto siempre completo). El alto real (`scrollHeight`) es un valor continuo que solo se puede medir en runtime, así que se mantuvo la mutación directa de `style.maxHeight` (mismo criterio que otros casos ya documentados de "valor continuo, no enumerable"). Todo lo demás (opacidad del bloque, rotación del chevron, texto "Ver más"/"Ver menos") se resolvió con `classList.toggle('is-open')` + CSS, sin mutación adicional de `style`.

### Reubicación de las 4 tarjetas: JS solo para el `insertAdjacentElement`, todo lo demás CSS puro

En mobile las tarjetas se mueven completas entre el título y el bloque de texto (orden visual: título → tarjetas → texto). Es el único motivo real para usar JS acá (reparentado de DOM, mismo patrón que Importancia/Hero de esta página). El resto de los ajustes de ese mismo bloque de `applyResponsive()` (columnas del grid de tarjetas, gap, padding, tamaño de ícono/`h3`/`p`, tamaño de `h2`) son valores estáticos por breakpoint — todos implementados en CSS puro, sin tocar `manif-cards-position.ts` para nada de eso.

| Comportamiento/animación | Disparador | Implementado en |
|---|---|---|
| Entrada del texto/tarjetas | `IntersectionObserver` threshold 0.15, rootMargin -12%, duración 0.95s, se repite | `reveal.ts` |
| "Ver más/Ver menos" (solo mobile) | click | `manif-collapse.ts` |
| Reubicación de las 4 tarjetas | resize, breakpoint 559.98px | `manif-cards-position.ts` |
| Bordes degradados de las tarjetas | — | `::before` + técnica de máscara CSS |
| Compactación mobile (padding/ícono/tipografía) | resize, breakpoint 559.98px | CSS puro |

**Verificaciones:** `grep -c 'style="'` → 0 · `astro check` → 0 errores/0 warnings/0 hints · `npm run build` → OK (5 páginas). Verificado visualmente con Playwright: desktop, mobile con tarjetas reubicadas y texto colapsado, y estado abierto tras click en "Ver más". Usuario confirmó.

---

## Checkpoint 6c — `programas.astro`: Elige tu ruta (completado 2026-07-09)

Archivos: `src/components/programas/Rutas.astro`, `src/scripts/prog-selector.ts`.

Verificado contra `programas.html` líneas 306-450 (markup), 1236-1247/1412-1502 (`setupProg()`/`setProg()`/`staggerDevel()`) y 1828-1884 (`layoutProgAccordion()`).

### Autocorrección: 3 usos de `style={...}` inline detectados antes de presentar el checkpoint

Al armar el color por programa (una custom property `--c` por tarjeta/panel) y el tamaño del logo-box (78px vs 64px), escribí primero `style={\`--c:${p.color}\`}` y `style={\`width:${p.logoBoxSize}px...\`}` en 3 lugares — inline styles reales en el HTML compilado. Como es un conjunto fijo y pequeño (3 programas, 2 tamaños de logo-box), se corrigió con clases modificadoras (`tab--comunidad/sostenibilidad/impacto`, `panel--*`, `panel-logo-box--*`) antes de correr cualquier verificación, mismo criterio que Fases.astro. Los campos `color`/`scrimRgb`/`logoBoxSize` quedaron sin uso en los datos tras el cambio y se eliminaron del tipo `Program`.

### Desktop = tabs, mobile = acordeón: no es el mismo componente con distinto CSS, es lógica distinta

Verificado en el propio JS: en desktop (≥900px) hover o click cambian cuál de los 3 paneles se muestra, siempre exactamente uno visible, todos viviendo en un mismo contenedor "stage" compartido. En mobile (<900px) es un acordeón real: click expande el panel de esa tab reparentándolo justo después de su propio botón (`insertAdjacentElement`), un segundo click sobre la misma tab lo colapsa (`setProg(-1)`, ningún panel abierto), y el estado inicial en mobile es "todo colapsado" (no la primera tab abierta como en desktop). `prog-selector.ts` implementa ambos modos en un solo módulo reutilizable (recibe los selectores por parámetro), ya que la sección "Círculo Empresas que Lideran" (aún no construida) usa el mismo mecanismo exacto sobre sus propios datos.

### Chevron: HTML real siempre presente, no creado dinámicamente

El original crea el ícono de chevron por JS (`document.createElement`) la primera vez que se necesita. Se optó por renderizarlo siempre como parte del HTML de cada tab (oculto por CSS en desktop, visible en mobile vía `@media`) — evita DOM generado en runtime para algo que es parte fija del diseño, más alineado con "HTML semántico real" que la técnica del original.

### Stagger de "Lo que desarrollarás": primera vez por scroll, después inmediato

Los 5 ítems de cada panel entran con `translateX(-12px)→0` escalonado 100ms entre uno y otro. La PRIMERA vez que la sección entra en viewport (`IntersectionObserver` threshold 0.15 sobre el stage completo) dispara el stagger del panel que esté activo en ese momento; cambios de programa DESPUÉS de ese primer disparo staggean de inmediato sin depender de scroll. Repliqué exactamente ese orden de eventos (bandera `everSeen`), no un simple "siempre al cambiar de tab".

### Inconsistencias reales preservadas entre los 3 programas

Verificadas línea por línea, no es la misma tarjeta repetida 3 veces: el panel de Comunidad no tiene el anillo decorativo (`has-ring`) que sí tienen Sostenibilidad e Impacto institucional; su logo-box es más grande (78px vs 64px, con imagen interna de 60px vs 46px); su segundo párrafo de descripción usa `#FFFFFF` puro mientras los otros dos usan `rgba(255,255,255,.82)`; y Sostenibilidad tiene una capa oscura extra (`rgba(4,26,16,.42)`) que los otros dos no tienen. Todo modelado explícitamente en los datos (`hasRing`, `hasExtraDarkOverlay`, campos separados de logo), no inferido de un patrón único.

| Comportamiento/animación | Disparador | Implementado en |
|---|---|---|
| Entrada de texto/tabs | `IntersectionObserver` threshold 0.15, rootMargin -12%, duración 0.95s, se repite | `reveal.ts` |
| Selección de programa (desktop) | hover o click | `prog-selector.ts` |
| Acordeón (mobile) | click, reparenta el panel bajo su tab | `prog-selector.ts` |
| Chevron por tab (solo mobile) | según estado activo | CSS puro |
| Stagger de "Lo que desarrollarás" | primera vez en viewport, luego en cada cambio | `prog-selector.ts` |

**Verificaciones:** `grep -c 'style="'` → 0 · `astro check` → 0 errores/0 warnings/0 hints · `npm run build` → OK (5 páginas; logos e imágenes de fondo optimizados, ej. fotos ~300-620KB → ~37-47KB). Verificado visualmente con Playwright: hover en los 3 programas (desktop), acordeón colapsado y expandido (mobile). Usuario confirmó.

---

## Checkpoint 6d — `programas.astro`: banner "Para empresas" (completado 2026-07-09)

Archivo: `src/components/programas/CtaEmpresasBanner.astro`. Sección pequeña (`data-screen-label="Para empresas"`, líneas 452-464 del original) entre "Elige tu ruta" y "Así aprenderás" — no estaba en el pedido explícito del usuario, se identificó al revisar el orden real del documento antes de saltar a la siguiente sección grande.

### `track-toggle.ts` generalizado: el trigger real es `[data-go]`, no `[data-trackbtn]`

El CTA de este banner (`<a href="#" data-go="empresas">`) reutiliza el mismo `setTrack()` que los botones del Hero, pero SIN ser una pestaña visual (no tiene `data-trackbtn`, no debe pintarse como activa/inactiva). Verificado en el original: el handler compartido (`selectTrack`) lee `data-go`, no `data-trackbtn` — ese último solo se usa para la clase de pestaña activa. Generalizado `track-toggle.ts` para escuchar cualquier `[data-go]` (botones del hero incluidos, que ahora llevan ambos atributos) y reservar `[data-trackbtn]` solo para el estilo visual de pestaña.

| Comportamiento/animación | Disparador | Implementado en |
|---|---|---|
| Entrada de texto/CTA | `IntersectionObserver` threshold 0.15, rootMargin -12%, duración 0.95s, se repite | `reveal.ts` |
| CTA "Conocer los programas con beneficios" | click | `track-toggle.ts` vía `data-go="empresas"`, cambia de track y hace scroll al top |

**Verificaciones:** `grep -c 'style="'` → 0 · `astro check` → 0 errores/0 warnings/0 hints · `npm run build` → OK (5 páginas). Verificado con Playwright: click en el CTA cambia correctamente al track "empresas" (confirmado visualmente que el Hero muestra la variante empresas tras el click) y hace scroll al top. Usuario confirmó.

---

## Checkpoint 6e — `programas.astro`: Así aprenderás (completado 2026-07-09)

Archivo: `src/components/programas/AsiAprenderas.astro`.

Verificado contra `programas.html` líneas 466-519 (markup) y fragmentos de `applyResponsive()` (líneas 2125-2137, 2205-2209, 2279-2280).

Sección más simple que "Elige tu ruta" (sin selector interactivo): 2 tarjetas fijas (Etapa 1 "Formación especializada" / Etapa 2 "Consultoría real"), cada una con encabezado de degradado + 3 ítems de checklist. Reutiliza el mismo fondo decorativo (nubes/anillos/grain + degradado animado) que "Elige tu ruta" — repliqué los keyframes de nuevo, scopeados al componente, consistente con el aislamiento por componente ya establecido en el resto del proyecto.

### El degradado del encabezado es idéntico en ambas tarjetas — verificado, no es un error

Las 2 tarjetas usan el mismo `linear-gradient(120deg,#E5268E 0%,#2E6FE0 52%,#16A46A 100%)` en su encabezado, sin importar la etapa — solo cambian los colores de borde/sombra/checklist por tarjeta (rosa para Etapa 1, azul para Etapa 2). Preservado tal cual, sin inventar un degradado propio por etapa.

| Comportamiento/animación | Disparador | Implementado en |
|---|---|---|
| Entrada de las 2 tarjetas (izquierda/derecha, delays 0/360ms) | `IntersectionObserver` threshold 0.15, rootMargin -12%, duración 0.95s, se repite | `reveal.ts` |
| Stagger del checklist dentro de cada tarjeta (0/90/180ms) | mismo observer | `reveal.ts` con `data-delay` anidado |
| Grid responsivo (2→1 columna) | resize, breakpoint 819.98px | CSS puro |
| Compactación del encabezado en mobile | resize, breakpoint 559.98px | CSS puro |

**Verificaciones:** `grep -c 'style="'` → 0 · `astro check` → 0 errores/0 warnings/0 hints · `npm run build` → OK (5 páginas). Verificado visualmente con Playwright: desktop (2 columnas) y mobile (1 columna, encabezado compactado). Usuario confirmó.

---

## Checkpoint 6f — `programas.astro`: Qué desarrollarás (completado 2026-07-09)

Archivo: `src/components/programas/QueDesarrollaras.astro`.

Verificado contra `programas.html` líneas 521-546 (markup) y `applyResponsive()` líneas 2138-2180.

Grid de 7 competencias (la primera, "Liderazgo", ocupa 2 columnas), cada una con ícono circular de color + borde degradado (misma técnica `::before`+máscara ya usada en varias secciones). En mobile (<560px) el grid deja de ser grid: se convierte en `display:flex;flex-wrap:wrap` con tarjetas-chip compactas que fluyen en filas según su contenido — verificado que es un cambio real de modo de layout, no solo una reducción de columnas como en otras secciones.

### Autocorrección: color del ícono por competencia iba inline

Al armar el ícono circular de cada competencia (7 colores, 2 de ellos repetidos) escribí primero `style={\`background:${skill.iconColor}\`}`. Corregido antes de cualquier verificación con clases `skill-icon--{key}` (un slug por competencia, no por color, ya que dos competencias comparten el mismo color pero son conceptualmente distintas).

| Comportamiento/animación | Disparador | Implementado en |
|---|---|---|
| Entrada de texto/tarjetas (stagger 0-420ms) | `IntersectionObserver` threshold 0.15, rootMargin -12%, duración 0.95s, se repite | `reveal.ts` |
| Bordes degradados de las tarjetas | — | `::before` + máscara CSS |
| Grid → chips compactos en mobile | resize, breakpoint 559.98px | CSS puro (grid→flex-wrap) |

**Verificaciones:** `grep -c 'style="'` → 0 · `astro check` → 0 errores/0 warnings/0 hints · `npm run build` → OK (5 páginas; imagen de fondo 368KB→101KB). Verificado visualmente con Playwright: desktop (grid 4 columnas) y mobile (chips compactos en filas). Usuario confirmó.

---

## Siguiente paso

## Checkpoint 6g — `programas.astro`: Información del programa (completado 2026-07-09)

Archivos: `src/components/programas/InformacionPrograma.astro`, `src/scripts/stat-card-fit.ts`.

Verificado contra `programas.html` líneas 548-614 (markup), líneas 58-76 (hover CSS de `[data-statgrid]`) y `applyResponsive()` líneas 2224-2278.

2 bloques: grid 2×2 de datos clave (duración/horas/modalidad/inicio) con hover que tiñe cada tarjeta con un degradado propio (texto e ícono a blanco), y una tarjeta con 4 bullets "Lo que hará distinta tu experiencia".

### Auto-fit de fuente en mobile: se portó el algoritmo real, no un tamaño fijo

En mobile (<560px) las tarjetas de datos pasan a layout horizontal (ícono junto al número). El original mide con un `<span>` invisible fuera de pantalla y busca el mayor tamaño (18px→11px) que quepa junto al ícono en las 4 tarjetas simultáneamente — un valor genuinamente calculado en runtime según el ancho real, no un breakpoint estático. Se portó el algoritmo completo en `stat-card-fit.ts` en vez de fijar un tamaño arbitrario. No se replicó el "forzar visible" que hace el original en mobile para compensar un bug de su propia animación de entrada (deja el bloque oculto/desplazado): `reveal.ts` no tiene ese bug, el `IntersectionObserver` dispara correctamente en cualquier tamaño de pantalla.

### Corrección post-confirmación: grid desbordado y auto-fit midiendo mal por el mismo motivo

El usuario reportó que en mobile el texto se veía grande y las tarjetas no quedaban centradas. Investigué con Playwright midiendo `boundingBox()` real: el `.stat-grid` (348px) era más ancho que su contenedor `.wrap` (279px) — un desborde real. Causa raíz: `.stat-num{white-space:nowrap}` (necesario para que "3 de agosto" no se parta) forzaba que la columna del grid no pudiera encogerse por debajo del contenido, porque CSS Grid usa `minmax(auto,1fr)` implícito en vez de `minmax(0,1fr)`. Esto desbordaba la columna derecha (por eso se veía "no centrada") y además hacía que `stat-card-fit.ts` midiera `card.clientWidth` ya expandido por el propio desborde, entrando en un bucle donde el algoritmo nunca reducía la fuente (por eso elegía 18px, el máximo, en vez de un tamaño que realmente cupiera). Corregido con `minmax(0,1fr)` en ambos niveles de grid (`.stat-grid` y `.stat-card` en mobile) + `min-width:0` en las celdas — verificado con Playwright que tras el fix `.stat-grid` mide exactamente 279px (igual que `.wrap`, sin desborde) y la fuente auto-ajustada baja a 13px.

| Comportamiento/animación | Disparador | Implementado en |
|---|---|---|
| Entrada del texto/tarjetas | `IntersectionObserver` threshold 0.15, rootMargin -12%, duración 0.95s, se repite | `reveal.ts` |
| Hover en las 4 tarjetas de datos | hover | CSS puro (`:hover`, sin `!important`) |
| Auto-ajuste del tamaño de número en mobile | resize, <560px | `stat-card-fit.ts` |

**Verificaciones:** `grep -c 'style="'` → 0 · `astro check` → 0 errores/0 warnings/0 hints · `npm run build` → OK (5 páginas). Verificado con Playwright: hover en las 4 tarjetas (desktop), y en mobile — antes y después del fix — `boundingBox()` del grid vs su contenedor y el `font-size` computado del auto-fit. Usuario confirmó tras la corrección.

---

## Checkpoint 6h — `programas.astro`: Inversión (completado 2026-07-09)

Archivo: `src/components/programas/Inversion.astro`.

Verificado contra `programas.html` líneas 617-666 (markup) y `applyResponsive()` líneas 2030-2065.

Tarjeta de precio (con descuento tachado + etiqueta de ahorro) + columna lateral (fechas clave, requisito de graduación, CTA de WhatsApp).

### Confirmado: `data-inscribebtn` no pertenece a esta sección

`applyResponsive()` referencia `[data-inscribebtn]` cerca de `[data-wabtn]`/`[data-savetag]`, pero al grepear el markup completo encontré que ese atributo vive en la sección "Por qué CLAP" (línea 775, CTA "Inscribirme a la comunidad"), no en la tarjeta de precio de esta sección — el botón "Quiero inscribirme" de acá nunca lo lleva. Se dejó pendiente para el próximo checkpoint, no se portó nada aquí.

### Verificado: esta sección NO tiene reducción de padding/`h2` en mobile — a diferencia de la mayoría

Grepeé `programas.html` completo por "Inversión" buscando una regla de `paddingTop`/`paddingBottom` como la que sí tienen "Aprender haciendo", "Para empresas", "Así aprenderás", etc., y no existe ninguna para esta sección ni para su `h2` (no tiene atributo `data-*h2`, y no hay una regla `querySelectorAll('h2')` genérica en toda la página). Se dejó el padding y el tamaño de `h2` fijos en todos los anchos, aplicando la lección del Checkpoint 6g de no inventar breakpoints no verificados.

| Comportamiento/animación | Disparador | Implementado en |
|---|---|---|
| Entrada de texto/tarjeta/fechas (stagger anidado) | `IntersectionObserver` threshold 0.15, rootMargin -12%, duración 0.95s, se repite | `reveal.ts` |
| Hover en botones | hover | CSS puro |
| Precio tachado + etiqueta de ahorro: fila→columna | resize, <560px | CSS puro |

**Verificaciones:** `grep -c 'style="'` → 0 · `astro check` → 0 errores/0 warnings/0 hints · `npm run build` → OK (5 páginas). Verificado con Playwright: `boundingBox()` del grid vs su contenedor en mobile (sin desborde, lección aplicada del checkpoint anterior) y capturas desktop/mobile. Usuario confirmó.

---

## Checkpoint 6i — `programas.astro`: Por qué CLAP (completado 2026-07-09)

Archivo: `src/components/programas/PorQueClap.astro`.

Verificado contra `programas.html` líneas 668-711 (markup), líneas 51-57 (hover CSS de `[data-why]`) y `applyResponsive()` líneas 2002-2005/2215-2223.

Grid de 3 columnas × 2 filas: 4 tarjetas normales + 1 tarjeta ancha (span 2, fondo morado estático, sin efecto hover de color). La 4ª tarjeta ("Construyes una red latinoamericana") tiene borde/sombra realzados en reposo (`--highlighted`), distinto de las otras 3 — verificado, no es casualidad.

### Bug real encontrado y corregido: el `!important` del original no era arbitrario

Repliqué el hover inicialmente con CSS puro sin `!important` (siguiendo la práctica general del proyecto de evitarlo). Al verificar con Playwright (`getComputedStyle` durante hover simulado) encontré que `background`/`color` sí cambiaban pero `transform`/`box-shadow` de la tarjeta NO — permanecían en `none`. Causa: las tarjetas llevan `data-reveal` para la animación de entrada, y `reveal.ts` fija `el.style.transform` **inline** una vez reveladas; un estilo inline tiene más especificidad que cualquier regla de hoja de estilos, incluida `:hover`, a menos que esa regla use `!important`. Es exactamente la misma razón por la que el original necesitaba `[data-why]:hover{transform:...!important}` — no era una licencia del autor, era necesario por esa misma interacción con su propio sistema de reveal. Repuesto `!important` puntualmente solo en esa declaración, con comentario explicando el motivo (no es evidente sin conocer cómo funciona `reveal.ts`).

| Comportamiento/animación | Disparador | Implementado en |
|---|---|---|
| Entrada de texto/tarjetas | `IntersectionObserver` threshold 0.15, rootMargin -12%, duración 0.95s, se repite | `reveal.ts` |
| Hover en las 4 tarjetas normales | hover | CSS puro (con `!important` puntual, ver nota arriba) |
| Grid responsivo (3→2→1 columnas) | resize, breakpoints 979.98px/719.98px | CSS puro |

**Verificaciones:** `grep -c 'style="'` → 0 · `astro check` → 0 errores/0 warnings/0 hints · `npm run build` → OK (5 páginas). Verificado con Playwright: `getComputedStyle` de `transform`/`background`/`color` durante hover simulado, antes y después del fix; capturas desktop/mobile. Usuario confirmó.

---

## Siguiente paso

## Checkpoint 6j — `programas.astro`: Dirigido a (completado 2026-07-09)

Archivo: `src/components/programas/DirigidoA.astro`.

Verificado contra `programas.html` líneas 713-777 (markup), líneas 79-83 (hover CSS de `[data-dirigidocards]>div`) y `applyResponsive()` líneas 1962-1974.

4 tarjetas con foto de fondo (Profesionales/Sector Público/Organizaciones Sociales/Jóvenes Líderes); las 2 del medio ("Sector Público", "Organizaciones Sociales") son clicables y llevan a `data-go="empresas"` (cambian el track del Hero), las otras 2 no. Cierra con una píldora de estadística + el CTA `data-inscribebtn` ("Inscribirme a la comunidad") que había quedado pendiente desde el Checkpoint 6h.

### Limpieza: `attachTrackToggle()` no necesita llamarse en cada componente

Antes de construir noté que `CtaEmpresasBanner.astro` (Checkpoint 6d) llamaba `attachTrackToggle(section)` sobre su propia sección — redundante, porque `Hero.astro` ya la registra sobre `document`, y como los `<script type="module">` se difieren hasta que el DOM completo está parseado, su `querySelectorAll("[data-go]")` ya alcanza cualquier `[data-go]` de toda la página sin importar en qué componente se renderice. Limpiado ese caso y no repetido acá — verificado con Playwright que el click en las tarjetas clicables sí cambia el track sin necesidad de una segunda instancia.

### Bug real encontrado (reportado por el usuario) y corregido en la raíz: `transitionDelay` nunca se reseteaba

El usuario reportó que el hover de las tarjetas solo se sentía fluido en la primera. Causa: `reveal.ts` fija `el.style.transitionDelay` (inline) según `data-delay` para escalonar la entrada, pero nunca lo resetea después — ese delay queda pegado para siempre y se filtra a CUALQUIER transición posterior del mismo elemento, incluido el `:hover` (transform/box-shadow/border-color). Como las 4 tarjetas tienen delays crecientes (0/150/300/450ms), el hover de cada una arrancaba con ese mismo retraso acumulado — la primera (0ms) se sentía instantánea, la última (450ms) claramente lenta. Es el mismo tipo de bug ya visto y corregido en Valores (sobre-nosotros), pero esta vez en el módulo compartido `reveal.ts`, no en un componente aislado. Corregido con un `setTimeout(() => el.style.transitionDelay = '0s', delay + duration)` tras cada revelado — beneficia a **todas** las secciones del sitio que combinan `data-delay` con hover (incluye correcciones silenciosas en Checkpoint 6i, que tenía el mismo bug latente con delays de 80ms, menos perceptible pero real).

| Comportamiento/animación | Disparador | Implementado en |
|---|---|---|
| Entrada de texto/tarjetas | `IntersectionObserver` threshold 0.15, rootMargin -12%, duración 0.95s, se repite | `reveal.ts` |
| Zoom de foto + elevación en hover | hover | CSS puro (`!important` puntual en `transform`, mismo motivo que Checkpoint 6i) |
| Click en tarjetas 2/3 → cambia a track "empresas" | click | `data-go="empresas"`, manejado por `attachTrackToggle(document)` del Hero |
| Grid responsivo (4→2→1 columnas) | resize | CSS puro |

**Verificaciones:** `grep -c 'style="'` → 0 · `astro check` → 0 errores/0 warnings/0 hints · `npm run build` → OK (5 páginas; 4 fotos optimizadas ~570-620KB→~16-20KB). Verificado con Playwright: click cambia el track, `boundingBox()` sin desborde en mobile, y — tras el fix — `transitionDelay` computado en `0s` en las 4 tarjetas después de la entrada, más una captura a 150ms de iniciado el hover confirmando respuesta inmediata en la tarjeta que antes tenía el peor retraso (450ms). Usuario confirmó tras la corrección.

---

## Checkpoint 6k — `programas.astro`: Metodología (stepper) (completado 2026-07-09)

Archivo: `src/components/programas/MetodologiaStepper.astro`. Reutiliza `src/scripts/phase-stepper.ts` **sin cambios**.

Verificado contra `programas.html` líneas 780-910 (markup) y `applyResponsive()` líneas 2008-2029/1975-1981.

### Hallazgo: es el mismo stepper de 4 fases de `/metodologia`, no una sección nueva

Al leer el markup reconocí exactamente el mismo contenido, colores y estructura del stepper de fases ya construido en el Checkpoint 4c (`Fases.astro`, sección `#fases` de `metodologia.html`) — mismos 4 paneles (Explorar/Crear/Actuar/Resolver), mismos textos, mismos `data-phasetab`/`data-phasepanel`/`data-phasestage`. Confirmado con los mismos breakpoints (`phaseMobile = w<560`, panel colapsa a 1 columna en `w<760`). Reutilicé `phase-stepper.ts` tal cual (ya era genérico, scopeado al root que se le pase) y reconstruí solo el wrapper visual: fondo simple (sin nubes/anillos/grain, a diferencia de otras secciones de esta página), encabezado propio ("Modelo de innovación social" / "La Metodología CLAP") y un CTA final distinto — un botón outline "Conoce la metodología completa" → `/metodologia` (ruta interna), en vez del CTA sólido de WhatsApp de la página de metodología.

### Fidelidad verificada: el `border` de los tabs no está en el markup estático, pero sí en el comportamiento real

El markup de esta página no incluye `border` inline en los botones de fase (a diferencia de `metodologia.html`), pero confirmé que `setPhase()` — la misma función JS, compartida entre ambas páginas — siempre fija `border:1.5px solid rgba(52,28,101,.06 ó .13)` al iniciar, sin condicionarlo a nada específico de la página. El markup estático nunca llega a verse (JS corre de inmediato al montar), así que repliqué el mismo tratamiento de borde que ya tiene `Fases.astro`, no el markup estático literal.

| Comportamiento/animación | Disparador | Implementado en |
|---|---|---|
| Entrada de texto/tabs/stage | `IntersectionObserver` threshold 0.15, rootMargin -12%, duración 0.95s, se repite | `reveal.ts` |
| Selección de fase | click | `phase-stepper.ts` (reutilizado del Checkpoint 4c) |
| Tabs compactos / panel a 1 columna en mobile | resize, breakpoints 559.98px/759.98px | CSS puro |

**Verificaciones:** `grep -c 'style="'` → 0 · `astro check` → 0 errores/0 warnings/0 hints · `npm run build` → OK (5 páginas; reutiliza las 4 fotos de fase ya optimizadas de `/metodologia`, sin duplicar assets). Verificado visualmente con Playwright: cambio de tab (Explorar→Actuar) y mobile (tabs compactos, panel a 1 columna). Usuario confirmó.

---

## Checkpoint 6l — `programas.astro`: CTA Final del track "personas" (completado 2026-07-09)

Archivo: `src/components/programas/CtaFinal.astro`.

Verificado contra `programas.html` líneas 913-925 (markup) y `applyResponsive()` (padding/`h2` ya vistos en checkpoints previos, mismo patrón: `w<560?'52px'/'56px':'104px'/'108px'` y `h2` `30px`/`46px`).

Fondo muy similar (mismo anillo/blob decorativos, valores idénticos) al CTA final de `/metodologia`, pero el degradado radial de fondo tiene porcentajes/opacidad ligeramente distintos — verificados los valores propios de esta página, no asumidos iguales. Sin capa de grain (a diferencia del CTA de `/metodologia`, que sí la tiene) — confirmado en el markup, solo 2 divs decorativos (anillo + blob).

| Comportamiento/animación | Disparador | Implementado en |
|---|---|---|
| Entrada del bloque completo (sin stagger) | `IntersectionObserver` threshold 0.15, rootMargin -12%, duración 0.95s, se repite | `reveal.ts` |
| Hover en ambos botones | hover | CSS puro |

**Verificaciones:** `grep -c 'style="'` → 0 · `astro check` → 0 errores/0 warnings/0 hints · `npm run build` → OK (5 páginas). Verificado visualmente: desktop y mobile, confirmando que conecta directo con el footer (última sección real del track). Usuario confirmó.

---

## `programas.astro` — track "personas" completo (10 de 10 secciones)

Con el CTA Final, el track "personas" de `/programas` queda completo: Aprender haciendo → Elige tu ruta → banner "Para empresas" → Así aprenderás → Qué desarrollarás → Información del programa → Inversión → Por qué CLAP → Dirigido a → Metodología (stepper) → CTA Final. Falta el track "empresas" (3 secciones: Círculo Empresas que Lideran, Laboratorio de Innovación, Empresas · CTA Final) para terminar la página completa.

---

## Checkpoint 6m — `programas.astro`: "Círculo Empresas que Lideran" (completado 2026-07-10)

Archivos: `src/components/programas/CirculoEmpresas.astro`, `src/data/programas-tracks.ts`, `src/scripts/circulo-toggle.ts`.

Verificado contra `programas.html` líneas 935-1098 (markup), 1242-1270/1505-1571/1828-1884 (JS: `toggleCirculoProgs`, `setupEProg`/`setEProg`, `layoutProgAccordion`), 2183-2186/2335-2381 (`applyResponsive`).

**Refactor de reutilización (importante, cambia archivos ya confirmados):** los 3 programas (Comunidad/Sostenibilidad/Impacto) que aparecen en "Elige tu ruta" (`Rutas.astro`, track personas) reaparecen en esta sección con el mismo texto, imágenes y valores de diseño — verificado línea por línea contra el original, no es una coincidencia visual. Solo el CTA de cada panel difiere (WhatsApp/"Conocer este programa" en Rutas vs. formulario/"Vincular mi empresa a este programa" aquí). Para no duplicar ~300 líneas de contenido y CSS que podrían divergir con el tiempo:
- Se extrajeron los datos de los 3 programas a `src/data/programas-tracks.ts` (antes vivían solo dentro de `Rutas.astro`).
- Se extrajo el markup+CSS de "tabs + panel" a un componente compartido `src/components/programas/ProgramTabsPanels.astro` (recibe `programs`, `ctaLabel`, `ctaHref` como props), usado tanto por `Rutas.astro` como por `CirculoEmpresas.astro`.
- `Rutas.astro` quedó reducido a sus decoraciones/encabezado propios + `<ProgramTabsPanels programs={programs} ctaLabel="Conocer este programa" ctaHref={WHATSAPP_PROGRAMAS} />`. Se verificó que no hubo regresión visual/funcional (Playwright: 3 tabs, 1 panel activo, build y `astro check` limpios).

**Comportamiento nuevo de esta sección:**
- Vista por defecto "mis beneficios": tarjeta de costos (3 filas de precio + nota de certificado de donación) + grid 2×2 de 4 beneficios (hover con gradiente e ícono rotado — mismo patrón `!important` que `PorQueClap.astro`, porque las tarjetas llevan `data-reveal` y `reveal.ts` fija `transform` inline) + botón "Quiero vincular a mi empresa".
- Botón "Conoce los programas especializados" alterna a la vista de tabs/acordeón de los 3 programas (reutilizando `attachProgSelector`, conectado de forma perezosa la primera vez que se abre, igual que `setupEProg` en el original) y cambia su propia etiqueta/rotación de ícono. Réplica en `circulo-toggle.ts`.
- El reflow del tag "Ahorras" en la fila "Aporte de CLAP" en mobile (el original lo hace reparentando el nodo por JS) se replicó con CSS puro: dos copias del tag (una inline junto a la etiqueta, otra apilada junto al valor), alternadas por `display` en el breakpoint de 559.98px — evita añadir JS solo para un reordenamiento visual, sin duplicar contenido accesible (la copia oculta usa `display:none`, que los lectores de pantalla omiten).

**Bugs encontrados y corregidos durante la verificación con Playwright (antes de presentar el checkpoint):**
1. `attachTrackToggle()` (`track-toggle.ts`) nunca soportó el deep-link `/programas#empresas` — enlazado desde "Programas Especializados Empresas" en el footer y el submenú mobile de **todas** las páginas del sitio (`Footer.astro`, `MobileMenu.astro`). Faltaba el chequeo de `location.hash` en la carga inicial y el listener de `hashchange` que sí tiene el original en `componentDidMount()`. Corregido añadiendo ambos en `track-toggle.ts`.
2. `circulo-toggle.ts` (primera versión) intentaba inferir si la vista de programas estaba abierta leyendo `progs.style.display !== "none"`, pero el ocultamiento inicial venía de una regla CSS de clase (`.progs{display:none}`), no de un estilo inline — un inline vacío (`""`) no gana especificidad sobre esa clase, así que `progs.style.display = ""` no mostraba nada y además la lectura inicial daba un falso "ya está abierto". Corregido usando una variable de estado (`showingProgs`) en JS y `classList.toggle` con clases `.is-open`/`.is-hidden` en vez de estilos inline — detectado con Playwright (el toggle cambiaba la etiqueta del botón pero el `display` computado seguía en `none`).

| Comportamiento/animación | Disparador | Implementado en |
|---|---|---|
| Entrada de encabezado, tarjeta de costos (desde la izq.), columna de beneficios (desde la der., delay 120ms) | scroll (`reveal.ts`, mismos parámetros de programas: 0.15/-12%/950ms/repeat) | `reveal.ts` |
| Entrada individual de cada tarjeta de beneficio | scroll | `reveal.ts` |
| Hover en tarjetas de beneficio (gradiente, ícono rotado, texto blanco) | hover | CSS con `!important` (choca con `transform` inline de `reveal.ts`) |
| Alternar "mis beneficios" ↔ "programas especializados" | click en botón toggle | `circulo-toggle.ts` |
| Tabs/acordeón de los 3 programas (desktop hover+click / mobile acordeón) | hover (desktop) / click (mobile) | `prog-selector.ts` (compartido con Rutas) vía `ProgramTabsPanels.astro` |
| Reflow del tag "Ahorras" en mobile | media query 559.98px | CSS puro (sin JS) |
| Deep-link `/programas#empresas` activa el track "empresas" al cargar o en caliente | `location.hash` / `hashchange` | `track-toggle.ts` |

**Verificaciones:** `grep -c 'style="'` → 0 en todos los archivos tocados · `astro check` → 0 errores/0 warnings/0 hints · `npm run build` → OK (5 páginas) · Playwright: toggle abre/cierra correctamente con etiquetas e íconos esperados, click en 2do tab funciona, hover se asienta exactamente en `translateY(-8px) scale(1.02)`, precios en mobile sin overflow (grid 274px, value-wrap 122px), acordeón mobile reparenta el panel bajo su tab, deep-link `#empresas` muestra el hero y esta sección correctamente. Screenshots desktop/mobile revisados manualmente.

---

## Checkpoint 6n — `programas.astro`: "Laboratorio de Innovación" (completado 2026-07-10)

Archivo: `src/components/programas/LaboratorioInnovacion.astro`.

Verificado contra `programas.html` líneas 1101-1152 (markup) y `applyResponsive()` líneas 2187-2188 (`data-labgrid` → 1 col bajo 880px), 2189-2190 (`data-labdev` → 1 col bajo 560px), 2343-2346 (padding de sección y tamaño de `h2`, mismos umbrales/valores que el resto de secciones de esta página: `52px 20px 54px`/`96px 48px 100px` y `28px`/`44px`).

Contenido propio (no compartido con otras secciones): tarjeta "¿Qué puede desarrollar el equipo?" (grid 2×2 de 5 ítems, el último con `grid-column:span 2`), tarjeta "¿Qué recibe tu organización?" (degradado morado), y tarjeta de inversión ($3.000.000 COP/trimestre + 3 ítems + nota de certificado de donación + CTA de WhatsApp).

**Verificación de un comportamiento no evidente (no es bug):** en mobile, `data-labdev` pasa a una sola columna explícita (`grid-template-columns:1fr`), pero el 5º ítem conserva `grid-column:span 2`. Como el grid solo tiene 1 columna explícita, ese `span 2` fuerza una columna implícita adicional (`grid-auto-columns:auto`), por lo que los primeros 4 ítems en realidad se siguen viendo en 2 columnas visuales (138px/119px) y solo el último ocupa el ancho completo — confirmado que es así también en el original (`file://.../programas.html#empresas` a 375px, mismas medidas de `boundingBox()` para los 5 ítems). Se replicó tal cual, sin "corregir" un comportamiento que el original nunca tuvo.

| Comportamiento/animación | Disparador | Implementado en |
|---|---|---|
| Entrada de encabezado, columna izquierda (desde la izq.), tarjeta de inversión (desde la der., delay 120ms) | scroll (`reveal.ts`, mismos parámetros de programas: 0.15/-12%/950ms/repeat) | `reveal.ts` |
| Entrada escalonada de los 5 ítems "¿Qué puede desarrollar el equipo?" (delays 0/90/180/270/360ms) y los 3 ítems de inversión (0/110/220ms) | scroll | `reveal.ts` |
| Hover en el CTA "Quiero un equipo en mi empresa" | hover | CSS puro |

**Verificaciones:** `grep -c 'style="'` → 0 · `astro check` → 0 errores/0 warnings/0 hints · `npm run build` → OK (5 páginas) · Playwright: sección visible vía deep-link `/programas#empresas`, 5 ítems de desarrollo y 3 de inversión presentes, reveal se asienta en opacity 1, padding/tamaño de `h2`/columnas correctos en mobile (375px) y desktop (1440px). Screenshots desktop/mobile revisados manualmente.

---

## Checkpoint 6o — `programas.astro`: "Empresas · CTA" (completado 2026-07-10)

Archivo: `src/components/programas/CtaFinalEmpresas.astro`.

Verificado contra `programas.html` líneas 1154-1165 (markup) y `applyResponsive()` línea 2347-2348 (`[data-conectah2]`: `28px`/`46px`). A diferencia de `CtaFinal.astro` (personas), esta sección **no** tiene una regla de padding específica para mobile en `applyResponsive()` — se verificó explícitamente que no existe (búsqueda de `data-screen-label="Empresas · CTA"` en el script solo devuelve el propio `<section>`, ninguna otra referencia de padding) y se replicó tal cual: mantiene `104px 48px 108px` en todos los anchos, solo cambia el tamaño del `h2`.

Cierra el track "empresas" y con ello la página `/programas` completa: mismo patrón visual que `CtaFinal.astro` (anillo decorativo, bloque único con reveal, dos botones) pero con paleta rosa/`#E5268E` en vez de verde, sin blob decorativo (el original solo tiene 1 div decorativo aquí, no 2), botón sólido a WhatsApp del equipo CLAP y botón fantasma `data-go="personas"` que regresa al track "personas" (reutiliza el mecanismo genérico ya construido en `track-toggle.ts`, sin JS nuevo).

**Bug encontrado y corregido antes de presentar el checkpoint:** la clase `.cta-empresas` ya la usa `CtaEmpresasBanner.astro` (banner "¿Representas una empresa?" del track personas, `data-screen-label="Para empresas"`). Astro escapa el CSS con scoping por archivo, así que no había colisión de estilos, pero sí de comportamiento: el script de este componente usaba `document.querySelector(".cta-empresas")`, que en el DOM devuelve el primer nodo que coincide — el banner de empresas (que aparece antes en el documento), no esta sección. El resultado habría sido que `reveal.ts` nunca se conectara a esta sección (aparecería sin animación de entrada). Corregido renombrando la clase a `.cta-final-empresas` en todo el componente. Detectado con Playwright (`locator.isVisible()` lanzó "strict mode violation: resolved to 2 elements").

| Comportamiento/animación | Disparador | Implementado en |
|---|---|---|
| Entrada del bloque completo (sin stagger) | scroll (`reveal.ts`, mismos parámetros de programas) | `reveal.ts` |
| Hover en ambos botones | hover | CSS puro |
| Botón "Ver programas para personas" regresa al track "personas" | click | `track-toggle.ts` (`[data-go]`, ya genérico) |

**Verificaciones:** `grep -c 'style="'` → 0 · `astro check` → 0 errores/0 warnings/0 hints · `npm run build` → OK (5 páginas) · Playwright: sección visible vía deep-link `#empresas`, reveal se asienta en opacity 1, click en "Ver programas para personas" cambia correctamente de track (con scroll al top), tamaño de `h2` y padding sin override correctos en mobile (375px). Screenshots desktop/mobile revisados manualmente.

---

## `programas.astro` completo (13 de 13 secciones + Hero)

Con el CTA final de empresas, `/programas` queda completa: Hero (con selector de track) → track "personas" (10 secciones) → track "empresas" (Círculo Empresas que Lideran → Laboratorio de Innovación → CTA Empresas). Queda pendiente `politica-privacidad.astro`, la última página del build order de la Fase 6.

---

## Checkpoint 7 — `politica-privacidad.astro` (completado 2026-07-10)

Archivos: `src/pages/politica-privacidad.astro`, `src/components/politica-privacidad/Hero.astro`, `src/components/politica-privacidad/Contenido.astro`.

Verificado contra `politica-privacidad.html` completo (425 líneas): Nav/menú mobile/footer/botón scroll-to-top ya cubiertos por `BaseLayout`/`Header`/`Footer`/`ToTopButton` (sin cambios), solo Hero (líneas 89-99) y Contenido (líneas 101-248) son propios de esta página.

**Sin animaciones:** se confirmó explícitamente (`grep -c "data-reveal"` → 0 en todo el archivo) que esta página no usa `reveal.ts` en ningún punto — a diferencia de todas las páginas anteriores. Tampoco hay una regla de `applyResponsive()` para el tamaño de `h1` del hero (solo existen reglas para nav/burger/footer-grid en el script de esta página) — se verificó que el `h1` de 46px no tiene override mobile y se replicó así, sin asumir el patrón de "h1 más chico en mobile" que sí tienen otras páginas.

**Contenido (`Contenido.astro`):** texto legal completo (intro de 5 párrafos, box de "Definiciones" con 8 términos, 17 secciones numeradas I–XVII con numeral en verde `#13b89a`, sección XV con 4 subtítulos `h3` anidados, nota final de vigencia). Dado lo repetitivo de la estructura (`h2` numerado + párrafos/listas), las 17 secciones se modelaron como un array de datos (`Section[]`, con bloques `p`/`ul`/`h3`) en vez de repetir el mismo markup 17 veces a mano — mismo criterio que otros componentes data-driven del proyecto (p. ej. `programas-tracks.ts`). Los 3 párrafos que en el original llevan un link `mailto:` embebido usan `set:html` con una constante `MAIL_LINK` reutilizada (contenido estático de autoría propia, mismo criterio ya establecido para los íconos SVG inline del proyecto — no es contenido de usuario). Los estilos de `<strong>` (en el box de definiciones) y del link de correo se aplican con `:global()` en el `<style>` scoped, porque ese markup llega vía `set:html` y no recibe el hash de scope de Astro automáticamente.

**Verificaciones:** `grep -c 'style="'` → 0 en los 3 archivos · `astro check` → 0 errores/0 warnings/0 hints · `npm run build` → OK (6 páginas) · Playwright: `h1` correcto, 18 `h2` (Definiciones + I–XVII), 4 `h3` (subsecciones de la XV), 3 links `mailto:`, 8 términos en el box de definiciones, 21 `<li>` en total, numerales en verde, el link del footer ("Política de privacidad"/"Tratamiento de datos", ya apuntaba a `/politica-privacidad` desde antes) navega correctamente. Screenshots de hero (desktop/mobile), box de definiciones y nota final revisados manualmente — fieles al diseño original, sin animación de entrada en ningún elemento.

---

## Las 6 páginas de la Fase 6 completas

Con `politica-privacidad.astro`, las 6 páginas del build order quedan construidas: BaseLayout+Nav+Footer, `index.astro`, `sobre-nosotros.astro`, `metodologia.astro`, `equipo.astro`, `programas.astro` (completa, ambos tracks), `politica-privacidad.astro`.

---

## Cierre de Fase 6 — auditoría final (2026-07-10)

Con las 6 páginas construidas, se hizo una pasada de verificación de las hard rules del proyecto sobre el estado completo del repositorio (no solo el último checkpoint). No fue necesario corregir nada — todo pasó en la primera pasada:

- **Cero `style=""` inline:** `grep -rc 'style="' src/ --include="*.astro"` → 0 en total, sobre los 89 archivos `.astro` del proyecto.
- **Sin enlaces `.html` colgados:** ninguna referencia activa a rutas `.html` en el código (las únicas coincidencias de la cadena `.html` son comentarios de documentación que citan el nombre del archivo original fuente, y el prop `set:html` de Astro, que no tiene relación).
- **Páginas bajo el límite de tamaño:** los 6 archivos de `src/pages/` van de 14 a 45 líneas (`programas.astro`, la más grande, 45 líneas) — muy por debajo del límite de ~200-300, gracias a que toda la implementación vive en componentes.
- **`<html lang="es">`** presente en `BaseLayout.astro`, único layout usado por las 6 páginas.
- **`astro:assets`:** única excepción a `<Image>` es un `<img data-lightbox-img>` sin `src` en `Espacios.astro` (home), cuyo `src` se asigna en runtime vía `lightbox.ts` según la miniatura en la que se hizo click — no puede resolverse en build time, así que `<Image>` no aplica ahí; es la única imagen "cruda" de todo el proyecto y está justificada.
- **Enlaces internos por rutas Astro, no `.html`:** se extrajeron todos los `href="/..."` del código (`/`, `/equipo`, `/metodologia`, `/politica-privacidad`, `/programas`, `/programas#empresas`, `/sobre-nosotros#que-es|valores|filosofia|historia`, `/#inicio|contacto|ecosistema|espacios`) y se verificó que cada `id` de anchor referenciado existe de verdad en la sección correspondiente — sin enlaces rotos.
- **SEO por página:** las 6 páginas tienen `title`/`description`/`path` únicos (comprobado extrayéndolos de los 6 archivos y comparando), lo que a través de `BaseLayout.astro` genera `<title>`, `<meta name="description">`, `<link rel="canonical">`, Open Graph completo (`og:type/site_name/title/description/url/image/locale`), Twitter Card (`summary_large_image` con title/description/image) y JSON-LD de `Organization` — verificado en el HTML compilado de `/politica-privacidad` como muestra. La imagen OG usa el placeholder `social-preview-fallback.png` (documentado desde el checkpoint del layout: pendiente de un asset social 1200×630 real, no es parte del alcance de la migración de markup).
- **`robots.txt` + sitemap:** `public/robots.txt` con `Sitemap: https://clapedu.org/sitemap-index.xml`; `@astrojs/sitemap` configurado en `astro.config.mjs` con `site: 'https://clapedu.org'`; build limpio (`rm -rf dist && npm run build`) confirma `sitemap-index.xml` con las 6 URLs correctas (`/`, `/equipo/`, `/metodologia/`, `/politica-privacidad/`, `/programas/`, `/sobre-nosotros/`).
- **`astro check` sobre el proyecto completo:** 0 errores / 0 warnings / 0 hints (89 archivos).

Con esto, la Fase 6 (construcción por checkpoints) queda formalmente cerrada: las 6 páginas están migradas, verificadas contra el original sección por sección, y el proyecto cumple todas las hard rules definidas al inicio de la migración.

---

## Fix post-cierre — ítem activo dentro del submenu del nav (2026-07-10)

El usuario detectó que, al desplegar un dropdown del nav en una página cuyo contenido corresponde a uno de sus ítems (p. ej. `/equipo` con el dropdown "Conócenos" abierto), el ítem "Equipo de trabajo" del panel no se veía resaltado como en el diseño original — solo el trigger ("Conócenos") se ponía en verde.

Al revisar el original se confirmó que esto era un gap real, no percepción: el sitio fuente tiene **dos indicadores de página activa independientes** en el nav, y `Header.astro` solo implementaba uno:
1. El trigger del dropdown en teal (`activeDropdown`, ya implementado desde el checkpoint del layout).
2. El ítem específico dentro del panel desplegado — que **no existía** en la implementación.

Verificado el patrón exacto por página en los 4 archivos fuente relevantes:
- `equipo.html`: "Equipo de trabajo" con punto teal + texto teal + fondo `rgba(59,224,187,.14)` (fijo, el mismo valor que usa el hover normal en los demás ítems).
- `metodologia.html`: mismo patrón sobre "Metodología CLAP" — **pese a que en esta página el trigger "Conócenos" NO se resalta** (inconsistencia real del original, ya documentada en el checkpoint del layout y respetada aquí también: se resalta el ítem del panel pero no el trigger).
- `programas.html`: "Programas Especializados CLAP" (único ítem del dropdown "Educación") con texto teal en negrita, **sin punto**, fondo de opacidad distinta (`.12` en vez de `.14`) y hover propio (`.2` en vez de `.14`) — tratamiento visualmente distinto al de equipo/metodología, no una variación arbitraria.
- `sobre-nosotros.html`: se verificó que **ninguno** de los 4 ítems del panel ("Sobre nosotros", "Nuestros valores", "Nuestra filosofía", "Nuestra historia") lleva resaltado especial, pese a que el trigger "Conócenos" sí está activo — no se "inventó" un ítem activo ahí porque el original no lo tiene (son 4 anclas de una misma página, no hay un ítem "correcto" que resaltar).

**Implementación:** nuevo prop `activeNavLink?: "metodologia" | "equipo" | "programas"` en `Header.astro` (pasado a través de `BaseLayout.astro`), independiente de `activeDropdown`. Aplica `class:list` con dos variantes de estilo (`.is-active-item` con punto para equipo/metodología, `.is-active-item-alt` sin punto para programas) sobre el `<a>` correspondiente en el panel. `MobileMenu.astro` no se tocó: se confirmó (`grep` sobre los 4 archivos fuente) que el submenu mobile no tiene ningún resaltado de ítem activo en el original, es un comportamiento exclusivo de desktop.

Páginas actualizadas: `equipo.astro` (`activeNavLink="equipo"`), `metodologia.astro` (`activeNavLink="metodologia"`, sin `activeDropdown`, igual que antes), `programas.astro` (`activeNavLink="programas"`). `sobre-nosotros.astro` sin cambios (correcto no pasar nada).

**Verificaciones:** `grep -c 'style="'` → 0 · `astro check` → 0 errores/0 warnings/0 hints · `npm run build` → OK (6 páginas) · Playwright: en `/equipo` y `/metodologia`, el ítem correspondiente del panel "Conócenos" muestra `color: rgb(59,224,187)`, `background: rgba(59,224,187,.14)` y el punto decorativo, mientras los demás ítems quedan sin estilo; en `/programas`, "Programas Especializados CLAP" muestra el mismo color con `background: rgba(59,224,187,.12)` y sin punto; en `/sobre-nosotros`, los 4 ítems del panel "Conócenos" quedan sin ningún resaltado, confirmando que no se agregó nada donde el original no lo tiene. Screenshots de los 3 dropdowns desplegados revisados manualmente.

---

## Fix post-cierre — orden mobile del Hero de `/` (2026-07-10)

El usuario reportó que en mobile el Hero de la home no sigue el orden esperado (título → párrafo → imagen → cifras); en desktop estaba bien.

Al revisar `index.html` línea por línea (markup del hero, líneas ~1193-1700, y el bloque `applyResponsive` del script, líneas ~9885-9944) se confirmó que el gap era real y más amplio de lo reportado: `Hero.astro` usaba `.hero-visual { order: -1 }` en mobile (que pone la imagen **primero**, antes de todo el bloque de texto — no coincide ni con el original ni con lo pedido) y, además, varios valores responsive del hero no coincidían con el original:

- **Reorden real del original:** no es un simple `order` de 2 ítems — el original mueve por JS (`appendChild`) el bloque "Una década..." (`data-heradecada`) y la franja de cifras (`data-herostats`) para que salgan de dentro de la columna de texto y pasen a ser hijos directos del grid del hero **después** de la imagen, solo en mobile (`reorder: en móvil, la franja de cifras baja debajo de la foto del hero`, comentario textual del original). En desktop esos mismos dos bloques vuelven a vivir dentro de la columna de texto, en flujo normal.
- **Replicado sin JS, con CSS Grid + `grid-template-areas`:** en vez de reproducir el `appendChild` con un módulo JS nuevo, se sacaron `.hero-decade` y `.hero-stats` de dentro de `.hero-copy` para que sean hijos directos de `.hero-content` (junto con `.hero-copy` y `.hero-visual`), y se usan áreas nombradas para controlar el orden en cada breakpoint: desktop `"copy visual" / "decade visual" / "stats visual"` (visual centrado verticalmente abarcando las 3 filas, igual que antes), mobile `"copy" / "visual" / "decade" / "stats"` en una sola columna. Se evitó así duplicar los elementos `[data-count]` (que están enlazados a `count-up.ts`) — la alternativa de "dos copias + display toggle" ya usada en otros checkpoints no aplicaba aquí porque duplicaría el conteo animado.
- **Otros valores mobile/tablet que no coincidían con el original** (encontrados al verificar el bloque completo, no solo el orden):
  - `hero-content` padding mobile: era `40px 22px 48px`, debe ser `14px 20px 34px` (más el `gap:22px` del grid, que el original también fija explícitamente en mobile).
  - `hero-title` en tablet (768-1099px): era `48px`, debe ser `52px` (el original tiene 3 tamaños — 38/52/64 — no 2).
  - `hero-image-frame` altura: faltaba el valor de tablet (`440px`); mobile era `340px`, debe ser `360px`.
  - `hero-image-frame` `border-radius` en mobile: se cambiaba a `80px 24px 80px 24px`, valor sin ningún respaldo en el original (que no varía el radio por breakpoint, se confirmó que no hay ninguna regla `@media` para esto en todo `index.html`) — revertido a mantener el radio constante `150px 36px 150px 36px` en todos los anchos.
  - `.hero-float` (las 2 tarjetas flotantes sobre la imagen): en mobile se ocultaban con `display:none` — el original **nunca** las oculta, solo las reposiciona/reduce (`left/right/top/bottom/padding/tamaño de ícono`), confirmado por `grep` de `data-herofloat` en todo el archivo (no hay ningún `display:none` asociado). Corregido para que sigan visibles con los valores de posición/tamaño mobile correctos.
  - `.hero-cta` y `.hero-stats` en mobile: faltaban por completo los ajustes de layout del original (`flex-wrap:nowrap`, botones a `flex:1 1 0` con padding/tamaño de fuente reducidos, cifras sin wrap con gap de 7px) — agregados.

**Verificaciones:** `grep -c 'style="'` → 0 · `astro check` → 0 errores/0 warnings/0 hints · `npm run build` → OK (6 páginas) · Playwright en 3 anchos: mobile (375px) confirma el orden visual exacto por posición vertical (`copy → visual → decade → stats`), padding `14px 20px 34px`, `hero-title` `38px`, imagen `360px` de alto con el radio de borde correcto, tarjetas flotantes visibles con la posición mobile; tablet (900px) confirma `hero-title` `52px` e imagen `440px` con las 2 columnas intactas; desktop (1440px) confirma `hero-title` `64px` e imagen `500px` sin cambios. Screenshots de las 3 resoluciones revisados manualmente contra el diseño original.

---

## Fix post-cierre — separador del marquee de Aliados (2026-07-10)

El usuario reportó que la sección "Aliados que nos respaldan" (home) animaba correctamente pero no se veía igual al diseño.

Comparado `Aliados.astro` contra el markup del original (`index.html`, sección `#aliados`, líneas ~1708-1774): el original separa cada aliado del siguiente con `&nbsp;&nbsp;✦&nbsp;&nbsp;` incrustado directamente en el texto, y ese separador aparece **también después del último ítem** ("INNPULSA COLOMBIA&nbsp;&nbsp;✦&nbsp;&nbsp;") — antes de cerrar el `<span>`. Como la animación de marquee usa dos copias idénticas del mismo bloque de texto (`.aliados-set` duplicado) concatenadas para lograr el loop infinito sin salto visible, ese separador final hace que el ritmo de espaciado sea uniforme también en la costura entre una vuelta y la siguiente.

Mi implementación generaba el separador `✦` solo *entre* ítems (`i < aliados.length - 1`), así que el último ítem de cada bloque no llevaba separador — dejaba un hueco sin estrella justo en la costura donde se repite el bloque, rompiendo el ritmo del marquee. Corregido generando el texto de cada `.aliados-set` con `aliados.join(SEP) + SEP` (`SEP` = 2 nbsp + "✦" + 2 nbsp, verificado con `python3 -c "...repr..."` que son `\xa0` reales y no espacios normales — con `white-space:nowrap` los espacios normales se colapsan igual que en flujo normal, nbsp no). Esto también simplificó el componente: ya no hace falta el `<span class="dot">` individual ni su regla CSS `margin:0 12px` (el separador ahora es texto plano, igual que en el original).

De paso se encontró que `<Aliados />` estaba comentado en `index.astro` (cambio local sin commitear, fuera de esta sesión) — se restauró para poder verificar el fix; sin eso la sección no se habría renderizado en absoluto.

**Verificaciones:** `grep -c 'style="'` → 0 · `astro check` → 0 errores/0 warnings/0 hints (antes de restaurar `<Aliados />` había 1 warning de import sin usar, confirmando que estaba deshabilitado) · `npm run build` → OK (6 páginas) · Playwright: el `textContent` de `.aliados-set` termina en `"...INNPULSA COLOMBIA  ✦  "` (con el separador final), la animación `clap-marquee` sigue activa. Screenshots desktop/mobile revisados manualmente — espaciado uniforme en todo el recorrido, incluida la costura del loop.

---

## Fix post-cierre — fondo duplicado de Aliados (2026-07-10)

El usuario aclaró que el problema real no era el separador (ya corregido en el fix anterior), sino que "Aliados que nos respaldan" no debería tener un fondo propio — en el original se ve simplemente como una continuación visual del fondo del Hero, no como un bloque con su propio degradado.

Esto confirma exactamente la nota de arquitectura ya escrita en el Checkpoint 2b (línea 343 de este documento): en el original, `#aliados` es un `<div>` anidado **dentro** de `<section id="inicio">`, así que comparte literalmente el mismo elemento de fondo animado del Hero — no hay dos fondos, hay uno solo que ambos bloques comparten por estar anidados. La decisión original de Checkpoint 2b (duplicar el `background` + `clap-gradient-shift` en `Aliados.astro` porque en Astro son componentes hermanos, no anidados) buscaba mantener la continuidad visual, pero en la práctica el usuario confirma que igual se percibe como "tiene su propio fondo" — el enfoque de duplicar-y-sincronizar no reproduce fielmente el original aunque los `keyframes`/duración sean idénticos.

**Corregido restructurando la relación de los componentes para que coincida con el original al pie de la letra:** `Hero.astro` ahora importa y renderiza `<Aliados />` como el último hijo dentro de su propio `<section id="inicio" class="hero">` (justo como el original tiene `#aliados` como último hijo de `<section id="inicio">`), en vez de que `index.astro` los renderice como hermanos independientes. Se eliminó por completo el `background`/`animation` duplicados de `.aliados-wrap` en `Aliados.astro` — ya no le hace falta ningún fondo propio, hereda visualmente el del `<section>` padre al estar anidado de verdad. De paso se eliminó el `<div class="aliados-wrap">` (ya sin ningún estilo propio, era solo un contenedor vacío) a favor de que `Aliados.astro` renderice sus 2 elementos de nivel superior directamente — Astro no exige un único nodo raíz, a diferencia de JSX/React.

`index.astro` ya no importa ni renderiza `<Aliados />` directamente (queda implícito dentro de `<Hero />`).

**Verificaciones:** `grep -c 'style="'` → 0 en los 3 archivos tocados · `astro check` → 0 errores/0 warnings/0 hints · `npm run build` → OK (6 páginas) · Playwright: `#inicio` (la sección del Hero) contiene a `.aliados-label` como descendiente (`Element.contains()` → `true`), el fondo computado de `#inicio` es el degradado único compartido, no hay duplicación de la sección (`.aliados-label` cuenta 1, `#destacados` sigue presente y único). Screenshots desktop y mobile de la franja Hero+Aliados completa revisados manualmente: el degradado ahora fluye sin costura entre el contenido del hero y la franja de aliados, tal como en el diseño original.

---

## Fix post-cierre — tarjetas de Destacados no coincidían con el diseño (2026-07-10)

El usuario pidió una revisión a fondo de las tarjetas de "Iniciativas destacadas" (desktop y mobile), sin apuntar a un detalle específico. Se comparó `Destacados.astro` contra el `<style>` completo del original (no solo el markup con los `style-hover` de cada tarjeta) y aparecieron varias discrepancias reales, la más importante de las cuales cambia el comportamiento visual del hover por completo.

**Hallazgo clave — los `style-hover` inline de cada tarjeta nunca llegan a aplicarse:** el original define además, en un `<style>` fijo en el `<head>` (no generado por tarjeta), reglas `[data-destgrid] > a:nth-child(N):hover { box-shadow: ... !important }` para las 4 tarjetas por posición. Como llevan `!important`, estas reglas **ganan siempre** sobre el `style-hover` individual de cada `<a>` (que genera una regla `:hover` normal, sin `!important`). Es decir: los colores de sombra que un lector superficial del markup asumiría por tarjeta (los que están en `style-hover`) **no son los que realmente se ven en el navegador** — hay que leer el `<style>` fijo para saber la verdad. Mi implementación había tomado los valores del `style-hover` (equivocados) en vez de los del `<style>` con `!important` (los reales), y además les había asignado el spread/blur incorrecto (`0 26px 56px -16px` en vez de `0 26px 60px -14px`).

Valores correctos verificados (por posición, con `!important` en el original):
| Tarjeta | Sombra en reposo | Sombra en hover |
|---|---|---|
| 1. Programas Especializados | `rgba(52,28,101,.45)` | `rgba(19,184,154,.75)` (verde azulado) |
| 2. iNNpulsa Mujeres | `rgba(168,72,196,.5)` (propia, no la genérica) | `rgba(123,77,255,.7)` (morado) |
| 3. Escuela de Liderazgo | `rgba(52,28,101,.35)` | `rgba(237,111,214,.78)` (rosa) |
| 4. Hackatón | `rgba(52,28,101,.35)` | `rgba(19,184,154,.72)` (verde azulado) |

Antes solo existían overrides de hover para las tarjetas 1 y 2 (con colores equivocados — la 2 llevaba rosa en vez de morado), y las tarjetas 3 y 4 no tenían **ningún** hover de sombra propio.

**Otros hallazgos reales, todos en el mismo `<style>` fijo o en el markup:**
- **Efecto de la flechita en hover — faltaba por completo.** `[data-destgrid] a:hover [data-arrow]` cambia el ícono circular a fondo teal (`#3be0bb`), borde teal, texto `#341c65` (ink) y `translateX(4px)` — en las 4 tarjetas, sin excepción (incluidas las que usan el ícono flotante morado de Escuela/Hackatón). No existía ninguna regla de hover para `.arrow` en la implementación previa.
- **Tag "Educación" de la tarjeta Escuela usa un azul marino propio (`#0d3256`)**, distinto del `color-ink` (`#341c65`) que sí usa el tag "Educación" de la tarjeta Programas — mismo fondo teal, texto distinto. Se agregó una clase `.tag--teal-escuela` solo para ese caso; el resto de tags no se tocó.
- **Título y párrafo de iNNpulsa Mujeres tienen tamaños propios**: `h3` a `30px`/`line-height:1`/sin `margin-bottom` (la regla compartida `.card-body h3` aplica `28px`/`1.1`/`margin-bottom:8px`, correcta para Programas pero no para iNNpulsa); párrafo a `14px` en vez de los `14.5px` compartidos.
- **Override de mobile incompleto**: en ≤767px el original no solo cancela el `transform` del hover (ya lo tenía), también fija la sombra de vuelta a `0 24px 50px -28px rgba(52,28,101,.4)` con `!important`, y cancela el `translateX(4px)` de la flecha — faltaban ambos.
- **`transition` de `.card` sin la curva de easing** (`cubic-bezier(.2,.7,.2,1)` en el `transform`, el original la tiene y se había perdido al copiar solo `transform .35s`).

Se agregaron clases `card--escuela`/`card--hackaton` (además de la ya existente `card--banner`, compartida por ambas para el swap de imagen/overlay) para poder diferenciar sombra de hover y color de tag sin duplicar el resto del CSS compartido entre ambas tarjetas de banner.

**Verificación descartada como falsa alarma:** un primer screenshot de página completa (escala muy reducida) dio la impresión de que el título de la tarjeta Escuela quedaba fuera de la superposición oscura, en un bloque blanco separado. Verificado con `boundingBox()`/estilos computados y con un screenshot recortado solo de esa tarjeta: la superposición (`position:absolute; inset:0`) cubre exactamente los 300px de la tarjeta, el `h3` cae dentro de ese rango con `color:rgb(255,255,255)` — era un artefacto de la imagen comprimida a baja resolución, no un bug real.

**Verificaciones:** `grep -c 'style="'` → 0 · `astro check` → 0 errores/0 warnings/0 hints · `npm run build` → OK (6 páginas) · Playwright: sombra en reposo y en hover de las 4 tarjetas verificada por valor exacto (`rgba(...)`) contra la tabla de arriba; hover de la flecha verificado en las 4 tarjetas (`background: rgb(59,224,187)`, `color: rgb(52,28,101)`, `transform: matrix(1,0,0,1,4,0)`); tamaño/line-height/margin de `h3` y tamaño de `p` de iNNpulsa verificados; en mobile (375px): carrusel con `display:flex`/`overflow-x:auto`, swap de imagen mobile activo, título `hide-mobile` oculto, flechas y dots visibles. Screenshots desktop (completo y recortado por tarjeta) y mobile revisados manualmente.

---

## Fix inmediato — tag "Educación"/"Proyecto" a todo el ancho en Escuela/Hackatón (2026-07-10)

Bug real que se me pasó en la verificación anterior: `.card-overlay--escuela`/`.card-overlay--hackaton` son `display:flex; flex-direction:column`, y el `.tag` (span) es un hijo directo — sin `align-self` propio, el `align-items:stretch` por defecto de flex lo estira a todo el ancho de la tarjeta en vez de dejarlo con su ancho natural de píldora. El original tiene `align-self:flex-start` explícito en el tag de ambas tarjetas (verificado por `grep` en las líneas correspondientes de `index.html`) — no estaba en mi CSS.

Corregido con `.card-overlay--escuela .tag, .card-overlay--hackaton .tag { align-self: flex-start; }`. No afecta a los tags de Programas/iNNpulsa (esas viven dentro de `.card-top`, que es flex-row con `align-items:flex-start`, sin este problema).

**Verificaciones:** `grep -c 'style="'` → 0 · `astro check` → 0 errores/0 warnings/0 hints · `npm run build` → OK (6 páginas) · Playwright: ancho del tag de Escuela `~105px` y de Hackatón `~96px` (antes: 608px, el ancho completo de la tarjeta). Screenshots recortados de ambas tarjetas revisados manualmente.

---

## Fix post-cierre — métricas de Impacto rotas en mobile (2026-07-10)

El usuario reportó que las métricas de la sección "Impacto" (home) rompían el responsive en mobile. Verificado contra `applyResponsive()` del original (líneas 9973-9978 de `index.html`):

- **`[data-count]` (el número de cada métrica) baja a `32px` en mobile** (`w<768`) — mi CSS nunca lo sobreescribía, se quedaba en `42px` fijo en todos los anchos, y con textos largos como `+$10.000 mill.` en una grilla de 2 columnas eso desbordaba la tarjeta. Agregado `.metric-number { font-size: 32px; }` dentro del breakpoint de `767.98px`.
- **Gap de la grilla en mobile**: el original usa `28px 18px`, yo tenía `34px 20px` — corregido.
- **El divisor vertical entre la intro y las métricas no se reorienta a horizontal en tablet/mobile, se oculta por completo** (`impMetrics.firstElementChild.style.display = small ? 'none' : 'block'`, umbral `w<1100`). Mi implementación lo mantenía visible y lo reposicionaba a una línea horizontal — nunca fue eso lo que hace el original. Corregido a `.metrics-divider { display: none; }` en el breakpoint de `1099.98px`, eliminando las reglas de reposicionamiento que ya no aplicaban a nada.

**Verificaciones:** `grep -c 'style="'` → 0 · `astro check` → 0 errores/0 warnings/0 hints · `npm run build` → OK (6 páginas) · Playwright en mobile (375px): `font-size` de `.metric-number` → `32px`, `.metrics-divider` → `display:none`, y verificación explícita de que ningún número desborda su celda (`scrollWidth` vs `boundingClientRect().width` de las 6 métricas, incluida la más larga `+$X.XXX mill.`) → sin overflow; en tablet (900px): `.metric-number` vuelve a `42px`, divisor sigue oculto. Screenshots mobile y tablet revisados manualmente.

---

## Fix post-cierre — nodo "Propósito" mal ubicado en el triángulo filosofal (2026-07-10)

El usuario reportó que en `/sobre-nosotros`, sección Filosofía, el círculo "PROPÓSITO" no quedaba en el centro del triángulo. Verificado contra `sobre-nosotros.html` (línea 424, nodo `data-trinode="PROPÓSITO"`): el original lo posiciona con `left:50%; top:56%; transform:translate(-50%,-50%)`, en porcentajes relativos al contenedor del diagrama (a diferencia de los 3 vértices — Liderazgo/Sociedad/Innovación — que usan coordenadas en píxeles fijos calculadas a partir del `viewBox` del SVG).

En `Filosofia.astro`, `.node--proposito` no tenía **ningún** `left`/`top` definido — solo ancho/alto/color/sombra. Sin esas dos propiedades, un elemento `position:absolute` sin ancestro con offset explícito cae en la posición que le correspondería en flujo normal (esquina superior izquierda del contenedor posicionado, en este caso), no en el centro — de ahí que se viera "mal ubicado" en vez de sobre el centroide visual del triángulo.

Corregido agregando `left: 50%; top: 56%;` a `.node--proposito`, copiado literal del original (no el centroide geométrico exacto del polígono — que da ~61.4% — sino el valor que el diseño usa deliberadamente).

**Verificaciones:** `grep -c 'style="'` → 0 · `astro check` → 0 errores/0 warnings/0 hints · `npm run build` → OK (6 páginas) · Playwright: centro del nodo "Propósito" medido respecto al contenedor `.diagram` (420×380) → exactamente 50%/56%, coincidiendo con los valores fijados. Screenshot de la sección completa revisado manualmente: el círculo amarillo queda centrado dentro del triángulo violeta.

---

## Auditoría de SEO + fixes (2026-07-10)

El usuario pidió una revisión de buenas prácticas de SEO sobre el proyecto completo (no un checkpoint de una sección puntual). Auditoría hecha contra el HTML **compilado** (`dist/`), no solo el código fuente, para verificar el resultado real. Hallazgos y qué se hizo con cada uno:

**Ya estaba bien (verificado, no tocado):** `title`/`description`/`canonical` únicos por página, Open Graph y Twitter Card completos, JSON-LD de `Organization`, `robots.txt` + sitemap con las 6 URLs, `<html lang="es">`, viewport, fuentes críticas precargadas, imágenes vía `astro:assets`, uso correcto de `alt=""` solo en imágenes verdaderamente decorativas (verificado caso por caso: `Ecosistema.astro`, heroes de `equipo`/`programas` — todas tienen texto adyacente que ya transmite la misma info, o son fondos puramente decorativos con overlay de texto).

**Corregido en esta pasada:**

1. **Página 404 personalizada** (`src/pages/404.astro`, nueva): antes caía en la 404 genérica de Astro. Construida con el mismo lenguaje visual que el resto del sitio — degradado animado `clap-gradient-shift` (compartido con Hero/Impacto), blobs y anillo decorativos, badge "Error 404", numeral grande, y 2 CTAs (`Volver al inicio` / `Ver programas`) con los mismos estilos `.btn--primary`/`.btn--secondary` ya usados en otras secciones. Lleva `noindex` (correcto para una página de error: no debe indexarse ni aparecer en el sitemap — verificado que efectivamente no aparece en `dist/sitemap-0.xml`) y devuelve status HTTP 404 real (verificado con Playwright, no un 200 disfrazado).

2. **Inconsistencia canonical vs. sitemap (barra final):** el canonical decía `https://clapedu.org/equipo` pero el sitemap y el build real (`dist/equipo/index.html`, formato "directory") sirven `https://clapedu.org/equipo/`. Corregido normalizando `path` a terminar siempre en `/` antes de construir `canonicalURL` en `BaseLayout.astro` — verificado en el HTML compilado que ahora coinciden exactamente. De paso se encontró y corrigió la misma inconsistencia en las URLs del `BreadcrumbList` (ver punto 4), que tampoco llevaban `/` final.

3. *(Pendiente, requiere asset — no parte de esta pasada)*: imagen de Open Graph de 150×57px, muy por debajo de los 1200×630 recomendados.

4. **Breadcrumbs (`BreadcrumbList` JSON-LD) implementados pero nunca usados:** se agregó el prop `breadcrumbs` a las 5 subpáginas (`equipo`, `metodologia`, `programas`, `sobre-nosotros`, `politica-privacidad`; `index` no lleva, es la raíz), cada una con `[{Inicio, "/"}, {<página>, "/<ruta>"}]`. Verificado en el HTML compilado de `/equipo` que el `<script type="application/ld+json">` de `BreadcrumbList` ahora se emite con las 2 posiciones correctas.

5. **Meta tags técnicas faltantes:**
   - `apple-touch-icon`: no existía ningún asset cuadrado apto (el único PNG disponible, `favicon.png`, es en realidad el isotipo 150×57, no cuadrado). Generado uno nuevo de 180×180 (`public/apple-touch-icon.png`) renderizando con Playwright el ícono de marca ya existente (`favicon.svg`, el símbolo del aplauso) sobre fondo `#341c65` (ink, de la paleta) — no es un asset inventado, es el mismo isotipo del sitio a un tamaño correcto para iOS.
   - `<link rel="icon" type="image/svg+xml" href="/favicon.svg">` agregado antes del PNG (el SVG ya existía en `public/` pero `BaseLayout` nunca lo referenciaba).
   - `<meta name="theme-color" content="#341c65">` (color ink de la marca).
   - `og:image:width`/`og:image:height`/`og:image:alt`: agregados como props (`ogImageWidth`/`ogImageHeight`, default 150×57 = las dimensiones reales del placeholder actual — se deben actualizar junto con `ogImage` el día que se reemplace por el asset social real de 1200×630, ver punto 3).
   - `twitter:site` con `@claplatam` (la cuenta real de X, ya listada en `sameAs` del JSON-LD de `Organization`).

**Informativo, no corregido (no es un bug de la migración):** `/programas` tiene 2 `<h1>` en el DOM (uno por variante de track personas/empresas, oculto vía `display:none` según el track activo) — verificado que el **original hace exactamente lo mismo** (dos `<h1>` literales en el markup fuente, uno con `style="display:none"`). No se “corrige” porque cambiar eso implicaría desviarse del comportamiento fuente; se deja documentado como una característica heredada del diseño original, no introducida por la migración.

**Verificaciones:** `grep -c 'style="'` → 0 en los 8 archivos tocados · `astro check` → 0 errores/0 warnings/0 hints (90 archivos) · `npm run build` → OK, 7 páginas (las 6 + `404.html`) · Playwright: `/equipo` canonical y breadcrumb `item` ahora ambos con `/` final coincidiendo con el sitemap; `apple-touch-icon`/`theme-color`/`favicon.svg`/`og:image:width|height|alt`/`twitter:site` presentes en el `<head>` compilado; `/404` (ruta inexistente) devuelve status HTTP 404 real, con navegación funcional de vuelta a `/`; `404.html` no aparece en `sitemap-0.xml`. Screenshots de la página 404 en desktop y mobile revisados manualmente.

---

## Integración: formulario de contacto → Resend (2026-07-10)

El usuario pidió conectar el formulario de contacto del home (`#contacto`, sección `Contacto.astro`) a Resend, para que envíe los datos por correo a `elba.mendez@clapedu.org`, con todos los campos obligatorios y un email con diseño acorde a la marca. Hasta ahora el formulario era 100% cosmético — `contact-form.ts` solo cambiaba de estado local a "enviado" sin mandar nada a ningún sitio (así era también en el original, ver comentario que traía el archivo).

**Decisión arquitectónica previa:** el sitio es completamente estático (`output` por defecto de Astro, sin adapter). Enviar un correo real requiere ejecutar código de servidor (la API key de Resend no puede vivir en el cliente), así que hacía falta un adapter. Se confirmó con el usuario: hosting en Hostinger Cloud (soporta apps Node.js) y cuenta de Resend ya creada con `clapedu.org` verificado. Con eso:

- Se instaló `@astrojs/node` en modo `standalone` (genera un servidor Node autocontenido en `dist/server/entry.mjs`, sirve también los assets estáticos de `dist/client` — compatible con el modelo de hosting Node de Hostinger). El resto del sitio **sigue prerenderizado**: el adapter no cambia el `output` global, solo habilita rutas puntuales marcadas con `export const prerender = false`.
- Se instaló el SDK oficial `resend`.

**Archivos nuevos:**

- `src/pages/api/contact.ts` — endpoint `POST` on-demand. Valida server-side (defensa en profundidad, además del `required` nativo del HTML): los 3 campos no pueden estar vacíos, el email debe matchear un regex básico, límites de longitud razonables (120/200/5000 caracteres). Incluye un campo honeypot (`company`) — si viene relleno, responde `200 {ok:true}` sin enviar nada ni delatar que se detectó un bot. Llama a `resend.emails.send()` con `replyTo` seteado al email de quien escribió (para que Elba pueda responder directo desde su cliente de correo), captura errores de Resend y devuelve mensajes de error en español pensados para mostrarse en la UI.
- `src/lib/contact-email.ts` — arma el HTML del correo. Layout de tablas con estilos inline (no `<style>` externo, no flexbox/grid) porque así lo exigen los clientes de correo, sobre todo Outlook. Reutiliza literalmente los colores de marca de `global.css` (`--color-ink #341c65`, `--color-teal #3be0bb`, degradado `#2a1457 → #43197c → #13b89a` igual al de las secciones con fondo oscuro del sitio) y el mismo patrón visual "banda con degradado + card blanca" que ya usa `Contacto.astro`. Incluye botón "Responder a {nombre}" (`mailto:`), y genera también una versión en texto plano (buena práctica de entregabilidad, todos los clientes de correo la soportan como fallback).
- `src/env.d.ts` — tipado de `import.meta.env.RESEND_API_KEY` para `astro check` y autocompletado.
- `.env.example` — documenta la variable `RESEND_API_KEY` requerida (no se commitea `.env`, ya estaba en `.gitignore`).

**Archivos modificados:**

- `astro.config.mjs` — agrega `adapter: node({ mode: 'standalone' })`.
- `src/components/sections/Contacto.astro` — agrega el campo honeypot (oculto con `.hp-field { position:absolute; left:-9999px; ... }`, `tabindex="-1"`, `aria-hidden="true"` en el wrapper) y un `<p class="form-error" data-contact-error hidden>` para errores inline, estilizado en un rosa/rojo que no existía antes en la paleta (no hay color de error definido en `global.css`) pero se mantiene sobrio, a juego con el resto de la tarjeta blanca del formulario. Botón con estado `:disabled` (opacidad reducida, sin hover) mientras se envía.
- `src/scripts/contact-form.ts` — reescrito: ahora hace `fetch('/api/contact', { method: 'POST', ... })` con los datos del `FormData`, muestra "Enviando..." en el botón mientras espera, solo pasa al estado de éxito si la respuesta es `ok`, y si falla muestra el mensaje de error del servidor sin perder lo que la persona ya había escrito (no se limpia el formulario en el error, solo en éxito).

**Nota para dejar el sitio operativo en producción:** falta configurar la variable de entorno `RESEND_API_KEY` en el panel de Hostinger (Node.js App → Environment variables) con la clave real de la cuenta de Resend. Sin ella, el endpoint responde `500` con un mensaje genérico y lo deja registrado en el log del servidor (`console.error`), nunca revienta ni expone detalles internos al usuario.

**Bug encontrado en la prueba con clave real, corregido antes de dar por cerrada la integración:** el endpoint leía la clave con `import.meta.env.RESEND_API_KEY`. Con el adapter de Node, Vite resuelve esa expresión en **tiempo de build**, no en tiempo de ejecución — es decir, el valor queda "horneado" como literal dentro del bundle (`dist/server/chunks/contact_*.mjs`) con lo que hubiera en `.env` en el momento exacto del `npm run build`. Se detectó al generar una clave nueva de Resend y seguir recibiendo `401 API key is invalid`: la causa no era la clave (probada directo contra `api.resend.com`, funcionaba) sino que el bundle todavía tenía la clave *anterior*, inválida, incrustada como string. Esto además es un problema de fondo para producción: cambiar la variable en el panel de Hostinger sin volver a compilar no habría tenido ningún efecto. Corregido leyendo `process.env.RESEND_API_KEY` en su lugar — en Node esa variable sí se lee en vivo del entorno del proceso en cada request, que es el comportamiento correcto para un adapter standalone. Se eliminó también la interfaz `ImportMetaEnv` que se había agregado en `src/env.d.ts` (ya no aplica) dejando solo la referencia a `astro/client`. Verificado con `grep` que `dist/server/` ya no contiene ninguna clave `re_...` como texto literal tras el rebuild.

**Verificaciones:** `grep -c 'style="'` → 0 en `Contacto.astro` · `astro check` → 0 errores/0 warnings/0 hints (93 archivos) · `npm run build` (con adapter) → OK, genera `dist/client` (7 páginas estáticas, igual que antes) + `dist/server` (incluye el endpoint on-demand), sin secretos horneados en el bundle · Probado end-to-end contra `astro dev` y contra el servidor standalone real (`node dist/server/entry.mjs`, el mismo artefacto que corre en Hostinger): campos vacíos → bloqueado por validación nativa `required` (ni siquiera dispara `fetch`); email inválido → `400` con mensaje claro; honeypot relleno → `200 ok` sin llamar a Resend; sin `RESEND_API_KEY` → `500` "no disponible"; con clave inválida → Resend responde `401`, el endpoint lo traduce a `502` con mensaje amigable (verificado por `curl` y Playwright); **con clave real de Resend válida y dominio verificado, envío real exitoso** tanto por `curl` directo al endpoint como desde el formulario real en el navegador con Playwright (estado "Enviando…" → estado de éxito "¡Gracias!"). Plantilla del correo renderizada y capturada con Playwright para revisión visual: degradado, tipografía y botón coinciden con la identidad del sitio.

---

## Integración: reCAPTCHA v3 en el formulario de contacto (2026-07-10)

El usuario pidió proteger el formulario de contacto con reCAPTCHA, además del honeypot ya existente. Se eligió **v3 invisible** (sin checkbox ni fricción para quien lo llena; da un puntaje 0-1 de qué tan humano parece el comportamiento, en vez de un pasa/no-pasa binario).

**Cliente:**
- `Contacto.astro`: nueva const `RECAPTCHA_SITE_KEY = import.meta.env.PUBLIC_RECAPTCHA_SITE_KEY` en el frontmatter — a diferencia de la clave secreta de Resend, esta sí es correcto leerla vía `import.meta.env`, porque **es pública por diseño** (viaja en el HTML/JS del navegador) y la página del home donde vive `#contacto` sigue siendo prerenderizada (estática), así que necesita estar disponible en tiempo de **build**, no de request. Se expone como `data-recaptcha-site-key` en la propia `<section id="contacto">` (evita pelear con `define:vars` en un script que además usa `import` de módulos locales) y se carga `https://www.google.com/recaptcha/api.js?render={SITE_KEY}` como script externo.
- `contact-form.ts`: antes de hacer `fetch`, pide un token con `grecaptcha.ready()` + `grecaptcha.execute(siteKey, {action:"contact"})` y lo manda como `recaptchaToken` en el body. Si `grecaptcha` no cargó o el token falla, se corta ahí con un mensaje de error claro, sin llegar a golpear el servidor.

**Servidor (`src/pages/api/contact.ts`):**
- Nueva función `verifyRecaptcha(token, remoteIp)`: llama a `https://www.google.com/recaptcha/api/siteverify` con la clave secreta (`process.env.RECAPTCHA_SECRET_KEY` — mismo patrón que `RESEND_API_KEY`, se lee en runtime, nunca vía `import.meta.env`) y rechaza si `success` es falso, si la `action` devuelta no es `"contact"`, o si el `score` es menor a `0.5` (el umbral inicial recomendado por Google). Se inserta en la cadena de validación después del honeypot/campos obligatorios y antes de llamar a Resend — así una petición que no pasa reCAPTCHA nunca llega a gastar una llamada a Resend.

**Bloqueador encontrado, no resuelto en esta sesión — requiere producción:** probando en local (`astro dev` / servidor standalone en `localhost`), Google rechaza sistemáticamente el token con el código `browser-error`. Se descartó que fuera un bug propio con 3 pruebas independientes: (1) capturar el token real generado por el navegador vía Playwright y verificarlo directo por `curl` contra `siteverify`, sin pasar por el endpoint — mismo error; (2) repetir con un contexto de navegador "no headless" (sin `navigator.webdriver`, con user-agent de Chrome real) para descartar que Google detectara Playwright como bot — mismo error; (3) confirmar que el widget sí carga y sí genera un token con forma válida (518 caracteres) antes de la verificación. El usuario confirmó que en la consola de reCAPTCHA no es posible agregar `localhost` como dominio para esta clave — la clave está restringida al dominio de producción (`clapedu.org`), así que la verificación real solo puede probarse una vez desplegado. Queda pendiente probar en producción tras el despliegue a Hostinger.

**Nota para producción:** al construirse desde Git en el panel de Hostinger, `PUBLIC_RECAPTCHA_SITE_KEY` debe estar configurada como variable de entorno **antes** del build (se hornea en el HTML estático del home, igual que cualquier valor de frontmatter). `RECAPTCHA_SECRET_KEY` y `RESEND_API_KEY` deben estar configuradas para el proceso en tiempo de ejecución (se leen en cada request). Las 3 se configuran en el mismo lugar: Hostinger hPanel → Node.js App → Environment variables.

**Verificaciones:** `grep -c 'style="'` → 0 en `Contacto.astro`, `contact.ts` y `contact-form.ts` · `astro check` → 0 errores/0 warnings/0 hints (93 archivos) · `npm run build` → OK; confirmado con `grep` en el HTML compilado que `PUBLIC_RECAPTCHA_SITE_KEY` (pública) sí queda en `dist/client/index.html` como se espera, y que `RECAPTCHA_SECRET_KEY` (privada) no aparece en ningún archivo de `dist/` · Probado contra el servidor standalone real: sin token → `400`; token inválido/falso → `403` (verificado que `siteverify` efectivamente lo rechaza); flujo completo desde el navegador con Playwright → token se genera correctamente, honeypot y validación de campos sin regresiones — bloqueado únicamente en el paso final de verificación contra Google por la restricción de dominio de la clave, no por el código.

---

## Limpieza y optimización de imágenes: conversión a WebP (2026-07-11)

El usuario pidió convertir todas las imágenes usadas en el sitio a WebP, ajustar las referencias, borrar los originales y borrar cualquier imagen que no se estuviera usando en ningún lado.

**Diagnóstico previo (antes de tocar nada):** se generó un mapa completo de uso de las 94 imágenes en `src/assets/images/` haciendo `grep` de cada nombre de archivo contra todo `src/`. La primera pasada usó coincidencia de substring simple y dio resultados falsos: varios nombres del proyecto son sufijo exacto de otro nombre más largo (`logo-comunidad.png` es sufijo de `programas-logo-comunidad.png`; `grain.png` es sufijo de `noise-grain.png`; etc.), así que un `grep -F` sin anclar contaba como "usado" un archivo que en realidad nunca se importa — el match real pertenecía al archivo con el nombre más largo. Se corrigió anclando la búsqueda a `"/" + nombre` (el carácter que precede a un nombre de archivo en cualquier ruta de import), lo que elimina el falso positivo. Esta lección quedó documentada en el propio script de conversión (`repoint()`) porque es fácil de repetir si se vuelve a tocar el pipeline de assets.

Con el mapa correcto salieron tres categorías:

1. **29 archivos huérfanos reales** (cero referencias en todo el repo, verificado también con un `grep` sin restricción de extensión de archivo por si acaso): en su mayoría restos de una convención de nombres anterior — por cada persona del equipo y cada fase de la metodología existía un `foto-*.webp` o `foto-*.png` idéntico byte a byte (confirmado con `md5sum`) al archivo realmente usado con el nombre nuevo (`equipo-dir-*.webp`, `metodologia-fase-*.webp`). También 4 archivos `dirigido-full-*.png` duplicados de los `programas-dirigido-*.png` en uso, y el par `bg-*`/`logo-*` sin prefijo que resultó ser el huérfano real de cada pareja con `programas-*` (ver hallazgo siguiente). Se borraron directamente, sin conversión.
2. **Un trío duplicado real, con las 3 copias en uso a la vez:** `grain.png`, `noise-grain.png` y `noise-texture.png` eran el mismo archivo (mismo MD5, 852 KB), importado de forma independiente en 3, 2 y 12 archivos respectivamente — la textura de ruido de fondo que se reutiliza en casi todas las secciones del sitio, pero cada quien la había copiado con su propio nombre al construir su sección en vez de reusar el import. Se convirtió una sola vez (`noise-texture.png`, la de más referencias, para minimizar archivos a repuntar) y se repuntaron los 17 archivos que importaban cualquiera de los 3 nombres al `noise-texture.webp` único resultante.
3. **~36 archivos de uso único** sin ningún duplicado: conversión directa 1:1 manteniendo el nombre base.

**Conversión:** usando `cwebp` (ya disponible en el sistema) con 3 perfiles de calidad según el tipo de contenido:
- Logos con transparencia/texto (`logo-*.png`, `programas-logo-*.png`): `-lossless` — son pequeños y priorizan nitidez de bordes/texto sobre el tamaño.
- Gráficos, mockups, diagramas y fondos (`bento-*`, `*-mobile.png`, `metodologia-diagram`, `hub-creativo-bg`, `uled-bg`, `urbit-lab-bg`, `programas-bg-comunidad`, `programas-dirigido-*`, la textura de ruido): `-q 90`.
- Fotografías (banners, eventos, sede, equipo, testimonios, `metodologia-territorio`): `-q 80`.

**Caso especial — `logo-clap-purple.png` no se tocó por duplicado:** existen dos archivos con el mismo nombre en rutas distintas y con propósitos distintos: `src/assets/images/logo-clap-purple.png` (importado por `Footer.astro`, pasa por el pipeline de imágenes de Astro) y `public/logo-clap-purple.png` (referenciado como URL absoluta en el JSON-LD de `BaseLayout.astro`, para el campo `logo` de los datos estructurados de la organización). Por tener el mismo nombre de archivo, un `grep`/reemplazo automático sin cuidado habría corrompido la referencia de `BaseLayout.astro`. Se resolvió a mano: se convirtió solo la copia de `src/assets/images/` a `.webp` (lossless) y se editó únicamente el `import` de `Footer.astro`; el archivo de `public/` se dejó intacto (ver exclusión siguiente).

**Qué se dejó fuera deliberadamente (no todo "imagen" debía convertirse):** los archivos de `public/` que sirven a consumidores externos con expectativas de formato específicas se dejaron sin tocar — `favicon.ico`, `favicon.svg`, `favicon.png`, `apple-touch-icon.png` (Apple exige PNG para el ícono de acceso directo en iOS), `social-preview-fallback.png` (imagen Open Graph: muchos crawlers de redes sociales — Facebook, LinkedIn, WhatsApp — todavía no soportan WebP de forma confiable) y `public/logo-clap-purple.png` (logo referenciado en JSON-LD, mismo criterio de compatibilidad conservadora). Es la misma lógica de excepción documentada ya para los estilos inline del correo de Resend: una regla general del proyecto con una excepción puntual y justificada, no una omisión.

**Resultado:** `src/assets/images/` pasó de 94 archivos / 49 MB a 63 archivos / 22 MB (-55%). 71 archivos borrados (29 huérfanos + 3 del trío `grain`/`noise-*` + 1 `logo-clap-purple.png` + 38 originales convertidos), 40 archivos `.webp` nuevos, 26 componentes/`data` repuntados a los nuevos nombres.

**Verificaciones:** `astro check` → 0 errores/0 warnings/0 hints (93 archivos) · `npm run build` → OK · `grep` posterior confirma cero referencias a `.png`/`.jpg`/`.jpeg` bajo `assets/images` en todo `src/` (fuera de las exclusiones documentadas de `public/`) · Servidor `astro preview` + `curl`: las 5 páginas (`/`, `/programas/`, `/equipo/`, `/metodologia/`, `/sobre-nosotros/`) responden `200` y cada URL `/_astro/*.webp` que referencian también responde `200` · Playwright contra las mismas 5 páginas: cero `requestfailed` en cualquiera de ellas; capturas de pantalla de página completa confirman visualmente que fotos de equipo, logos del ecosistema, testimonios, banners de eventos y las 4 fases de la metodología se ven correctamente (una sección de `/metodologia/` apareció en blanco en la primera captura por ser una animación *scroll-reveal* que no dispara en un screenshot instantáneo — se confirmó con una segunda captura haciendo scroll gradual antes de fotografiar, sin relación con el cambio de imágenes).

---

## Favicon: wordmark de marca en vez del ícono "A" (2026-07-11)

El usuario pidió que `public/logo-clap-purple.png` (el wordmark ":clap:", 150×57) se usara como favicon. Antes de aplicarlo se generó una vista previa a tamaño real (32×16 y 16×16 px, el tamaño con el que efectivamente se renderiza en la pestaña del navegador) porque es un logo horizontal, no un ícono cuadrado: a 16 px se vuelve prácticamente ilegible. Se mostró esa comparación al usuario, quien confirmó que quería usarlo de todas formas.

Se implementó en `src/layouts/BaseLayout.astro`: se quitó el `<link rel="icon" type="image/svg+xml" href="/favicon.svg">` (el ícono de marca "A" que existía antes — los navegadores modernos priorizan el SVG sobre el PNG si ambos están declarados, así que dejarlo habría impedido que se viera el wordmark) y se apuntó el único `<link rel="icon">` restante directo a `/logo-clap-purple.png`. Se detectó que `public/favicon.png` era un duplicado byte-a-byte de `logo-clap-purple.png` (mismo MD5) que quedaba sin ninguna referencia tras el cambio, así que se borró siguiendo el mismo criterio de la limpieza de imágenes de la entrada anterior. `public/favicon.svg` se dejó en disco sin borrar (por si se quiere revertir) pero ya no se referencia desde ningún layout. `apple-touch-icon.png` (ícono cuadrado "A" para iOS) no se tocó — el pedido era solo sobre el favicon de pestaña.

**Verificado:** `astro check` → 0/0/0 · `npm run build` → OK · HTML compilado contiene `<link rel="icon" type="image/png" href="/logo-clap-purple.png">` · `curl` confirma `200` y bytes idénticos (mismo MD5) entre lo servido y el archivo en `public/`.
