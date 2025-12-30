export type UserRole = 'admin' | 'normal';

export interface User {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  created_at?: string;
}

export interface Receita {
  id: string;
  user_id: string;
  descricao: string;
  valor: number;
  categoria: string;
  data: string;
  pago: boolean;
}

export interface Despesa {
  id: string;
  user_id: string;
  descricao: string;
  valor: number;
  categoria: string;
  data: string;
  pago: boolean;
}

export interface DashboardSummary {
  totalReceitas: number;
  totalDespesas: number;
  balanco: number;
  recentTransactions: (Receita | Despesa)[];
}
