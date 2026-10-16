# Sistema web para la gestión de locales de comida rápida de Caraparí
Sitio estático (HTML/CSS/JS) + Supabase (PostgreSQL, Auth, Storage).

## Instalación
1. Cree una cuenta y un proyecto en https://supabase.com.
2. En **SQL Editor > New query**, pegue todo `supabase/schema.sql` y pulse **Run**.
3. En **Authentication > Providers > Email** desactive "Allow new users to sign up" (solo usted crea administradores).
4. En **Authentication > Users > Add user** cree el correo y contraseña del administrador (marque "Auto confirm").
5. En **Project Settings > API** copie *Project URL* y la clave *anon public* y péguelas en `js/config.js`.
6. Ejecute el sitio: dentro de la carpeta abra una terminal y use `python -m http.server 8000`
   (o la extensión "Live Server" de VS Code) y abra http://localhost:8000
7. Publicación gratuita: suba la carpeta a Netlify, Vercel o GitHub Pages.
   Luego añada su dominio en Authentication > URL Configuration.

## Uso
- `index.html`: página pública (buscador, filtros por categoría, ver comidas y precios en Bs).
- `admin.html`: ingrese con su usuario. Pestañas: Categorías (cree primero), Restaurantes, Comidas y precios.
  Cada una permite Crear (+ Nuevo), Editar y Eliminar. Las fotos se suben a Supabase Storage.

## Seguridad incluida
RLS: cualquiera lee, solo usuarios autenticados escriben · validaciones CHECK en BD y en formularios ·
imágenes limitadas a JPG/PNG/WEBP de 2 MB · texto escapado contra XSS · solo se usa la clave anon.
