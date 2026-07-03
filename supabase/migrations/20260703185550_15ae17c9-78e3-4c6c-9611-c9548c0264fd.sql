
CREATE TABLE public.locks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  label TEXT NOT NULL,
  encrypted_pin TEXT NOT NULL,
  unlock_time TIMESTAMPTZ NOT NULL,
  panic_unlock_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.locks TO authenticated;
GRANT ALL ON public.locks TO service_role;

ALTER TABLE public.locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own locks"
  ON public.locks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own locks"
  ON public.locks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own locks"
  ON public.locks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own locks"
  ON public.locks FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX locks_user_id_idx ON public.locks(user_id);
