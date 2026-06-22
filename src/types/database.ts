export type Game = {
  id: string;
  code: string;
  created_by: string;
  status: string;
  created_at: string;
};

export type Player = {
  id: string;
  game_id: string;
  user_id: string;
  display_name: string;
  joined_at: string;
};