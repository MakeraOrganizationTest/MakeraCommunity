-- 此函数用于将 auth.users 表中的用户信息同步到 public.users 表中
create or replace function public.sync_user()
returns json as $$
declare
  _user record;         -- 存储认证用户信息
  _user_data jsonb;     -- 存储用户元数据
  _profile record;      -- 存储同步后的用户资料
  _identity_data jsonb; -- 存储身份数据
  _is_new_user boolean; -- 是否为新用户
  _username text;       -- 临时存储用户名
  _random_suffix text;  -- 随机后缀
  _user_role_id bigint; -- 普通用户角色ID
begin
  -- 获取当前认证用户信息（使用 auth.uid() 获取当前登录用户的ID）
  select * into _user from auth.users where id = auth.uid();
  
  -- 如果未找到用户，返回错误信息
  if not found then
    return json_build_object('success', false, 'message', 'User not authenticated');
  end if;
  
  -- 提取用户元数据
  _user_data := _user.raw_user_meta_data;
  
  -- 从身份表中获取额外数据(针对OAuth认证方式)
  -- 获取最新的身份记录，因为用户可能有多个身份
  select coalesce(identity_data, '{}'::jsonb) into _identity_data 
  from auth.identities 
  where user_id = auth.uid() 
  order by created_at desc 
  limit 1;
  
  -- 检查用户是否已存在于自定义users表中
  select exists(select 1 from public.users where id = auth.uid()) into _is_new_user;
  _is_new_user := not _is_new_user;
  
  -- 如果是新用户，需要处理用户名和确保其唯一性
  if _is_new_user then
    -- 获取基础用户名
    _username := coalesce(
      _user_data->>'user_name',
      _identity_data->>'preferred_username',
      _identity_data->>'username',
      split_part(_user.email, '@', 1) -- 默认使用邮箱前缀作为用户名
    );
    
    -- 检查用户名是否已存在，如存在则添加随机后缀
    while exists (select 1 from public.users where user_name = _username) loop
      -- 生成6位随机字符作为后缀
      _random_suffix := '_' || substr(md5(random()::text), 1, 6);
      _username := _username || _random_suffix;
    end loop;
    
    -- 首次同步 - 插入新用户记录
    insert into public.users (
      id, 
      email, 
      full_name,
      user_name,
      avatar_url,
      status,
      created_at,
      updated_at
    ) values (
      _user.id,
      _user.email,
      -- 优先使用用户元数据中的全名，然后是身份数据中的全名或名称
      coalesce(
        _user_data->>'full_name',
        _identity_data->>'full_name',
        _identity_data->>'name'
      ),
      _username,
      -- 头像URL的获取顺序：用户元数据 > 身份数据中的avatar_url > 身份数据中的picture
      coalesce(
        _user_data->>'avatar_url',
        _identity_data->>'avatar_url',
        _identity_data->>'picture'
      ),
      -- 根据用户确认状态设置初始状态，未确认的用户设为pending，已确认的设为active
      CASE 
        WHEN _user.confirmed_at IS NULL THEN 'pending'::"UserStatusType"
        ELSE 'active'::"UserStatusType"
      END,
      _user.created_at,
      _user.updated_at
    )
    returning *
    into _profile;
    
    -- 获取普通用户角色ID
    SELECT id INTO _user_role_id FROM roles WHERE name = 'user' AND is_system = true;
    
    -- 如果找到了角色，则为新用户添加默认角色
    IF FOUND THEN
      INSERT INTO user_roles (user_id, role_id)
      VALUES (_user.id, _user_role_id);
    END IF;
  else
    -- 用户已存在 - 只更新email和其他可能变更的基本信息，但不覆盖用户名和用户自定义信息
    update public.users
    set 
      email = _user.email,
      -- 使用coalesce确保只有在新值不为空且用户现有值为空时才更新全名和头像
      full_name = coalesce(
        nullif(users.full_name, ''),
        coalesce(
          _user_data->>'full_name',
          _identity_data->>'full_name',
          _identity_data->>'name'
        )
      ),
      avatar_url = coalesce(
        nullif(users.avatar_url, ''),
        coalesce(
          _user_data->>'avatar_url',
          _identity_data->>'avatar_url',
          _identity_data->>'picture'
        )
      ),
      -- 如果用户从未确认变为已确认，则更新状态为active（仅当当前状态为pending时）
      status = CASE 
        WHEN users.status = 'pending' AND _user.confirmed_at IS NOT NULL THEN 'active'::"UserStatusType"
        ELSE users.status
      END,
      -- 更新最后登录时间
      last_login_at = now(),
      updated_at = now()
    where id = auth.uid()
    returning *
    into _profile;
  end if;
  
  -- 构建并返回结果JSON对象
  return json_build_object(
    'success', true,
    'user', row_to_json(_profile),  -- 将用户资料转换为JSON格式
    'is_new_user', _is_new_user        -- 返回是否为新用户
  );
exception
  when others then
    -- 返回错误信息
    return json_build_object(
      'success', false,
      'message', SQLERRM  -- 返回SQL错误信息
    );
end;
$$ language plpgsql security definer;
-- 确保 RPC 函数有正确的执行权限
GRANT EXECUTE ON FUNCTION public.sync_user() TO authenticated;
