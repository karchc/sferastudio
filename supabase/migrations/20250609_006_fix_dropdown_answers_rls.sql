-- Fix RLS policies for dropdown_answers to match answers table pattern
DROP POLICY IF EXISTS "Admins can manage dropdown answers" ON dropdown_answers;
DROP POLICY IF EXISTS "Users can view dropdown answers for questions" ON dropdown_answers;

-- Create proper RLS policies matching the answers table pattern
CREATE POLICY dropdown_answers_select_policy ON dropdown_answers FOR SELECT USING (true);
CREATE POLICY dropdown_answers_insert_admin_policy ON dropdown_answers FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY dropdown_answers_update_admin_policy ON dropdown_answers FOR UPDATE USING (is_admin());
CREATE POLICY dropdown_answers_delete_admin_policy ON dropdown_answers FOR DELETE USING (is_admin());