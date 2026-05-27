# Panel de ventas del restaurante (frontend-v1)

Panel de ventas responsive para **Restaurante Estrella**, creado con HTML, CSS y JavaScript moderno. Este frontend consume datos de ventas desde un endpoint HTTP, dibuja cuatro gráficos con Chart.js y ofrece la interfaz en español e inglés con modo claro/oscuro.

## Tecnologías

- HTML5 / CSS3
- JavaScript ES Modules
- Chart.js
- Bootstrap 5
- Font Awesome
- Google Fonts

## Desarrollo local

No se requiere `npm` ni bundler.

1. Abre `index.html` para la versión en español o `en.html` para la versión en inglés directamente desde tu navegador.
2. Pulsa el botón **Cargar datos** para obtener las ventas y generar los gráficos.
3. Cambia el tema con el botón 🌙/☀️; la elección se guarda en `localStorage`.

> El proyecto carga `main.js` como módulo ES (`type="module"`). Si tu navegador restringe el acceso local sobre `file://`, usa la extensión Live Server de VS Code para abrir las páginas.

## Uso

- `index.html`: panel en español.
- `en.html`: panel en inglés.
- `error.html`: página de error estática que puede usarse como documento de error en S3.
- `main.js`: gestiona la carga de datos, la construcción de gráficos, el idioma y el tema.
- `translations.js`: define los textos de la UI para `es` y `en`.
- `utils.js`: funciones de utilidad para tema, formato, colores y leyendas.
- `style.css`: estilos responsivos, modo oscuro y diseño del dashboard.
- `presentation/`: presentación en Markdown con capturas de pantalla.

## Estructura del proyecto

| Archivo | Descripción |
|---------|-------------|
| `index.html` | Panel en español (`data-page-lang="es"`). |
| `en.html` | Panel en inglés (`data-page-lang="en"`). |
| `error.html` | Página de error/404 estática. |
| `main.js` | Lógica principal: API, gráficos, idioma, tema. |
| `translations.js` | Textos e idiomas de la UI. |
| `utils.js` | Utilidades compartidas y formato de datos. |
| `style.css` | Estilos del dashboard y responsive. |

## Características

- Cuatro gráficos con Chart.js:
  - Ingresos por categoría (tarta).
  - Pedidos por hora (dona).
  - Artículos más vendidos (tarta).
  - Ingresos diarios (barras).
- Leyendas compactas con hasta 5 etiquetas y “+N más”.
- Carga manual de datos con indicador de espera.
- Soporte para español e inglés.
- Tema claro/oscuro persistente en `localStorage`.

## API y formato de datos

El frontend carga datos desde este endpoint:

```http
GET https://9nccdykio2.execute-api.eu-north-1.amazonaws.com/prod/sales
```

La respuesta esperada debe incluir un arreglo `salesRecords` con objetos de ventas:

```json
{
  "salesRecords": [
    {
      "date": "2025-01-15",
      "totalRevenue": 1200.5,
      "revenueByCategory": {
        "Entrantes": 300,
        "Postres": 150
      },
      "ordersByHour": {
        "12": 5,
        "13": 8
      },
      "itemsSold": [
        { "itemId": "PAELLA-01", "qty": 3 }
      ]
    }
  ]
}
```

El código agrega los registros para construir los gráficos de categoría, hora, artículo y día.

## Despliegue

Este proyecto está diseñado para funcionar como un sitio web estático alojado directamente en un bucket S3.

- Bucket: `restaurant-sales-dashboard`
- Región: `eu-north-1`
- URL: `https://restaurant-sales-dashboard.s3.eu-north-1.amazonaws.com`
- No se requiere compilación ni bundling: sube los archivos tal cual.

## Notas

- `main.js` determina el idioma usando el atributo `data-page-lang` del elemento `html`.
- Si el dashboard no carga datos, revisa el endpoint y la configuración de CORS.


 ## git repo
 https://github.com/MSTVLC/frontend-v1.git

## Contacto

Restaurante Estrella — support@mysite.com · +34 969 636 773
