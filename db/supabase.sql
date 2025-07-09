-- 设置数据库默认时区为UTC
ALTER DATABASE postgres SET timezone TO 'UTC';
-- 确保 public schema 上有正确的权限
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO service_role;


-- 启用行级安全 - users 表
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "允许匿名用户查看用户数据" ON users FOR SELECT TO anon USING (true);
CREATE POLICY "认证用户可查看用户数据" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "认证用户可更新自己的数据" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "认证用户可创建自己的数据" ON users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);


-- 启用行级安全 - permissions 表
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "授权用户可以查看权限" ON permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "授权用户可以创建新权限" ON permissions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "授权用户可以更新权限" ON permissions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "授权用户可以删除权限" ON permissions FOR DELETE TO authenticated USING (true);

-- 启用行级安全 - roles 表
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "授权用户可以查看角色" ON roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "授权用户可以创建角色" ON roles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "授权用户可以更新角色" ON roles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "授权用户可以删除角色" ON roles FOR DELETE TO authenticated USING (true);

-- 启用行级安全 - role_permissions 表
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "授权用户可以查看角色权限关联" ON role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "授权用户可以创建角色权限关联" ON role_permissions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "授权用户可以更新角色权限关联" ON role_permissions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "授权用户可以删除角色权限关联" ON role_permissions FOR DELETE TO authenticated USING (true);

-- 启用行级安全 - user_roles 表
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "授权用户可以查看用户角色关联" ON user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "授权用户可以创建用户角色关联" ON user_roles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "授权用户可以更新用户角色关联" ON user_roles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "授权用户可以删除用户角色关联" ON user_roles FOR DELETE TO authenticated USING (true);

-- 启用行级安全 - model_categories 表
ALTER TABLE model_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "授权用户可以查看模型分类" ON model_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "授权用户可以创建模型分类" ON model_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "授权用户可以更新模型分类" ON model_categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "授权用户可以删除模型分类" ON model_categories FOR DELETE TO authenticated USING (true);
