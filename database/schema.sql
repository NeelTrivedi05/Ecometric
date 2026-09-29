-- Canonical EcoMetric Database DDL Schema (SQLAlchemy / Alembic Single Source of Truth)
CREATE EXTENSION IF NOT EXISTS pg_trgm;


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

-- LCIA Full Indicator Catalog (All ~633+ Indicators across 46 Methodologies)
CREATE TABLE IF NOT EXISTS lcia_indicators (
    id VARCHAR(150) PRIMARY KEY,
    methodology VARCHAR(150) NOT NULL,
    methodology_key VARCHAR(100) NOT NULL,
    category VARCHAR(255) NOT NULL,
    indicator VARCHAR(255) NOT NULL,
    unit VARCHAR(100) NOT NULL,
    canonical_key TEXT NOT NULL,
    is_no_lt BOOLEAN DEFAULT FALSE,
    is_pcr_mandatory BOOLEAN DEFAULT FALSE,
    acronyms JSONB DEFAULT '[]'::jsonb,
    synonyms JSONB DEFAULT '[]'::jsonb,
    search_tokens TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fast Trigram (pg_trgm) & B-Tree Indexes for Sub-20ms Fuzzy Search
CREATE INDEX IF NOT EXISTS idx_lcia_indicators_method_trgm ON lcia_indicators USING gin (methodology gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_lcia_indicators_category_trgm ON lcia_indicators USING gin (category gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_lcia_indicators_name_trgm ON lcia_indicators USING gin (indicator gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_lcia_indicators_tokens_trgm ON lcia_indicators USING gin (search_tokens gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_lcia_indicators_method_key ON lcia_indicators (methodology_key);
CREATE INDEX IF NOT EXISTS idx_lcia_indicators_pcr_mandatory ON lcia_indicators (is_pcr_mandatory);

-- Process / Activity Inventory Metadata Catalog
CREATE TABLE IF NOT EXISTS process_metadata (
    id VARCHAR(150) PRIMARY KEY,
    activity_uuid VARCHAR(100),
    product_uuid VARCHAR(100),
    activity_name VARCHAR(255) NOT NULL,
    reference_product VARCHAR(255) NOT NULL,
    geography VARCHAR(20) DEFAULT 'GLO',
    unit VARCHAR(50) DEFAULT 'kg',
    database_version VARCHAR(20) DEFAULT '3.12',
    system_model VARCHAR(50) DEFAULT 'cut-off',
    search_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_process_activity_trgm ON process_metadata USING gin (activity_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_process_refprod_trgm ON process_metadata USING gin (reference_product gin_trgm_ops);

-- =========================================================================
-- Phase 1: Database Lineage & Entanglement Schema
-- =========================================================================

-- 1. ecoinvent_databases: Tracks raw database branches, system models, versions & hashes
CREATE TABLE IF NOT EXISTS ecoinvent_databases (
    id VARCHAR(36) PRIMARY KEY,
    version VARCHAR(20) NOT NULL, -- e.g. '3.12'
    system_model VARCHAR(50) NOT NULL, -- 'cut-off', 'apos', 'consequential'
    branch_name VARCHAR(100) NOT NULL, -- e.g. 'ecoinvent 3.12 default'
    file_reference TEXT NOT NULL,
    file_hash VARCHAR(64),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. process_nodes: Process inventory nodes across multi-tier supply chains
CREATE TABLE IF NOT EXISTS process_nodes (
    id VARCHAR(150) PRIMARY KEY, -- provider_id or node UUID
    database_id VARCHAR(36) REFERENCES ecoinvent_databases(id) ON DELETE SET NULL,
    activity_uuid VARCHAR(100),
    product_uuid VARCHAR(100),
    activity_name VARCHAR(255) NOT NULL,
    reference_product VARCHAR(255) NOT NULL,
    geography VARCHAR(20) DEFAULT 'GLO',
    unit VARCHAR(50) DEFAULT 'kg',
    system_boundaries VARCHAR(100) DEFAULT 'cradle-to-gate',
    sector VARCHAR(100), -- 'metals', 'chemicals', 'energy', 'transport', 'machinery'
    tier_level INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_process_nodes_activity_trgm ON process_nodes USING gin (activity_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_process_nodes_refprod_trgm ON process_nodes USING gin (reference_product gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_process_nodes_sector ON process_nodes (sector);

-- 3. process_entanglement_edges: Graph edges chaining 1 process to 10+ sub-processes
CREATE TABLE IF NOT EXISTS process_entanglement_edges (
    id VARCHAR(36) PRIMARY KEY,
    parent_process_id VARCHAR(150) NOT NULL REFERENCES process_nodes(id) ON DELETE CASCADE,
    child_process_id VARCHAR(150) NOT NULL REFERENCES process_nodes(id) ON DELETE CASCADE,
    scaling_factor DOUBLE PRECISION DEFAULT 1.0,
    tier_level INT NOT NULL DEFAULT 1, -- 1 for immediate child, 2 for nested sub-process
    relationship_type VARCHAR(50) NOT NULL, -- 'upstream_manufacturing', 'downstream_processing', 'energy_carrier', 'transport_link'
    allocation_factor DOUBLE PRECISION DEFAULT 1.0,
    loss_rate DOUBLE PRECISION DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_edges_parent ON process_entanglement_edges (parent_process_id);
CREATE INDEX IF NOT EXISTS idx_edges_child ON process_entanglement_edges (child_process_id);
CREATE INDEX IF NOT EXISTS idx_edges_rel_type ON process_entanglement_edges (relationship_type);

-- 4. pcr_gpi_indicator_rules: PCR & GPI compliance matrices and indicator requirements
CREATE TABLE IF NOT EXISTS pcr_gpi_indicator_rules (
    id VARCHAR(36) PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL, -- 'UL 10010-4 Part B v2.0', 'GPI v4.0', 'EN 15804+A2'
    product_category VARCHAR(100) NOT NULL DEFAULT 'water_cooled_chiller',
    methodology VARCHAR(100) NOT NULL, -- 'TRACI 2.1', 'EF v3.1', 'EN 15804+A2'
    standard VARCHAR(100) NOT NULL, -- 'ISO 14025', 'EN 15804+A2', 'UL 10010-4'
    required_indicators JSONB NOT NULL DEFAULT '[]'::jsonb,
    optional_indicators JSONB NOT NULL DEFAULT '[]'::jsonb,
    cut_off_criteria VARCHAR(255) DEFAULT '1% mass / 1% energy cumulative 95%',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pcr_gpi_cat_method ON pcr_gpi_indicator_rules (product_category, methodology);
