-- Add missing event_id field to guestlist_scans table
ALTER TABLE public.guestlist_scans 
ADD COLUMN event_id uuid NOT NULL;

-- Add foreign key constraint
ALTER TABLE public.guestlist_scans 
ADD CONSTRAINT guestlist_scans_event_id_fkey 
FOREIGN KEY (event_id) REFERENCES public.events(id);

-- Update existing records (if any) to set event_id based on guestlist
UPDATE public.guestlist_scans 
SET event_id = (
  SELECT event_id 
  FROM public.guestlists 
  WHERE guestlists.id = guestlist_scans.guestlist_id
);

-- Add scan_type field that the frontend expects
ALTER TABLE public.guestlist_scans 
ADD COLUMN scan_type text DEFAULT 'entry' CHECK (scan_type = ANY (ARRAY['entry'::text, 'exit'::text]));

-- Add gender field to orders table
ALTER TABLE public.orders 
ADD COLUMN customer_gender text CHECK (customer_gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text, 'prefer_not_to_say'::text]));

-- Add category field to guestlists table for folder organization
ALTER TABLE public.guestlists 
ADD COLUMN IF NOT EXISTS category text DEFAULT 'other' CHECK (category = ANY (ARRAY['free'::text, 'GL'::text, 'tables'::text, 'other'::text]));

-- Update existing guestlists to have 'other' as default category
UPDATE public.guestlists 
SET category = 'other' 
WHERE category IS NULL;