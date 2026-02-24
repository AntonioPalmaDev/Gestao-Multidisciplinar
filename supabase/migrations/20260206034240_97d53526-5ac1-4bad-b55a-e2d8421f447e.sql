-- Enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'psicologo', 'assistente_social', 'pedagogo', 'gestor');

-- Enum for athlete categories
CREATE TYPE public.categoria_atleta AS ENUM ('sub11', 'sub13', 'sub15', 'sub17', 'sub20', 'profissional');

-- Enum for intervention types
CREATE TYPE public.tipo_intervencao AS ENUM (
  'individual', 
  'grupo', 
  'observacao_treino', 
  'observacao_jogo', 
  'dinamica_grupo', 
  'teste_psicologico',
  'encaminhamento',
  'anamnese',
  'acompanhamento_escolar'
);

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Athletes table
CREATE TABLE public.atletas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  data_nascimento DATE NOT NULL,
  categoria categoria_atleta NOT NULL,
  posicao TEXT,
  numero_camisa INTEGER,
  foto_url TEXT,
  ativo BOOLEAN DEFAULT true,
  data_entrada DATE DEFAULT CURRENT_DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Quarterly periods table (for closing functionality)
CREATE TABLE public.periodos_trimestrais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano INTEGER NOT NULL,
  trimestre INTEGER NOT NULL CHECK (trimestre >= 1 AND trimestre <= 4),
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  fechado BOOLEAN DEFAULT false,
  fechado_em TIMESTAMPTZ,
  fechado_por UUID REFERENCES auth.users(id),
  UNIQUE (ano, trimestre)
);

-- Psychology sessions table
CREATE TABLE public.atendimentos_psicologia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID REFERENCES auth.users(id) NOT NULL,
  tipo_intervencao tipo_intervencao NOT NULL,
  data_atendimento DATE NOT NULL,
  hora_inicio TIME,
  hora_fim TIME,
  categoria categoria_atleta,
  descricao TEXT,
  observacoes_confidenciais TEXT,
  dados_quantitativos JSONB,
  periodo_id UUID REFERENCES public.periodos_trimestrais(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Junction table for group sessions (multiple athletes)
CREATE TABLE public.atendimento_atletas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atendimento_id UUID REFERENCES public.atendimentos_psicologia(id) ON DELETE CASCADE NOT NULL,
  atleta_id UUID REFERENCES public.atletas(id) ON DELETE CASCADE NOT NULL,
  UNIQUE (atendimento_id, atleta_id)
);

-- Attachments/files for sessions
CREATE TABLE public.anexos_atendimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atendimento_id UUID REFERENCES public.atendimentos_psicologia(id) ON DELETE CASCADE NOT NULL,
  nome_arquivo TEXT NOT NULL,
  url_arquivo TEXT NOT NULL,
  tipo_arquivo TEXT,
  tamanho_bytes INTEGER,
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Social anamnesis table
CREATE TABLE public.anamnese_social (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atleta_id UUID REFERENCES public.atletas(id) ON DELETE CASCADE NOT NULL,
  profissional_id UUID REFERENCES auth.users(id) NOT NULL,
  composicao_familiar TEXT,
  situacao_moradia TEXT,
  renda_familiar TEXT,
  beneficios_sociais TEXT,
  situacao_escolar TEXT,
  observacoes TEXT,
  data_registro DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Contacts database (family, external partners)
CREATE TABLE public.contatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atleta_id UUID REFERENCES public.atletas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  parentesco TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  tipo TEXT NOT NULL, -- 'familiar', 'parceiro_externo', 'escola', 'hospital'
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Referrals table
CREATE TABLE public.encaminhamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atleta_id UUID REFERENCES public.atletas(id) ON DELETE CASCADE NOT NULL,
  profissional_id UUID REFERENCES auth.users(id) NOT NULL,
  tipo TEXT NOT NULL, -- 'hospitalar', 'administrativo', 'escolar', 'outros'
  destino TEXT NOT NULL,
  motivo TEXT NOT NULL,
  data_encaminhamento DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'pendente', -- 'pendente', 'em_andamento', 'concluido', 'cancelado'
  retorno TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Schools table
CREATE TABLE public.escolas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  endereco TEXT,
  telefone TEXT,
  email TEXT,
  responsavel TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- School enrollment
CREATE TABLE public.matriculas_escolares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atleta_id UUID REFERENCES public.atletas(id) ON DELETE CASCADE NOT NULL,
  escola_id UUID REFERENCES public.escolas(id) NOT NULL,
  serie TEXT NOT NULL,
  turno TEXT, -- 'manha', 'tarde', 'noite'
  ano_letivo INTEGER NOT NULL,
  ativo BOOLEAN DEFAULT true,
  data_matricula DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- School attendance and grades
CREATE TABLE public.registro_escolar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atleta_id UUID REFERENCES public.atletas(id) ON DELETE CASCADE NOT NULL,
  profissional_id UUID REFERENCES auth.users(id) NOT NULL,
  periodo_id UUID REFERENCES public.periodos_trimestrais(id),
  frequencia_percentual NUMERIC(5,2),
  media_notas NUMERIC(4,2),
  queixas TEXT,
  ocorrencias TEXT,
  observacoes TEXT,
  data_registro DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atletas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.periodos_trimestrais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atendimentos_psicologia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atendimento_atletas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anexos_atendimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamnese_social ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encaminhamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matriculas_escolares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registro_escolar ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user has any professional role
CREATE OR REPLACE FUNCTION public.is_professional(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'psicologo', 'assistente_social', 'pedagogo', 'gestor')
  )
