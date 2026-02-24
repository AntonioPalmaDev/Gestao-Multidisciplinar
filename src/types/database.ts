// Custom types for the application

export type AppRole = 'admin' | 'psicologo' | 'assistente_social' | 'pedagogo' | 'gestor';

export type CategoriaAtleta = 'sub11' | 'sub13' | 'sub15' | 'sub17' | 'sub20' | 'profissional';

export type TipoIntervencao = 
  | 'individual' 
  | 'grupo' 
  | 'observacao_treino' 
  | 'observacao_jogo' 
  | 'dinamica_grupo' 
  | 'teste_psicologico'
  | 'encaminhamento'
  | 'anamnese'
  | 'acompanhamento_escolar';

export interface Profile {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Atleta {
  id: string;
  nome: string;
  data_nascimento: string;
  categoria: CategoriaAtleta;
  posicao: string | null;
  numero_camisa: number | null;
  foto_url: string | null;
  ativo: boolean;
  data_entrada: string;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PeriodoTrimestral {
  id: string;
  ano: number;
  trimestre: number;
  data_inicio: string;
  data_fim: string;
  fechado: boolean;
  fechado_em: string | null;
  fechado_por: string | null;
}

export interface AtendimentoPsicologia {
  id: string;
  profissional_id: string;
  tipo_intervencao: TipoIntervencao;
  data_atendimento: string;
  hora_inicio: string | null;
  hora_fim: string | null;
  categoria: CategoriaAtleta | null;
  descricao: string | null;
  observacoes_confidenciais: string | null;
  dados_quantitativos: Record<string, unknown> | null;
  periodo_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AtendimentoAtleta {
  id: string;
  atendimento_id: string;
  atleta_id: string;
}

export interface AnexoAtendimento {
  id: string;
  atendimento_id: string;
  nome_arquivo: string;
  url_arquivo: string;
  tipo_arquivo: string | null;
  tamanho_bytes: number | null;
  uploaded_by: string;
  created_at: string;
}

export interface AnamneseSocial {
  id: string;
  atleta_id: string;
  profissional_id: string;
  composicao_familiar: string | null;
  situacao_moradia: string | null;
  renda_familiar: string | null;
  beneficios_sociais: string | null;
  situacao_escolar: string | null;
  observacoes: string | null;
  data_registro: string;
  created_at: string;
  updated_at: string;
}

export interface Contato {
  id: string;
  atleta_id: string | null;
  nome: string;
  parentesco: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  tipo: string;
  observacoes: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Encaminhamento {
  id: string;
  atleta_id: string;
  profissional_id: string;
  tipo: string;
  destino: string;
  motivo: string;
  data_encaminhamento: string;
  status: string;
  retorno: string | null;
  created_at: string;
  updated_at: string;
}

export interface Escola {
  id: string;
  nome: string;
  endereco: string | null;
  telefone: string | null;
  email: string | null;
  responsavel: string | null;
  ativo: boolean;
  created_at: string;
}

export interface MatriculaEscolar {
  id: string;
  atleta_id: string;
  escola_id: string;
  serie: string;
  turno: string | null;
  ano_letivo: number;
  ativo: boolean;
  data_matricula: string;
  created_at: string;
  updated_at: string;
}

export interface RegistroEscolar {
  id: string;
  atleta_id: string;
  profissional_id: string;
  periodo_id: string | null;
  frequencia_percentual: number | null;
  media_notas: number | null;
  queixas: string | null;
  ocorrencias: string | null;
  observacoes: string | null;
  data_registro: string;
  created_at: string;
  updated_at: string;
}

// Role display names
export const roleLabels: Record<AppRole, string> = {
  admin: 'Administrador',
  psicologo: 'Psicólogo',
  assistente_social: 'Assistente Social',
  pedagogo: 'Pedagogo',
  gestor: 'Gestor',
};

// Category display names
export const categoryLabels: Record<CategoriaAtleta, string> = {
  sub11: 'Sub-11',
  sub13: 'Sub-13',
  sub15: 'Sub-15',
  sub17: 'Sub-17',
  sub20: 'Sub-20',
  profissional: 'Profissional',
};

// Intervention type display names
export const interventionLabels: Record<TipoIntervencao, string> = {
  individual: 'Atendimento Individual',
  grupo: 'Atendimento em Grupo',
  observacao_treino: 'Observação de Treino',
  observacao_jogo: 'Observação de Jogo',
  dinamica_grupo: 'Dinâmica de Grupo',
  teste_psicologico: 'Teste Psicológico',
  encaminhamento: 'Encaminhamento',
  anamnese: 'Anamnese',
  acompanhamento_escolar: 'Acompanhamento Escolar',
};
