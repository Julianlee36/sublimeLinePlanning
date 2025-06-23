export interface Game {
    id: string;
    opponent: string;
    game_date: string | null;
    game_type: string | null;
    final_score_us: number | null;
    final_score_them: number | null;
    created_at: string;
} 