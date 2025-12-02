do $$ begin
  if not exists (select 1 from pg_type where typname = 'investimento_base_enum') then
    create type investimento_base_enum as enum ('BRUTO','SOBRA');
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  investimento_percentual numeric(5,2) not null default 0,
  investimento_base investimento_base_enum not null default 'SOBRA'
);

alter table public.profiles enable row level security;
create policy profiles_select_own on public.profiles for select using (user_id = auth.uid());
create policy profiles_insert_own on public.profiles for insert with check (user_id = auth.uid());
create policy profiles_update_own on public.profiles for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy profiles_delete_own on public.profiles for delete using (user_id = auth.uid());

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  tipo text not null,
  cor text
);
create index if not exists categories_user_id_idx on public.categories (user_id);

alter table public.categories enable row level security;
create policy categories_select_own on public.categories for select using (user_id = auth.uid());
create policy categories_insert_own on public.categories for insert with check (user_id = auth.uid());
create policy categories_update_own on public.categories for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy categories_delete_own on public.categories for delete using (user_id = auth.uid());

create table if not exists public.recurrence_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  descricao text not null,
  valor_base numeric(12,2) not null,
  dia_vencimento int not null check (dia_vencimento between 1 and 31),
  ativo boolean not null default true
);
create index if not exists recurrence_templates_user_id_idx on public.recurrence_templates (user_id);

alter table public.recurrence_templates enable row level security;
create policy recurrence_templates_select_own on public.recurrence_templates for select using (user_id = auth.uid());
create policy recurrence_templates_insert_own on public.recurrence_templates for insert with check (user_id = auth.uid());
create policy recurrence_templates_update_own on public.recurrence_templates for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy recurrence_templates_delete_own on public.recurrence_templates for delete using (user_id = auth.uid());

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  descricao text not null,
  valor numeric(12,2) not null,
  tipo text not null,
  data date not null,
  categoria_id uuid references public.categories (id) on delete set null,
  pago boolean not null default false,
  is_recurrent_copy boolean not null default false
);
create index if not exists transactions_user_id_idx on public.transactions (user_id);
create index if not exists transactions_categoria_id_idx on public.transactions (categoria_id);

alter table public.transactions enable row level security;
create policy transactions_select_own on public.transactions for select using (user_id = auth.uid());
create policy transactions_insert_own on public.transactions for insert with check (
  user_id = auth.uid() and (
    categoria_id is null or exists (
      select 1 from public.categories c where c.id = categoria_id and c.user_id = auth.uid()
    )
  )
);
create policy transactions_update_own on public.transactions for update using (user_id = auth.uid()) with check (
  user_id = auth.uid() and (
    categoria_id is null or exists (
      select 1 from public.categories c where c.id = categoria_id and c.user_id = auth.uid()
    )
  )
);
create policy transactions_delete_own on public.transactions for delete using (user_id = auth.uid());


-- Function to create or update an investment goal and link categories in a transaction
create or replace function create_investment_goal(
  p_title text,
  p_target_amount numeric,
  p_deadline date,
  p_project_id uuid,
  p_category_ids uuid[],
  p_goal_id uuid default null
) returns uuid as $$
declare
  v_goal_id uuid;
  v_user_id uuid;
begin
  -- Get the current user ID
  v_user_id := auth.uid();

  -- If p_goal_id is provided, update existing goal
  if p_goal_id is not null then
    update goals
    set
      title = p_title,
      target_amount = p_target_amount,
      deadline = p_deadline,
      project_id = p_project_id,
      updated_at = now()
    where id = p_goal_id and user_id = v_user_id
    returning id into v_goal_id;

    -- If no goal found (e.g. wrong user), raise exception
    if v_goal_id is null then
      raise exception 'Goal not found or permission denied';
    end if;

    -- Clear existing category links for this goal
    update categories
    set goal_id = null
    where goal_id = v_goal_id;

  else
    -- Insert new goal
    insert into goals (user_id, title, target_amount, deadline, project_id)
    values (v_user_id, p_title, p_target_amount, p_deadline, p_project_id)
    returning id into v_goal_id;
  end if;

  -- Link new categories
  if array_length(p_category_ids, 1) > 0 then
    update categories
    set goal_id = v_goal_id
    where id = any(p_category_ids) and user_id = v_user_id;
  end if;

  return v_goal_id;
end;
$$ language plpgsql security definer;
