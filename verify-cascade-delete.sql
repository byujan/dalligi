-- Verify Cascade Delete Setup
-- Run this in your Supabase SQL Editor to check and fix the cascade delete

-- 1. Check if the foreign key constraint exists with CASCADE
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'planned_workouts'
    AND kcu.column_name = 'training_plan_id';

-- If the above query shows delete_rule = 'NO ACTION' or doesn't have CASCADE,
-- run the following to fix it:

-- 2. Drop the old constraint if it exists without CASCADE
ALTER TABLE planned_workouts
DROP CONSTRAINT IF EXISTS planned_workouts_training_plan_id_fkey;

-- 3. Recreate with CASCADE delete
ALTER TABLE planned_workouts
ADD CONSTRAINT planned_workouts_training_plan_id_fkey
FOREIGN KEY (training_plan_id)
REFERENCES training_plans(id)
ON DELETE CASCADE;

-- 4. Verify it worked - should show delete_rule = 'CASCADE'
SELECT
    tc.constraint_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'planned_workouts'
    AND tc.constraint_name LIKE '%training_plan_id%';

-- Done! Now when you delete a training plan, all its workouts should be automatically deleted.
