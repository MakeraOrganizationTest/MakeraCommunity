/**
* 3D模型社区基础数据初始化脚本
* 执行顺序: 先执行 database.sql 创建数据库结构，再执行本脚本初始化基础数据
*/

-- 启用事务以确保所有数据操作成功或全部回滚
BEGIN;

/**
* 系统用户初始化
* 注意: 使用一致的UUID，这样可以与Supabase Auth用户表关联
*/

-- 系统管理员
INSERT INTO users (id, full_name, user_name, email, bio, avatar_url, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid, 
  '系统管理员', 
  'admin', 
  'admin@example.com',
  '系统管理员账号',
  'https://api.dicebear.com/7.x/identicon/svg?seed=admin',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 社区版主
INSERT INTO users (id, full_name, user_name, email, bio, avatar_url, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid, 
  '社区版主', 
  'moderator', 
  'moderator@example.com',
  '社区内容审核员',
  'https://api.dicebear.com/7.x/identicon/svg?seed=moderator',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 为管理员和版主分配角色
INSERT INTO user_roles (user_id, role, created_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001'::uuid, 'admin', NOW()),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'moderator', NOW())
ON CONFLICT (user_id, role) DO NOTHING;

/**
* 初始化模型分类
*/

-- 清空现有分类（可选，根据需要启用）
-- DELETE FROM model_categories;

-- 重新设置序列（可选，根据需要启用）
-- ALTER SEQUENCE model_categories_id_seq RESTART WITH 1;

-- 主分类
INSERT INTO model_categories (name, description, thumbnail_url, created_at, updated_at)
VALUES 
  ('角色模型', '人物、动物及各类角色的3D模型', 'https://images.unsplash.com/photo-1575537302964-96cd47c06b1b', NOW(), NOW()),
  ('场景模型', '室内、室外、自然场景等环境模型', 'https://images.unsplash.com/photo-1594044493951-78f4ff24e3e0', NOW(), NOW()),
  ('建筑模型', '现代建筑、古代建筑、幻想建筑等', 'https://images.unsplash.com/photo-1486718448742-163732cd1544', NOW(), NOW()),
  ('机械模型', '机器人、车辆、飞行器等机械模型', 'https://images.unsplash.com/photo-1555680202-c86f0e12f086', NOW(), NOW()),
  ('艺术模型', '艺术品、雕塑、装饰品等模型', 'https://images.unsplash.com/photo-1549289524-06cf8837ace5', NOW(), NOW()),
  ('科幻模型', '科幻场景、装备、生物等模型', 'https://images.unsplash.com/photo-1581822261290-991b38693d1b', NOW(), NOW()),
  ('家具模型', '各类家具、家电、室内装饰模型', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7', NOW(), NOW()),
  ('游戏素材', '适用于游戏开发的各类3D模型', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f', NOW(), NOW()),
  ('其他', '不属于以上分类的其他3D模型', 'https://images.unsplash.com/photo-1535378917042-10a22c95931a', NOW(), NOW());

-- 子分类 - 角色模型
INSERT INTO model_categories (name, description, parent_id, thumbnail_url, created_at, updated_at)
VALUES 
  ('人类角色', '各类真实风格的人类角色模型', (SELECT id FROM model_categories WHERE name = '角色模型' LIMIT 1), 'https://images.unsplash.com/photo-1561948955-570b270e7c36', NOW(), NOW()),
  ('动物模型', '各种动物的3D模型，包括宠物、野生动物等', (SELECT id FROM model_categories WHERE name = '角色模型' LIMIT 1), 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca', NOW(), NOW()),
  ('卡通角色', '卡通风格的角色模型', (SELECT id FROM model_categories WHERE name = '角色模型' LIMIT 1), 'https://images.unsplash.com/photo-1559969143-b2defc6419fd', NOW(), NOW()),
  ('幻想生物', '龙、独角兽等幻想生物模型', (SELECT id FROM model_categories WHERE name = '角色模型' LIMIT 1), 'https://images.unsplash.com/photo-1577083552431-6e5fd01988ec', NOW(), NOW());

-- 子分类 - 场景模型
INSERT INTO model_categories (name, description, parent_id, thumbnail_url, created_at, updated_at)
VALUES 
  ('自然场景', '山川、河流、森林等自然环境模型', (SELECT id FROM model_categories WHERE name = '场景模型' LIMIT 1), 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e', NOW(), NOW()),
  ('城市场景', '城市街道、广场等城市环境模型', (SELECT id FROM model_categories WHERE name = '场景模型' LIMIT 1), 'https://images.unsplash.com/photo-1519501025264-65ba15a82390', NOW(), NOW()),
  ('室内场景', '各类室内环境和布置的模型', (SELECT id FROM model_categories WHERE name = '场景模型' LIMIT 1), 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7', NOW(), NOW());

/**
* 示例模型数据
* 注意：实际项目中，这些示例数据可能需要根据实际上传的模型文件来调整
*/

-- 创建示例模型
INSERT INTO models (
  title, 
  description, 
  user_id, 
  category_id,
  thumbnail_url,
  model_url,
  file_format,
  file_size,
  polygon_count,
  is_free,
  price,
  is_approved,
  approval_date,
  approved_by,
  view_count,
  download_count,
  like_count,
  is_featured,
  created_at,
  updated_at
)
VALUES 
  (
    '低多边形城市场景',
    '一个适合游戏开发的低多边形城市场景模型，包含建筑、道路和基础设施。',
    '00000000-0000-0000-0000-000000000001'::uuid,
    (SELECT id FROM model_categories WHERE name = '城市场景' LIMIT 1),
    'https://images.unsplash.com/photo-1519501025264-65ba15a82390',
    'https://example.com/models/lowpoly_city.glb',
    'glb',
    15728640, -- 15MB
    12500,
    true,
    0,
    true,
    NOW(),
    '00000000-0000-0000-0000-000000000001'::uuid,
    128,
    45,
    23,
    true,
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days'
  ),
  (
    '写实人物角色模型',
    '高精度写实风格人物模型，适用于影视制作或高端游戏。包含完整的PBR材质和骨骼绑定。',
    '00000000-0000-0000-0000-000000000002'::uuid,
    (SELECT id FROM model_categories WHERE name = '人类角色' LIMIT 1),
    'https://images.unsplash.com/photo-1561948955-570b270e7c36',
    'https://example.com/models/realistic_character.fbx',
    'fbx',
    52428800, -- 50MB
    85000,
    false,
    29.99,
    true,
    NOW(),
    '00000000-0000-0000-0000-000000000001'::uuid,
    256,
    78,
    112,
    true,
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '15 days'
  ),
  (
    '科幻机器人',
    '一个未来风格的机器人模型，带有多种动画和姿势。',
    '00000000-0000-0000-0000-000000000002'::uuid,
    (SELECT id FROM model_categories WHERE name = '机械模型' LIMIT 1),
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e',
    'https://example.com/models/scifi_robot.blend',
    'blend',
    31457280, -- 30MB
    45000,
    true,
    0,
    true,
    NOW(),
    '00000000-0000-0000-0000-000000000001'::uuid,
    198,
    67,
    89,
    true,
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days'
  );

-- 为示例模型添加标签
INSERT INTO model_tags (model_id, tag_name, created_at)
VALUES
  ((SELECT id FROM models WHERE title = '低多边形城市场景' LIMIT 1), '低多边形', NOW()),
  ((SELECT id FROM models WHERE title = '低多边形城市场景' LIMIT 1), '城市', NOW()),
  ((SELECT id FROM models WHERE title = '低多边形城市场景' LIMIT 1), '游戏素材', NOW()),
  ((SELECT id FROM models WHERE title = '写实人物角色模型' LIMIT 1), '写实', NOW()),
  ((SELECT id FROM models WHERE title = '写实人物角色模型' LIMIT 1), '人物', NOW()),
  ((SELECT id FROM models WHERE title = '写实人物角色模型' LIMIT 1), 'PBR', NOW()),
  ((SELECT id FROM models WHERE title = '科幻机器人' LIMIT 1), '机器人', NOW()),
  ((SELECT id FROM models WHERE title = '科幻机器人' LIMIT 1), '科幻', NOW()),
  ((SELECT id FROM models WHERE title = '科幻机器人' LIMIT 1), '动画', NOW());

-- 提交事务
COMMIT; 