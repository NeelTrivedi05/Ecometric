-- Migration 005: ecoinvent v3.12 Cut-off Cumulative LCIA reference data
-- Filled by backend/scripts/upload_lca_data.py; read only by the backend
-- (RLS on, no policies: the anon/authenticated API roles cannot read it).

CREATE TABLE IF NOT EXISTS public.impact_indicators (
    indicator_code TEXT PRIMARY KEY,
    excel_column_number INTEGER UNIQUE NOT NULL,
    method TEXT,
    category TEXT,
    indicator TEXT,
    unit TEXT
);

CREATE TABLE IF NOT EXISTS public.lca_activities (
    activity_uuid UUID NOT NULL,
    product_uuid UUID NOT NULL,
    activity_name TEXT,
    geography TEXT,
    reference_product_name TEXT,
    reference_product_unit TEXT,
    reference_product_amount NUMERIC,
    impact_values JSONB,
    PRIMARY KEY (activity_uuid, product_uuid)
);

-- Position of the activity in the workbook's LCIA sheet (0 = Excel row 5).
-- Provider ids saved in projects are "ecoinvent_row_<row_index>".
ALTER TABLE public.lca_activities ADD COLUMN IF NOT EXISTS row_index INTEGER;
CREATE UNIQUE INDEX IF NOT EXISTS uq_lca_activities_row_index ON public.lca_activities (row_index);

CREATE INDEX IF NOT EXISTS idx_lca_activity_name ON public.lca_activities (activity_name);
CREATE INDEX IF NOT EXISTS idx_lca_product_name ON public.lca_activities (reference_product_name);
CREATE INDEX IF NOT EXISTS idx_lca_product_uuid ON public.lca_activities (product_uuid);

ALTER TABLE public.impact_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lca_activities ENABLE ROW LEVEL SECURITY;
