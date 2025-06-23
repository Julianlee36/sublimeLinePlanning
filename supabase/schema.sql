-- Create a teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update the players table to belong to a team
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position TEXT,
    jersey_number INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update the games table to belong to a team
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    opponent TEXT NOT NULL,
    game_date DATE,
    game_type TEXT,
    final_score_us INTEGER,
    final_score_them INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    thrower_id UUID REFERENCES players(id),
    receiver_id UUID REFERENCES players(id),
    result TEXT NOT NULL,
    point_number INTEGER,
    "timestamp" TIMESTAMPTZ DEFAULT NOW()
);

-- Create the lineups table
CREATE TABLE lineups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    point_number INTEGER,
    player_ids UUID[],
    is_offense BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW()
); 