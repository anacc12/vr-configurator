-- Reference data for games, environments, and pricing

-- Create reference tables for games
CREATE TABLE IF NOT EXISTS games_reference (
    id SERIAL PRIMARY KEY,
    game_name VARCHAR(100) UNIQUE NOT NULL,
    compatible_environments TEXT NOT NULL,
    pricing_package VARCHAR(10) NOT NULL,
    custom_3d_models INTEGER DEFAULT 0,
    unique_2d_slots INTEGER DEFAULT 0
);

-- Insert game data
INSERT INTO games_reference (game_name, compatible_environments, pricing_package, custom_3d_models, unique_2d_slots) VALUES
('Find the ball', 'All', 'Bronze', 0, 0),
('Memory', 'All', 'Bronze', 0, 8),
('Simon Says', 'All', 'Bronze', 0, 0),
-- ('Branded objects hunt', 'Ancient Temple,Autumn Forest', 'Gold', 3, 0),
-- ('Wheel of fortune', 'All', 'Gold', 0, 5),
('Product Inspection', 'All', 'Silver', 3, 0),
-- ('Build the product', 'All', 'Silver', 3, 0),
('Whack a mole', 'All', 'Bronze', 0, 0)
ON CONFLICT (game_name) DO NOTHING;

-- Create reference table for environments
CREATE TABLE IF NOT EXISTS environments_reference (
    id SERIAL PRIMARY KEY,
    environment_name VARCHAR(100) UNIQUE NOT NULL,
    slots_1x1 INTEGER DEFAULT 0,
    slots_9x16 INTEGER DEFAULT 0,
    slots_16x9 INTEGER DEFAULT 0,
    pricing_package VARCHAR(10) NOT NULL
);

-- Insert environment data
INSERT INTO environments_reference (environment_name, slots_1x1, slots_9x16, slots_16x9, pricing_package) VALUES
('Modern Office', 3, 1, 4, 'Bronze'),
('Luxury Retail Space', 2, 1, 2, 'Bronze'),
('Autumn Forest', 2, 1, 2, 'Bronze'),
('Ancient Temple', 2, 1, 2, 'Gold')
ON CONFLICT (environment_name) DO NOTHING;

-- Create pricing reference
CREATE TABLE IF NOT EXISTS pricing_reference (
    tier VARCHAR(10) PRIMARY KEY,
    base_price DECIMAL(10,2) NOT NULL
);

INSERT INTO pricing_reference (tier, base_price) VALUES
('Bronze', 3499.00),
('Silver', 5999.00),
('Gold', 9999.00)
ON CONFLICT (tier) DO NOTHING;

-- Create device reference
CREATE TABLE IF NOT EXISTS devices_reference (
    id SERIAL PRIMARY KEY,
    device_name VARCHAR(100) UNIQUE NOT NULL,
    price_per_day DECIMAL(10,2) NOT NULL,
    pricing_package VARCHAR(10)
);

INSERT INTO devices_reference (device_name, price_per_day, pricing_package) VALUES
('Meta Quest 3s standard device package', 30.00, 'Bronze'),
('Meta Quest 3 standard device package', 55.00, 'Silver')
ON CONFLICT (device_name) DO NOTHING;
