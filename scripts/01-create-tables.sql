-- VR Configurator Database Schema
-- This script creates all necessary tables for the configurator

-- Main orders table with UUID tracking
CREATE TABLE IF NOT EXISTS orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    current_step INTEGER DEFAULT 1,
    pricing_tier VARCHAR(10) DEFAULT 'Bronze',
    total_price DECIMAL(10,2) DEFAULT 3499.00
);

-- User details from Step 1
CREATE TABLE IF NOT EXISTS order_user (
    order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    company VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    PRIMARY KEY (order_id)
);

-- Games selected in Step 2
CREATE TABLE IF NOT EXISTS order_games (
    id SERIAL PRIMARY KEY,
    order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
    game_name VARCHAR(100) NOT NULL,
    pricing_package VARCHAR(10) NOT NULL,
    compatible_environments TEXT NOT NULL,
    custom_3d_models INTEGER DEFAULT 0,
    unique_2d_slots INTEGER DEFAULT 0
);

-- Environments selected in Step 3
CREATE TABLE IF NOT EXISTS order_environments (
    id SERIAL PRIMARY KEY,
    order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
    game_name VARCHAR(100) NOT NULL,
    environment_name VARCHAR(100) NOT NULL,
    slots_1x1 INTEGER DEFAULT 0,
    slots_9x16 INTEGER DEFAULT 0,
    slots_16x9 INTEGER DEFAULT 0,
    pricing_package VARCHAR(10) NOT NULL
);

-- Devices selected in Step 4
CREATE TABLE IF NOT EXISTS order_devices (
    id SERIAL PRIMARY KEY,
    order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
    device_package VARCHAR(100) NOT NULL,
    price_per_day DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL,
    event_days INTEGER NOT NULL
);

-- Custom 3D models from Step 5
CREATE TABLE IF NOT EXISTS order_custom_3d (
    order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
    additional_3d_models INTEGER DEFAULT 0,
    PRIMARY KEY (order_id)
);

-- Additional options from Step 6
CREATE TABLE IF NOT EXISTS order_options (
    id SERIAL PRIMARY KEY,
    order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
    option_name VARCHAR(100) NOT NULL,
    tier VARCHAR(10) NOT NULL
);

-- Final order summary
CREATE TABLE IF NOT EXISTS order_summary (
    order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
    final_tier VARCHAR(10) NOT NULL,
    final_total DECIMAL(10,2) NOT NULL,
    payload JSONB,
    PRIMARY KEY (order_id)
);

-- Feature tier tracking for automatic upgrades
CREATE TABLE IF NOT EXISTS feature_tiers (
    order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
    silver_features JSONB DEFAULT '[]'::jsonb,
    gold_features JSONB DEFAULT '[]'::jsonb,
    PRIMARY KEY (order_id)
);
