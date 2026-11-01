-- Product quota policy: Free workspaces may create one EPD per month;
-- Studio (the Pro billing plan) may create ten.
UPDATE public.plans SET epd_quota = 1 WHERE code = 'free';
UPDATE public.plans
SET display_name = 'Studio', epd_quota = 10
WHERE code = 'pro';
