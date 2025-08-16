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
