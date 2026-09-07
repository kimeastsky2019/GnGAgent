-- 챗 문답 골든 승격: training_pairs.human_approval 에 'golden' 상태 추가
ALTER TABLE ng.training_pairs DROP CONSTRAINT IF EXISTS training_pairs_human_approval_check;
ALTER TABLE ng.training_pairs ADD CONSTRAINT training_pairs_human_approval_check
  CHECK (human_approval IN ('pending','approved','edited','rejected','golden'));
