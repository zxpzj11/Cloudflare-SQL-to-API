-- 创建表结构管理表
CREATE TABLE IF NOT EXISTS db_tables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    schema TEXT NOT NULL, -- 存储表结构JSON
    sql_create TEXT NOT NULL, -- 存储创建表的SQL语句
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建表字段管理表
CREATE TABLE IF NOT EXISTS db_fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    length INTEGER,
    precision INTEGER,
    scale INTEGER,
    nullable BOOLEAN DEFAULT TRUE,
    default_value TEXT,
    primary_key BOOLEAN DEFAULT FALSE,
    unique_field BOOLEAN DEFAULT FALSE,
    auto_increment BOOLEAN DEFAULT FALSE,
    description TEXT,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES db_tables(id) ON DELETE CASCADE,
    UNIQUE(table_id, name)
);

-- 在API路由表中添加source_table_id字段，表示该API是自动生成的CRUD API
ALTER TABLE api_routes ADD COLUMN source_table_id INTEGER;
ALTER TABLE api_routes ADD COLUMN crud_operation TEXT; 