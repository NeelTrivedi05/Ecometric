-- Reference data remains backend-only. The service role is used by the backend;
-- no anon/authenticated policies are intentionally added.
ALTER TABLE public.lca_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_indicators ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_lca_activities_activity_name_lower
    ON public.lca_activities (lower(activity_name));
CREATE INDEX IF NOT EXISTS idx_lca_activities_reference_product_lower
    ON public.lca_activities (lower(reference_product_name));
CREATE INDEX IF NOT EXISTS idx_lca_activities_geography
    ON public.lca_activities (geography);
CREATE INDEX IF NOT EXISTS idx_lca_activities_reference_unit
    ON public.lca_activities (reference_product_unit);
CREATE INDEX IF NOT EXISTS idx_lca_activities_row_index
    ON public.lca_activities (row_index);
