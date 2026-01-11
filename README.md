# Aniet Manualidades

Sitio estático cálido y comunitario para mostrar las creaciones del club de arte en casa.

## Estructura
- `index.html` landing con destacados.
- `objects.html` galería completa de objetos (filtros + lightbox).
- `community.html` galería de personas y momentos (filtros + lightbox).
- `classes.html` información de talleres y eventos.
- `contact.html` cómo unirse y preguntas frecuentes.
- `data/objects.json` y `data/people.json` se generan desde `resources/`.
- `scripts/generate_galleries.py` genera los JSON leyendo `resources/imagesObjects` y `resources/imagesPeople`.
- `resources/` contiene las fotos originales (no mover ni renombrar).

## Ejecutar localmente
1. Instala Python 3.
2. Desde la raíz del repo:
   ```bash
   python3 -m http.server 8000
   ```
3. Abre `http://localhost:8000` en tu navegador.

## Regenerar los datos de galería
Si agregas o quitas imágenes en `resources/`, vuelve a generar los JSON:
```bash
python3 scripts/generate_galleries.py
```

## Despliegue en GitHub Pages
1. Haz commit y push al repositorio.
2. En GitHub, ve a **Settings → Pages**.
3. En **Source**, selecciona la rama (por ejemplo `main`) y la carpeta `/ (root)`.
4. Guarda. En unos minutos estará disponible la URL de Pages. Recuerda usar rutas relativas (ya configurado).

## Notas
- Usa `encodeURI` en el código JS al asignar `img.src` para manejar nombres con espacios o caracteres especiales.
- `.DS_Store` y `desktop.ini` están ignorados por Git.
