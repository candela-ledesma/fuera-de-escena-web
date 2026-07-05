-- Otorga los permisos base que Supabase aplica automáticamente a las tablas
-- creadas desde su propio dashboard, pero que hay que agregar a mano cuando
-- las tablas se crean por script SQL directo. RLS sigue siendo la que decide
-- fila por fila; esto solo habilita el acceso a nivel de rol.

grant usage on schema public to anon, authenticated;

grant select on
  public.profiles,
  public.categories,
  public.reviews,
  public.review_images,
  public.tags,
  public.review_tags,
  public.comments,
  public.reactions
to anon, authenticated;

grant insert, update, delete on
  public.profiles,
  public.categories,
  public.reviews,
  public.review_images,
  public.tags,
  public.review_tags,
  public.comments,
  public.reactions
to authenticated;

grant insert on public.comments, public.reactions to anon;
