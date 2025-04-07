export type Comment = {
  id?: string;
  text: string;
  createdAt: string;
  author: string;
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
  allowed_users: string[];
  is_public: boolean;
}

export interface Board {
  id: string;
  title: string;
  created_at: string;
}

export interface User {
  uid: string;
  email: string;
  isAdmin: boolean;
}