$$;

-- Function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS Policies

-- Profiles: Users can read all profiles, update their own
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- User roles: Only admins can manage, everyone can read their own
CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Athletes: All professionals can view, specific roles can modify
CREATE POLICY "Professionals can view athletes"
  ON public.atletas FOR SELECT
  TO authenticated
  USING (public.is_professional(auth.uid()));

CREATE POLICY "Professionals can manage athletes"
  ON public.atletas FOR ALL
  TO authenticated
  USING (public.is_professional(auth.uid()) AND NOT public.has_role(auth.uid(), 'gestor'));

-- Quarterly periods: All can view, admins manage
CREATE POLICY "Professionals can view periods"
  ON public.periodos_trimestrais FOR SELECT
  TO authenticated
  USING (public.is_professional(auth.uid()));

CREATE POLICY "Admins can manage periods"
  ON public.periodos_trimestrais FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Psychology sessions: Psychologists and admins
CREATE POLICY "Psychology staff can view sessions"
  ON public.atendimentos_psicologia FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'psicologo') OR
    public.has_role(auth.uid(), 'gestor')
  );

CREATE POLICY "Psychologists can manage their sessions"
  ON public.atendimentos_psicologia FOR INSERT
  TO authenticated
  WITH CHECK (
    profissional_id = auth.uid() AND
    (public.has_role(auth.uid(), 'psicologo') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Psychologists can update their sessions"
  ON public.atendimentos_psicologia FOR UPDATE
  TO authenticated
  USING (
    profissional_id = auth.uid() AND
    (public.has_role(auth.uid(), 'psicologo') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Psychologists can delete their sessions"
  ON public.atendimentos_psicologia FOR DELETE
  TO authenticated
  USING (
    profissional_id = auth.uid() AND
    (public.has_role(auth.uid(), 'psicologo') OR public.has_role(auth.uid(), 'admin'))
  );

-- Session athletes junction
CREATE POLICY "View session athletes"
  ON public.atendimento_atletas FOR SELECT
  TO authenticated
  USING (public.is_professional(auth.uid()));

CREATE POLICY "Manage session athletes"
  ON public.atendimento_atletas FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'psicologo') OR public.has_role(auth.uid(), 'admin'));

-- Attachments
CREATE POLICY "View attachments"
  ON public.anexos_atendimento FOR SELECT
  TO authenticated
  USING (public.is_professional(auth.uid()));

CREATE POLICY "Manage attachments"
  ON public.anexos_atendimento FOR ALL
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Social anamnesis: Social workers and admins
CREATE POLICY "Social workers can view anamnesis"
  ON public.anamnese_social FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'assistente_social') OR
    public.has_role(auth.uid(), 'gestor')
  );

CREATE POLICY "Social workers can manage anamnesis"
  ON public.anamnese_social FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'assistente_social') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- Contacts
CREATE POLICY "Professionals can view contacts"
  ON public.contatos FOR SELECT
  TO authenticated
  USING (public.is_professional(auth.uid()));

CREATE POLICY "Social workers can manage contacts"
  ON public.contatos FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'assistente_social') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- Referrals
CREATE POLICY "Professionals can view referrals"
  ON public.encaminhamentos FOR SELECT
  TO authenticated
  USING (public.is_professional(auth.uid()));

CREATE POLICY "Social workers can manage referrals"
  ON public.encaminhamentos FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'assistente_social') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- Schools
CREATE POLICY "Professionals can view schools"
  ON public.escolas FOR SELECT
  TO authenticated
  USING (public.is_professional(auth.uid()));

CREATE POLICY "Pedagogues can manage schools"
  ON public.escolas FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'pedagogo') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- School enrollments
CREATE POLICY "Professionals can view enrollments"
  ON public.matriculas_escolares FOR SELECT
  TO authenticated
  USING (public.is_professional(auth.uid()));

CREATE POLICY "Pedagogues can manage enrollments"
  ON public.matriculas_escolares FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'pedagogo') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- School records
CREATE POLICY "Pedagogues can view school records"
  ON public.registro_escolar FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'pedagogo') OR
    public.has_role(auth.uid(), 'gestor')
  );

CREATE POLICY "Pedagogues can manage school records"
  ON public.registro_escolar FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'pedagogo') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_atletas_updated_at
  BEFORE UPDATE ON public.atletas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_atendimentos_updated_at
  BEFORE UPDATE ON public.atendimentos_psicologia
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_anamnese_updated_at
  BEFORE UPDATE ON public.anamnese_social
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contatos_updated_at
  BEFORE UPDATE ON public.contatos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_encaminhamentos_updated_at
  BEFORE UPDATE ON public.encaminhamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_matriculas_updated_at
  BEFORE UPDATE ON public.matriculas_escolares
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_registro_escolar_updated_at
  BEFORE UPDATE ON public.registro_escolar
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();