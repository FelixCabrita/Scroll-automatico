# Auto Scroll

Extensión de Chrome (Manifest V3) que hace scroll automático y fluido en cualquier página web, con velocidad ajustable. Pensada para **grabar páginas web**: le das a iniciar, empiezas tu grabador de pantalla (OBS, QuickTime, la grabadora de Windows, lo que uses) y la página se desplaza sola a un ritmo constante, sin tirones ni mano temblorosa.

> La extensión **no graba nada**: solo se encarga del scroll. La grabación la haces tú con la herramienta que prefieras.

## Características

- **Scroll suave** basado en `requestAnimationFrame`. La velocidad se mide en píxeles por segundo y se calcula con el tiempo real entre frames, así que va igual de fluido a 60 Hz que a 144 Hz.
- **Velocidad ajustable de 5 a 300 px/s**, en vivo mientras la página se mueve (slider o botones de ± 10).
- **Modo bucle (rebote)**: al llegar al final sube, al llegar arriba baja, y así sin parar. Si está apagado, el scroll se detiene al llegar al fondo.
- **Pausar / reanudar** desde el popup.
- **Volver arriba** con animación suave.
- El popup recuerda el estado de la pestaña (corriendo, velocidad, bucle) cada vez que lo abres.
- Funciona en cualquier sitio http/https (`<all_urls>`). Sin dependencias, sin build, sin servidores, sin analítica.

## Instalación

Todavía no está en la Chrome Web Store, así que se instala en modo desarrollador:

1. Clona o descarga el repositorio:
   ```bash
   git clone https://github.com/FelixCabrita/Scroll-automatico.git
   ```
2. Abre `chrome://extensions` en Chrome (o Edge, Brave, cualquier navegador basado en Chromium).
3. Activa **Modo de desarrollador** (arriba a la derecha).
4. Pulsa **Cargar descomprimida** y selecciona la carpeta del proyecto.
5. Fija la extensión en la barra de herramientas (icono del puzzle) para tenerla a mano.

## Uso

1. Abre la página que quieras grabar.
2. Haz clic en el icono de Auto Scroll.
3. Ajusta la velocidad. Para grabar texto legible suele ir bien entre 30 y 80 px/s; para un recorrido rápido, 150+.
4. Activa **Bucle automático** si quieres que no se detenga al llegar al final.
5. Empieza tu grabación y pulsa **▶ Iniciar**.

| Control | Qué hace |
|---|---|
| ▶ Iniciar / ⏸ Pausar | Arranca o detiene el scroll |
| Slider de velocidad | De 5 a 300 px/s, se aplica al instante |
| − Más lento / + Más rápido | Baja o sube 10 px/s |
| ⟳ Bucle automático | Rebote continuo arriba/abajo |
| ⟲ Volver arriba | Detiene el scroll y sube suavemente al inicio |

## Cómo funciona

```
┌──────────────┐   chrome.tabs.sendMessage   ┌──────────────────┐
│  popup.html  │ ──────────────────────────▶ │    content.js    │
│  popup.js    │  START / STOP / SET_SPEED   │ (inyectado en la │
│  (interfaz)  │  SET_LOOP / RESET /         │  página activa)  │
│              │  GET_STATE                  │                  │
│              │ ◀────────────────────────── │  loop con        │
└──────────────┘      SCROLL_STOPPED         │  requestAnimation│
                                             │  Frame           │
                                             └──────────────────┘
```

- **`content.js`** guarda el estado (velocidad, dirección, bucle) y ejecuta el loop de animación. En cada frame calcula `px = velocidad × delta_ms / 1000` y llama a `window.scrollBy(...)`. Detecta el fondo (`innerHeight + scrollY >= scrollHeight - 2`) y el tope (`scrollY <= 0`) para parar o invertir la dirección.
- **`popup.js`** es solo la interfaz: manda mensajes al content script de la pestaña activa. Si el content script no está inyectado todavía (por ejemplo, en una pestaña que ya estaba abierta al instalar la extensión), lo inyecta al vuelo con `chrome.scripting.executeScript` y reintenta.
- **`manifest.json`** declara la extensión (MV3), los permisos y el content script.

### Permisos

| Permiso | Para qué |
|---|---|
| `activeTab` | Acceder a la pestaña activa cuando abres el popup |
| `scripting` | Inyectar `content.js` si no estaba cargado |
| `storage` | Declarado, pero **todavía no se usa** en el código |

## Estructura del proyecto

```
.
├── manifest.json        # Configuración de la extensión (MV3)
├── content.js           # Lógica del scroll, corre dentro de la página
├── popup.html           # Interfaz del popup (HTML + CSS)
├── popup.js             # Lógica del popup
├── generate-icons.html  # Utilidad para regenerar los iconos PNG
└── icons/               # Iconos 16, 48 y 128 px
```

### Regenerar los iconos

Abre `generate-icons.html` en Chrome, pulsa el botón y se descargan los tres PNG (`icon16.png`, `icon48.png`, `icon128.png`). Cópialos a `icons/`.

## Limitaciones conocidas

- **El atajo `Alt+S` no funciona todavía.** Está declarado en `manifest.json` (`commands`) y el popup lo muestra, pero falta un service worker (`background`) que escuche `chrome.commands.onCommand` y le mande el mensaje al content script. Por ahora, solo se controla desde el popup.
- **Solo hace scroll de la ventana principal** (`window`). Páginas donde el contenido se desplaza dentro de un contenedor propio con `overflow: auto` (apps tipo Notion, Gmail, algunos visores de documentos) no se moverán.
- **No funciona en páginas internas del navegador** (`chrome://`, Chrome Web Store, visor de PDF nativo), porque Chrome no permite inyectar scripts ahí.
- **Páginas con scroll infinito**: el "fondo" se calcula con la altura actual del documento, así que si la página carga más contenido al llegar abajo, el scroll puede detenerse (o rebotar) antes de tiempo.
- **El estado no persiste**: si recargas la página, el scroll se detiene y la velocidad vuelve a 50 px/s.

## Ideas para el futuro

- Hacer funcionar el atajo de teclado con un service worker.
- Guardar velocidad y modo bucle con `chrome.storage`.
- Soporte para contenedores con scroll interno.
- Cuenta atrás antes de iniciar, para tener tiempo de darle a grabar.
- Publicar en la Chrome Web Store.

## Contribuir

Los issues y pull requests son bienvenidos. No hay paso de build: edita los archivos, recarga la extensión en `chrome://extensions` y prueba.

## Licencia

Aún no hay un archivo `LICENSE`. Antes de hacer público el repositorio, añade uno (por ejemplo MIT) para dejar claro bajo qué condiciones otras personas pueden usar y modificar el código.
