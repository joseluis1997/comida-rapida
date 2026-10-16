-- ===== TABLAS =====
create table public.categorias (
  id bigint generated always as identity primary key,
  nombre text not null unique check (char_length(nombre) between 2 and 60),
  descripcion text check (char_length(descripcion) <= 500)
);
create table public.restaurantes (
  id bigint generated always as identity primary key,
  nombre text not null check (char_length(nombre) between 2 and 120),
  descripcion text check (char_length(descripcion) <= 500),
  direccion text not null check (char_length(direccion) between 3 and 120),
  telefono text check (telefono ~ '^[0-9+ -]{7,20}$'),
  horario text check (char_length(horario) <= 120),
  imagen_url text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);
-- Relación N:M restaurante <-> categoría
create table public.restaurante_categorias (
  restaurante_id bigint not null references public.restaurantes(id) on delete cascade,
  categoria_id bigint not null references public.categorias(id) on delete cascade,
  primary key (restaurante_id, categoria_id)
);
-- Relación 1:N restaurante -> comidas
create table public.comidas (
  id bigint generated always as identity primary key,
  restaurante_id bigint not null references public.restaurantes(id) on delete cascade,
  categoria_id bigint references public.categorias(id) on delete set null,
  nombre text not null check (char_length(nombre) between 2 and 120),
  descripcion text check (char_length(descripcion) <= 500),
  precio numeric(8,2) not null check (precio >= 0 and precio <= 9999),
  imagen_url text,
  disponible boolean not null default true
);
create index on public.comidas(restaurante_id);
create index on public.restaurante_categorias(categoria_id);

-- ===== SEGURIDAD (RLS): lectura pública, escritura solo administradores autenticados =====
alter table public.categorias enable row level security;
alter table public.restaurantes enable row level security;
alter table public.restaurante_categorias enable row level security;
alter table public.comidas enable row level security;

do $$ declare t text; begin
  foreach t in array array['categorias','restaurantes','restaurante_categorias','comidas'] loop
    execute format('create policy "lectura publica" on public.%I for select using (true)', t);
    execute format('create policy "admin escribe" on public.%I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- ===== IMÁGENES (Storage) =====
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('imagenes','imagenes',true,2097152,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy "imagenes lectura" on storage.objects for select using (bucket_id='imagenes');
create policy "imagenes insertar" on storage.objects for insert to authenticated with check (bucket_id='imagenes');
create policy "imagenes actualizar" on storage.objects for update to authenticated using (bucket_id='imagenes');
create policy "imagenes borrar" on storage.objects for delete to authenticated using (bucket_id='imagenes');

-- ===== DATOS DE EJEMPLO =====
insert into public.categorias (nombre, descripcion) values
 ('Hamburguesas','Hamburguesas caseras y combos'),('Pollo frito','Broaster y pollo crocante'),
 ('Salchipapas','Clásicas y especiales'),('Pizzas','Pizzas personales y familiares'),
 ('Comida criolla','Platos tradicionales del Chaco'),('Bebidas','Refrescos y jugos');
with r as (insert into public.restaurantes (nombre,descripcion,direccion,telefono,horario)
 values ('Sabor Chaqueño','Comida rápida con el sabor de Caraparí.','Calle Bolívar s/n, Caraparí','70000000','Lun-Dom 18:00-23:00') returning id)
insert into public.comidas (restaurante_id,categoria_id,nombre,descripcion,precio)
select r.id,(select id from public.categorias where nombre='Hamburguesas'),'Hamburguesa doble','Doble carne, queso y papas',25 from r;
