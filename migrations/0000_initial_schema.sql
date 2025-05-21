DROP TABLE IF EXISTS api_logs;
DROP TABLE IF EXISTS api_routes;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

-- 创建API路由表
CREATE TABLE IF NOT EXISTS api_routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    path TEXT NOT NULL,
    method TEXT NOT NULL,
    sql_query TEXT NOT NULL,
    params TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_public BOOLEAN DEFAULT FALSE,
    require_auth BOOLEAN DEFAULT TRUE,
    UNIQUE(path, method)
);

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    email TEXT UNIQUE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建产品表（用于示例）
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    category TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建API调用日志表
CREATE TABLE IF NOT EXISTS api_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    route_id INTEGER,
    user_id INTEGER,
    ip_address TEXT,
    request_data TEXT,
    response_status INTEGER,
    execution_time INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 初始化一个管理员用户 (密码: admin123)
INSERT INTO users (username, password_hash, email, is_admin) 
VALUES ('admin', '$2a$10$rEj8FZR5gXMIcH7kMg0H9OxuIXQ3.Ha0M1VYK9GrUB8fpQToZlLwy', 'admin@example.com', TRUE);

-- 添加一些测试用户
INSERT INTO users (username, password_hash, email, is_admin) 
VALUES 
    ('user1', '$2a$10$rEj8FZR5gXMIcH7kMg0H9OxuIXQ3.Ha0M1VYK9GrUB8fpQToZlLwy', 'user1@example.com', FALSE),
    ('user2', '$2a$10$rEj8FZR5gXMIcH7kMg0H9OxuIXQ3.Ha0M1VYK9GrUB8fpQToZlLwy', 'user2@example.com', FALSE);

-- 添加一些测试产品
INSERT INTO products (name, description, price, stock, category)
VALUES
    ('笔记本电脑', '高性能笔记本电脑', 5999.99, 50, '电子产品'),
    ('智能手机', '最新款智能手机', 3999.99, 100, '电子产品'),
    ('无线耳机', '降噪无线耳机', 899.99, 200, '配件'),
    ('鼠标', '游戏鼠标', 299.99, 150, '配件'),
    ('显示器', '27英寸4K显示器', 1999.99, 30, '电子产品');

-- ============ 创建示例API ============

-- 示例1: 获取所有用户（无参数查询）
INSERT INTO api_routes (name, path, method, sql_query, description, is_public) 
VALUES (
    '获取所有用户', 
    '/api/public/users', 
    'GET', 
    'SELECT id, username, email, created_at FROM users', 
    '获取所有用户信息的公开API', 
    TRUE
);

-- 示例2: 根据ID获取单个用户（带参数查询）
INSERT INTO api_routes (name, path, method, sql_query, description, params, is_public) 
VALUES (
    '获取单个用户', 
    '/api/public/user', 
    'GET', 
    'SELECT id, username, email, created_at FROM users WHERE id = :userId', 
    '根据ID获取单个用户',
    '{"userId":{"type":"number","required":true,"description":"用户ID"}}',
    TRUE
);

-- 示例3: 获取所有产品（无参数查询）
INSERT INTO api_routes (name, path, method, sql_query, description, is_public) 
VALUES (
    '获取所有产品', 
    '/api/public/products', 
    'GET', 
    'SELECT * FROM products ORDER BY created_at DESC', 
    '获取所有产品信息', 
    TRUE
);

-- 示例4: 按类别获取产品（带参数查询）
INSERT INTO api_routes (name, path, method, sql_query, description, params, is_public) 
VALUES (
    '按类别获取产品', 
    '/api/public/products/category', 
    'GET', 
    'SELECT * FROM products WHERE category = :category ORDER BY name', 
    '获取特定类别的所有产品',
    '{"category":{"type":"string","required":true,"description":"产品类别"}}',
    TRUE
);

-- 示例5: 搜索产品（带多参数查询）
INSERT INTO api_routes (name, path, method, sql_query, description, params, is_public) 
VALUES (
    '搜索产品', 
    '/api/public/products/search', 
    'GET', 
    'SELECT * FROM products WHERE name LIKE :query OR description LIKE :query', 
    '通过关键词搜索产品',
    '{"query":{"type":"string","required":true,"description":"搜索关键词，例如 %关键词%"}}',
    TRUE
);

-- 示例6: 添加新产品（创建操作）
INSERT INTO api_routes (name, path, method, sql_query, description, params, is_public) 
VALUES (
    '添加产品', 
    '/api/products', 
    'POST', 
    'INSERT INTO products (name, description, price, stock, category) VALUES (:name, :description, :price, :stock, :category) RETURNING id, name', 
    '添加新产品',
    '{"name":{"type":"string","required":true,"description":"产品名称"},"description":{"type":"string","required":false,"description":"产品描述"},"price":{"type":"number","required":true,"description":"产品价格"},"stock":{"type":"number","required":true,"description":"库存数量"},"category":{"type":"string","required":false,"description":"产品类别"}}',
    TRUE
);

-- 示例7: 更新产品（更新操作）
INSERT INTO api_routes (name, path, method, sql_query, description, params, is_public) 
VALUES (
    '更新产品', 
    '/api/products/update', 
    'PUT', 
    'UPDATE products SET name = :name, description = :description, price = :price, stock = :stock, category = :category, updated_at = CURRENT_TIMESTAMP WHERE id = :id RETURNING id, name', 
    '更新产品信息',
    '{"id":{"type":"number","required":true,"description":"产品ID"},"name":{"type":"string","required":true,"description":"产品名称"},"description":{"type":"string","required":false,"description":"产品描述"},"price":{"type":"number","required":true,"description":"产品价格"},"stock":{"type":"number","required":true,"description":"库存数量"},"category":{"type":"string","required":false,"description":"产品类别"}}',
    TRUE
);

-- 示例8: 删除产品（删除操作）
INSERT INTO api_routes (name, path, method, sql_query, description, params, is_public) 
VALUES (
    '删除产品', 
    '/api/products/delete', 
    'DELETE', 
    'DELETE FROM products WHERE id = :id', 
    '删除指定ID的产品',
    '{"id":{"type":"number","required":true,"description":"要删除的产品ID"}}',
    TRUE
);

-- 示例9: 简单统计（无参数聚合查询）
INSERT INTO api_routes (name, path, method, sql_query, description, is_public) 
VALUES (
    '产品统计', 
    '/api/public/stats/products', 
    'GET', 
    'SELECT category, COUNT(*) as product_count, AVG(price) as avg_price, SUM(stock) as total_stock FROM products GROUP BY category', 
    '获取各类别产品的统计信息', 
    TRUE
);

-- 示例10: 价格范围搜索（带多参数复杂查询）
INSERT INTO api_routes (name, path, method, sql_query, description, params, is_public) 
VALUES (
    '价格范围查询', 
    '/api/public/products/price-range', 
    'GET', 
    'SELECT * FROM products WHERE price BETWEEN :minPrice AND :maxPrice ORDER BY price', 
    '获取特定价格范围内的产品',
    '{"minPrice":{"type":"number","required":true,"description":"最低价格"},"maxPrice":{"type":"number","required":true,"description":"最高价格"}}',
    TRUE
); 