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
