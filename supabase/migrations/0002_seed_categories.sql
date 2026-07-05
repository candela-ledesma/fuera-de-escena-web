-- Seed de categorías iniciales (editable después desde el panel de la autora)
insert into categories (name, slug) values
  ('Teatro', 'teatro'),
  ('Comedia', 'comedia'),
  ('Drama', 'drama'),
  ('Musical', 'musical'),
  ('Infantil', 'infantil'),
  ('Danza / Performance', 'danza-performance')
on conflict (name) do nothing;
