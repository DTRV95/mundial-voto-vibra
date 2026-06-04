-- ============================================================
-- TABELA: news
-- Corre no SQL Editor do Supabase para criar a tabela de notícias.
-- ============================================================

create table if not exists public.news (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  excerpt     text,
  content     text,
  image_url   text,
  category    text not null default 'noticia'
              check (category in ('analise','antevisao','noticia','opiniao')),
  published   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Índice para query principal (publicadas, mais recentes primeiro)
create index if not exists news_published_created_idx
  on public.news (published, created_at desc);

-- RLS
alter table public.news enable row level security;

-- Qualquer pessoa pode ler artigos publicados
create policy "news_public_read" on public.news
  for select using (published = true);

-- Só admins podem escrever (via service_role no admin panel)
create policy "news_admin_all" on public.news
  for all using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Trigger para updated_at automático
create or replace function update_news_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger news_updated_at
  before update on public.news
  for each row execute function update_news_updated_at();

-- Permissão leitura pública
grant select on public.news to anon, authenticated;
grant all on public.news to service_role;
