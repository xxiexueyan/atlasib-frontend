-- =============================================================================
-- 数据库补丁: 增加向导推荐快照与匿名会话识别
-- =============================================================================
SET search_path TO public;

BEGIN;

-- 1. 扩充 user_profiles 表字段
ALTER TABLE user_profiles 
    ADD COLUMN IF NOT EXISTS reasoning_points JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS recommended_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS client_device_id VARCHAR(64) NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_device ON user_profiles(client_device_id);

-- 2. 增强 user_selected_programs 表字段
ALTER TABLE user_selected_programs 
    ADD COLUMN IF NOT EXISTS note VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

-- 3. 校验唯一约束确保幂等防重
-- 确保同一个 profile_id 下同一个 program_id 只能添加一次
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_user_program'
    ) THEN
        ALTER TABLE user_selected_programs 
            ADD CONSTRAINT uq_user_program UNIQUE (user_profile_id, program_id);
    END IF;
END $$;

COMMIT;
