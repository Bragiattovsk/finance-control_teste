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
