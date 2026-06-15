
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  turma TEXT NOT NULL,
  mentor_responsavel TEXT NOT NULL,
  data_entrada DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;
GRANT ALL ON public.clientes TO service_role;

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own clientes" ON public.clientes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own clientes" ON public.clientes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own clientes" ON public.clientes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own clientes" ON public.clientes FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_clientes_updated_at
BEFORE UPDATE ON public.clientes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
