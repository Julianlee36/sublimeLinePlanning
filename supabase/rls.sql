-- Enable Row Level Security (RLS) for all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineups ENABLE ROW LEVEL SECURITY;

-- POLICIES FOR: teams
CREATE POLICY "Users can manage their own teams" ON teams FOR ALL
USING (auth.uid() = user_id);

-- HELPER FUNCTIONS
-- Checks if a user owns a given team
CREATE OR REPLACE FUNCTION is_team_owner(team_id_to_check UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM teams WHERE id = team_id_to_check AND user_id = auth.uid()
  );
END;
$$;

-- Checks if a user owns the team associated with a given player
CREATE OR REPLACE FUNCTION is_player_team_owner(player_id_to_check UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM players
    JOIN teams ON players.team_id = teams.id
    WHERE players.id = player_id_to_check AND teams.user_id = auth.uid()
  );
END;
$$;

-- Checks if a user owns the team associated with a given game
CREATE OR REPLACE FUNCTION is_game_team_owner(game_id_to_check UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM games
    JOIN teams ON games.team_id = teams.id
    WHERE games.id = game_id_to_check AND teams.user_id = auth.uid()
  );
END;
$$;

-- POLICIES FOR: players
CREATE POLICY "Users can view players on their own teams" ON players
FOR SELECT USING (is_team_owner(team_id));
CREATE POLICY "Users can add players to their own teams" ON players
FOR INSERT WITH CHECK (is_team_owner(team_id));
CREATE POLICY "Users can update players on their own teams" ON players
FOR UPDATE USING (is_team_owner(team_id));
CREATE POLICY "Users can delete players from their own teams" ON players
FOR DELETE USING (is_team_owner(team_id));


-- POLICIES FOR: games
CREATE POLICY "Users can view games for their own teams" ON games
FOR SELECT USING (is_team_owner(team_id));
CREATE POLICY "Users can add games for their own teams" ON games
FOR INSERT WITH CHECK (is_team_owner(team_id));
CREATE POLICY "Users can update games for their own teams" ON games
FOR UPDATE USING (is_team_owner(team_id));
CREATE POLICY "Users can delete games from their own teams" ON games
FOR DELETE USING (is_team_owner(team_id));


-- POLICIES FOR: events
CREATE POLICY "Users can manage events for games on their own teams" ON events
FOR ALL USING (is_game_team_owner(game_id));

-- POLICIES FOR: lineups
CREATE POLICY "Users can manage lineups for games on their own teams" ON lineups
FOR ALL USING (is_game_team_owner(game_id)); 