-- Canonical EcoMetric Database DDL Schema (SQLAlchemy / Alembic Single Source of Truth)

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'engineer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    product_category VARCHAR(100) DEFAULT 'water_cooled_chiller',
    pcr_ref VARCHAR(255) DEFAULT 'UL 10010-4 Part B v2.0 2018',
    status VARCHAR(50) DEFAULT 'DRAFT',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS technical_data (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    chilling_capacity_rt FLOAT DEFAULT 500.0,
    chilling_capacity_kw FLOAT DEFAULT 1758.4,
    refrigerant_type VARCHAR(50) DEFAULT 'R134a',
    refrigerant_charge_kg FLOAT DEFAULT 45.0,
    mass_delivered_kg FLOAT DEFAULT 3470.0,
    conversion_factor_kg_per_ton FLOAT DEFAULT 6.94
);

CREATE TABLE IF NOT EXISTS results (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    module VARCHAR(50) NOT NULL,
    impact_category VARCHAR(100) DEFAULT 'GWP-total',
    methodology VARCHAR(100) DEFAULT 'TRACI 2.1',
    unit VARCHAR(50) DEFAULT 'kg CO2e',
    value FLOAT NOT NULL,
    calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    pdf_url VARCHAR(500) NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    disclaimer_text_snapshot TEXT,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
