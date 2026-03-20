-- Generations table: stores AI-generated landing page outputs
CREATE TABLE IF NOT EXISTS public.generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  input_data jsonb NOT NULL,
  output_copy jsonb,
  output_html text,
  template_id text DEFAULT 'default',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own generations"
  ON public.generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all generations"
  ON public.generations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS generations_user_id_idx
  ON public.generations (user_id);

CREATE INDEX IF NOT EXISTS generations_created_at_idx
  ON public.generations (created_at DESC);
