CREATE OR REPLACE FUNCTION rls_for_table(table_name text)
RETURNS void AS $$
BEGIN
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
  EXECUTE format('CREATE POLICY "授权用户可以查看%I" ON %I FOR SELECT TO authenticated USING (true)', table_name, table_name);
  EXECUTE format('CREATE POLICY "授权用户可以创建%I" ON %I FOR INSERT TO authenticated WITH CHECK (true)', table_name, table_name);
  EXECUTE format('CREATE POLICY "授权用户可以更新%I" ON %I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', table_name, table_name);
  EXECUTE format('CREATE POLICY "授权用户可以删除%I" ON %I FOR DELETE TO authenticated USING (true)', table_name, table_name);
END;
$$ LANGUAGE plpgsql;