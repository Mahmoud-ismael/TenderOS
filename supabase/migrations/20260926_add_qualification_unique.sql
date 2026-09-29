-- Ensure tender_id in qualification_results is unique for 1-to-1 qualification per tender
CREATE UNIQUE INDEX IF NOT EXISTS idx_qualification_results_tender_id_unique ON qualification_results(tender_id);
