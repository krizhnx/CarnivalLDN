-- Create RPC function to increment sold_count for ticket tiers
CREATE OR REPLACE FUNCTION increment_sold_count(tier_id text, quantity integer)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE ticket_tiers 
  SET sold_count = sold_count + quantity 
  WHERE id = tier_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_sold_count(text, integer) TO anon;
GRANT EXECUTE ON FUNCTION increment_sold_count(text, integer) TO authenticated;

-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date text NOT NULL,
  time text NOT NULL,
  venue text NOT NULL,
  price text NOT NULL,
  image text,
  description text,
  capacity text,
  rating text DEFAULT '4.5'::text,
  tags ARRAY,
  gradient text,
  booking_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_archived boolean NOT NULL DEFAULT false,
  CONSTRAINT events_pkey PRIMARY KEY (id)
);

CREATE TABLE public.order_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid,
  ticket_tier_id text,
  quantity integer,
  unit_price integer,
  total_price integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT order_tickets_pkey PRIMARY KEY (id),
  CONSTRAINT order_tickets_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);

CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid,
  user_id text,
  stripe_payment_intent_id text UNIQUE,
  status text CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'refunded'::text])),
  total_amount integer,
  currency text DEFAULT 'gbp'::text,
  customer_email text,
  customer_name text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  customer_phone text,
  customer_date_of_birth text,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_event_id_fkey FOREIGN KEY (order_id) REFERENCES public.events(id)
);

CREATE TABLE public.ticket_tiers (
  id text NOT NULL,
  event_id uuid,
  name text NOT NULL,
  price integer NOT NULL,
  original_price integer,
  capacity integer NOT NULL,
  sold_count integer DEFAULT 0,
  available_from timestamp with time zone,
  available_until timestamp with time zone,
  description text,
  benefits ARRAY,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ticket_tiers_pkey PRIMARY KEY (id),
  CONSTRAINT ticket_tiers_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id)
);

CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  role text DEFAULT 'user'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- NEW TABLE: Track ticket scans for entry/exit
CREATE TABLE public.ticket_scans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  ticket_tier_id text NOT NULL,
  customer_email text NOT NULL,
  event_id uuid NOT NULL,
  scan_type text NOT NULL CHECK (scan_type = ANY (ARRAY['entry'::text, 'exit'::text])),
  scanned_at timestamp with time zone DEFAULT now(),
  scanned_by text, -- admin user who scanned
  location text, -- optional: specific entry point
  notes text, -- optional: any notes about the scan
  CONSTRAINT ticket_scans_pkey PRIMARY KEY (id),
  CONSTRAINT ticket_scans_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT ticket_scans_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id)
);

-- Index for faster lookups
CREATE INDEX idx_ticket_scans_order_tier ON public.ticket_scans(order_id, ticket_tier_id);
CREATE INDEX idx_ticket_scans_event_date ON public.ticket_scans(event_id, scanned_at);
CREATE INDEX idx_ticket_scans_customer ON public.ticket_scans(customer_email);

-- Function to check if ticket is valid for entry
CREATE OR REPLACE FUNCTION check_ticket_validity(
  p_order_id uuid,
  p_ticket_tier_id text,
  p_event_id uuid
) RETURNS TABLE(
  is_valid boolean,
  message text,
  order_status text,
  event_date text,
  customer_name text,
  customer_email text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.status = 'completed' AND e.date >= CURRENT_DATE::text AS is_valid,
    CASE 
      WHEN o.status != 'completed' THEN 'Payment not completed'
      WHEN e.date < CURRENT_DATE::text THEN 'Event has passed'
      ELSE 'Ticket is valid'
    END AS message,
    o.status AS order_status,
    e.date AS event_date,
    o.customer_name,
    o.customer_email
  FROM public.orders o
  JOIN public.events e ON o.event_id = e.id
  WHERE o.id = p_order_id 
    AND o.event_id = p_event_id;
END;
$$ LANGUAGE plpgsql;
