export interface Event {
    id: string;
    game_id: string;
    thrower_id: string;
    receiver_id: string | null;
    result: string;
    point_number: number | null;
    timestamp: string;
} 