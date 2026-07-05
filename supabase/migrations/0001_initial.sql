create extension if not exists pgcrypto;

-- Enums
create type review_status as enum ('draft', 'published');
create type comment_status as enum ('pending', 'approved', 'rejected');
create type reaction_type as enum ('like', 'love', 'wow', 'applause');

-- Perfil de la autora (extiende auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Categorías
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- Críticas
create table reviews (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id),
  category_id uuid references categories(id),
  title text not null,
  venue text,
  event_date date,
  rating smallint check (rating between 1 and 5),
  body text not null,
  slug text not null unique,
  status review_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Imágenes (hasta 2 por crítica)
create table review_images (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references reviews(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  position smallint not null check (position in (1, 2)),
  created_at timestamptz not null default now(),
  unique (review_id, position)
);

-- Tags / palabras clave (N:M)
create table tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);

create table review_tags (
  review_id uuid references reviews(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (review_id, tag_id)
);

-- Comentarios (públicos, con moderación)
create table comments (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references reviews(id) on delete cascade,
  author_name text not null,
  body text not null,
  status comment_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- Reacciones (públicas, deduplicadas por id anónimo)
create table reactions (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references reviews(id) on delete cascade,
  type reaction_type not null,
  anon_id text not null,
  created_at timestamptz not null default now(),
  unique (review_id, type, anon_id)
);

-- Índices útiles
create index idx_reviews_status on reviews(status, published_at desc);
create index idx_comments_review on comments(review_id, status);
create index idx_reactions_review on reactions(review_id);

-- Bucket de imágenes
insert into storage.buckets (id, name, public)
values ('review-images', 'review-images', true)
on conflict (id) do update
set public = excluded.public;

-- RLS
alter table profiles enable row level security;
alter table categories enable row level security;
alter table reviews enable row level security;
alter table review_images enable row level security;
alter table tags enable row level security;
alter table review_tags enable row level security;
alter table comments enable row level security;
alter table reactions enable row level security;
-- storage.objects ya tiene RLS habilitado por defecto en Supabase y es
-- propiedad de supabase_storage_admin: no se puede (ni hace falta) alterarlo
-- desde acá. Las políticas de abajo se crean igual sobre esa tabla.

-- profiles: lectura pública, escritura solo de la autora autenticada
create policy "profiles are publicly readable"
on profiles for select
using (true);

create policy "profiles can be managed by the owner"
on profiles for insert
with check (auth.uid() = id);

create policy "profiles can be updated by the owner"
on profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "profiles can be deleted by the owner"
on profiles for delete
using (auth.uid() = id);

-- categories: lectura pública, escritura solo autora
create policy "categories are publicly readable"
on categories for select
using (true);

create policy "categories can be managed by the author"
on categories for insert
with check (auth.uid() is not null);

create policy "categories can be updated by the author"
on categories for update
using (auth.uid() is not null)
with check (auth.uid() is not null);

create policy "categories can be deleted by the author"
on categories for delete
using (auth.uid() is not null);

-- reviews: lectura pública solo publicadas, escritura solo autora
create policy "published reviews are publicly readable"
on reviews for select
using (status = 'published');

create policy "reviews can be inserted by the author"
on reviews for insert
with check (author_id = auth.uid());

create policy "reviews can be updated by the author"
on reviews for update
using (author_id = auth.uid())
with check (author_id = auth.uid());

create policy "reviews can be deleted by the author"
on reviews for delete
using (author_id = auth.uid());

-- review_images: lectura pública solo si la crítica está publicada
create policy "review images for published reviews are publicly readable"
on review_images for select
using (
  exists (
    select 1
    from reviews
    where reviews.id = review_images.review_id
      and reviews.status = 'published'
  )
);

create policy "review images can be managed by the author"
on review_images for insert
with check (
  exists (
    select 1
    from reviews
    where reviews.id = review_images.review_id
      and reviews.author_id = auth.uid()
  )
);

create policy "review images can be updated by the author"
on review_images for update
using (
  exists (
    select 1
    from reviews
    where reviews.id = review_images.review_id
      and reviews.author_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from reviews
    where reviews.id = review_images.review_id
      and reviews.author_id = auth.uid()
  )
);

create policy "review images can be deleted by the author"
on review_images for delete
using (
  exists (
    select 1
    from reviews
    where reviews.id = review_images.review_id
      and reviews.author_id = auth.uid()
  )
);

-- tags: lectura pública, escritura solo autora
create policy "tags are publicly readable"
on tags for select
using (true);

create policy "tags can be managed by the author"
on tags for insert
with check (auth.uid() is not null);

create policy "tags can be updated by the author"
on tags for update
using (auth.uid() is not null)
with check (auth.uid() is not null);

create policy "tags can be deleted by the author"
on tags for delete
using (auth.uid() is not null);

-- review_tags: lectura pública si la crítica está publicada
create policy "review tags for published reviews are publicly readable"
on review_tags for select
using (
  exists (
    select 1
    from reviews
    where reviews.id = review_tags.review_id
      and reviews.status = 'published'
  )
);

create policy "review tags can be managed by the author"
on review_tags for insert
with check (
  exists (
    select 1
    from reviews
    where reviews.id = review_tags.review_id
      and reviews.author_id = auth.uid()
  )
);

create policy "review tags can be updated by the author"
on review_tags for update
using (
  exists (
    select 1
    from reviews
    where reviews.id = review_tags.review_id
      and reviews.author_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from reviews
    where reviews.id = review_tags.review_id
      and reviews.author_id = auth.uid()
  )
);

create policy "review tags can be deleted by the author"
on review_tags for delete
using (
  exists (
    select 1
    from reviews
    where reviews.id = review_tags.review_id
      and reviews.author_id = auth.uid()
  )
);

-- comments: insert público, lectura solo aprobados, moderación solo autora
create policy "approved comments are publicly readable"
on comments for select
using (status = 'approved');

create policy "comments can be inserted publicly"
on comments for insert
with check (true);

create policy "comments can be moderated by the author"
on comments for update
using (
  exists (
    select 1
    from reviews
    where reviews.id = comments.review_id
      and reviews.author_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from reviews
    where reviews.id = comments.review_id
      and reviews.author_id = auth.uid()
  )
);

create policy "comments can be deleted by the author"
on comments for delete
using (
  exists (
    select 1
    from reviews
    where reviews.id = comments.review_id
      and reviews.author_id = auth.uid()
  )
);

-- reactions: lectura e inserción públicas
create policy "reactions are publicly readable"
on reactions for select
using (true);

create policy "reactions can be inserted publicly"
on reactions for insert
with check (true);

-- Storage: lectura pública, escritura solo autenticada
create policy "review images are publicly readable from storage"
on storage.objects for select
using (bucket_id = 'review-images');

create policy "review images can be uploaded by authenticated users"
on storage.objects for insert
with check (bucket_id = 'review-images' and auth.role() = 'authenticated');

create policy "review images can be updated by authenticated users"
on storage.objects for update
using (bucket_id = 'review-images' and auth.role() = 'authenticated')
with check (bucket_id = 'review-images' and auth.role() = 'authenticated');

create policy "review images can be deleted by authenticated users"
on storage.objects for delete
using (bucket_id = 'review-images' and auth.role() = 'authenticated');