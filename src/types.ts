// Em types.ts
export type Comment = {
  id?: string;
  text: string;
  createdAt: string;
  author: string; // Você pode substituir por um ID de usuário se tiver autenticação
};

export type Card = {
  id: string;
  title: string;
  description: string;
  order: number;
  list_id: string;
  created_at: string;
  tags?: {
    label: string;
    color: string;
  }[];
  comments?: Comment[];
};
export interface List {
  id: string;
  title: string;
  order: number;
  board_id: string;
  created_at: string;
}

export interface Board {
  id: string;
  title: string;
  created_at: string;
}