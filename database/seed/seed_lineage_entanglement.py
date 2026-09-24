import os
import sys
import hashlib
import uuid
from typing import Dict, Any, List

# Add backend and root to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, "..", ".."))
backend_dir = os.path.join(root_dir, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database import engine, SessionLocal, Base
from app.models import (
    EcoinventDatabase,
    ProcessNode,
    ProcessEntanglementEdge,
    PcrGpiIndicatorRule
)

def compute_file_hash(filepath: str) -> str:
    if os.path.exists(filepath):
        hasher = hashlib.sha256()
        with open(filepath, "rb") as f:
            while chunk := f.read(8192):
                hasher.update(chunk)
        return hasher.hexdigest()
    return "mock_sha256_" + uuid.uuid4().hex[:16]

def seed_lineage_and_entanglement():
    print("[INIT] Creating database tables if not existing...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # ---------------------------------------------------------------------
        # 1. Seed ecoinvent_databases (Cut-off, APOS, Consequential)
        # ---------------------------------------------------------------------
        print("[SEED] Seeding Ecoinvent Database Lineage Branches...")
        raw_excel = os.path.join(root_dir, "database", "ecoinvent_raw", "LCIA Implementation 3.12.xlsx")
        raw_hash = compute_file_hash(raw_excel)

        db_branches = [
            {
                "id": "ecoinvent-3.12-cutoff",
                "version": "3.12",
                "system_model": "cut-off",
                "branch_name": "ecoinvent 3.12 Allocation, cut-off by classification",
                "file_reference": "database/ecoinvent_raw/LCIA Implementation 3.12.xlsx",
                "file_hash": raw_hash,
                "is_active": True,
            },
            {
                "id": "ecoinvent-3.12-apos",
                "version": "3.12",
                "system_model": "apos",
                "branch_name": "ecoinvent 3.12 Allocation at the Point of Substitution",
                "file_reference": "database/ecoinvent_raw/LCIA Implementation 3.12.xlsx",
                "file_hash": raw_hash,
                "is_active": False,
            },
            {
                "id": "ecoinvent-3.12-consequential",
                "version": "3.12",
                "system_model": "consequential",
                "branch_name": "ecoinvent 3.12 Substitution, Consequential, Long-Term",
                "file_reference": "database/ecoinvent_raw/LCIA Implementation 3.12.xlsx",
                "file_hash": raw_hash,
                "is_active": False,
            }
        ]

        for branch in db_branches:
            existing = db.query(EcoinventDatabase).filter_by(id=branch["id"]).first()
            if not existing:
                db.add(EcoinventDatabase(**branch))
        db.commit()
        print(f"[OK] Seeded {len(db_branches)} ecoinvent database lineage branches.")

        # ---------------------------------------------------------------------
        # 2. Seed pcr_gpi_indicator_rules (PCR & GPI matrices)
        # ---------------------------------------------------------------------
        print("[SEED] Seeding PCR & GPI Indicator Selection Rules...")
        pcr_rules = [
            {
                "id": "rule-ul10010-4-traci",
                "rule_name": "UL 10010-4 Part B v2.0 (TRACI 2.1)",
                "product_category": "water_cooled_chiller",
                "methodology": "TRACI 2.1",
                "standard": "UL 10010-4 / ISO 14025",
                "required_indicators": [
                    "global warming potential",
                    "ozone depletion potential",
                    "acidification potential",
                    "eutrophication potential",
                    "smog formation potential"
                ],
                "optional_indicators": [
                    "ecotoxicity",
                    "human health particulate",
                    "fossil resource depletion"
                ],
                "cut_off_criteria": "1% mass / 1% energy cumulative 95%",
                "is_default": True
            },
            {
                "id": "rule-en15804-ef31",
                "rule_name": "EN 15804+A2 (EF v3.1 / EN 15804)",
                "product_category": "water_cooled_chiller",
                "methodology": "EF v3.1",
                "standard": "EN 15804+A2",
                "required_indicators": [
                    "climate change - total",
                    "climate change - fossil",
                    "climate change - biogenic",
                    "climate change - land use and land use change",
                    "ozone depletion",
                    "acidification",
                    "eutrophication, freshwater",
                    "eutrophication, marine",
                    "eutrophication, terrestrial",
                    "photochemical ozone formation",
                    "depletion of abiotic resources - minerals and metals",
                    "depletion of abiotic resources - fossil"
                ],
                "optional_indicators": [
                    "water use",
                    "particulate matter",
                    "ionising radiation, human health"
                ],
                "cut_off_criteria": "1% cumulative 99% mass and energy",
                "is_default": False
            },
            {
                "id": "rule-gpi-v4",
                "rule_name": "General Programme Instructions (GPI v4.0)",
                "product_category": "water_cooled_chiller",
                "methodology": "CML-IA baseline",
                "standard": "ISO 14025 / GPI v4.0",
                "required_indicators": [
                    "global warming (gwp100)",
                    "ozone layer depletion (odp)",
                    "photochemical oxidation",
                    "acidification",
                    "eutrophication"
                ],
                "optional_indicators": [
                    "abiotic depletion",
                    "abiotic depletion (fossil fuels)"
                ],
                "cut_off_criteria": "Cut-off 1% non-hazardous materials",
                "is_default": False
            }
        ]

        for rule in pcr_rules:
            existing = db.query(PcrGpiIndicatorRule).filter_by(id=rule["id"]).first()
            if not existing:
                db.add(PcrGpiIndicatorRule(**rule))
        db.commit()
        print(f"[OK] Seeded {len(pcr_rules)} PCR/GPI indicator selection rules.")

        # ---------------------------------------------------------------------
        # 3. Seed Process Nodes (Parent + 10 Chained Child Processes)
        # Supply Chain Scenario: Steel Manufacturing (Converter, unalloyed)
        # ---------------------------------------------------------------------
        print("[SEED] Seeding Process Nodes (1 Parent + 10 Child Process Chain)...")
        parent_id = "proc-steel-converter-parent"

        nodes = [
            # The Parent Core Process
            {
                "id": parent_id,
                "database_id": "ecoinvent-3.12-cutoff",
                "activity_uuid": "f8a12e34-5b67-4890-a123-456789abcdef",
                "product_uuid": "prod-steel-billet-01",
                "activity_name": "Steel manufacturing, converter, unalloyed",
                "reference_product": "steel, unalloyed",
                "geography": "GLO",
                "unit": "kg",
                "system_boundaries": "cradle-to-gate",
                "sector": "metals",
                "tier_level": 1,
            },
            # 1. Upstream Mining: Iron Ore
            {
                "id": "proc-iron-ore-beneficiation",
                "database_id": "ecoinvent-3.12-cutoff",
                "activity_uuid": "c1a11111-2222-3333-4444-555566667777",
                "product_uuid": "prod-iron-ore-01",
                "activity_name": "Iron ore beneficiation and extraction",
                "reference_product": "iron ore concentrate",
                "geography": "GLO",
                "unit": "kg",
                "system_boundaries": "cradle-to-gate",
                "sector": "metals",
                "tier_level": 2,
            },
            # 2. Upstream Pyrolysis: Coke
            {
                "id": "proc-coke-production",
                "database_id": "ecoinvent-3.12-cutoff",
                "activity_uuid": "c2a11111-2222-3333-4444-555566667777",
                "product_uuid": "prod-coke-01",
                "activity_name": "Coke production and coal pyrolysis",
                "reference_product": "coke",
                "geography": "GLO",
                "unit": "kg",
                "system_boundaries": "cradle-to-gate",
                "sector": "energy",
                "tier_level": 2,
            },
            # 3. Upstream Agglomeration: Sinter
            {
                "id": "proc-sinter-production",
                "database_id": "ecoinvent-3.12-cutoff",
                "activity_uuid": "c3a11111-2222-3333-4444-555566667777",
                "product_uuid": "prod-sinter-01",
                "activity_name": "Sinter iron production",
                "reference_product": "sinter, iron",
                "geography": "GLO",
                "unit": "kg",
                "system_boundaries": "cradle-to-gate",
                "sector": "metals",
                "tier_level": 2,
            },
            # 4. Upstream Smelting: Blast Furnace
            {
                "id": "proc-blast-furnace-pig-iron",
                "database_id": "ecoinvent-3.12-cutoff",
                "activity_uuid": "c4a11111-2222-3333-4444-555566667777",
                "product_uuid": "prod-pig-iron-01",
                "activity_name": "Blast furnace operation, hot metal/pig iron",
                "reference_product": "pig iron",
                "geography": "GLO",
                "unit": "kg",
                "system_boundaries": "cradle-to-gate",
                "sector": "metals",
                "tier_level": 2,
            },
            # 5. Upstream Refining: Basic Oxygen Furnace
            {
                "id": "proc-basic-oxygen-furnace",
                "database_id": "ecoinvent-3.12-cutoff",
                "activity_uuid": "c5a11111-2222-3333-4444-555566667777",
                "product_uuid": "prod-liquid-steel-01",
                "activity_name": "Basic oxygen furnace steel conversion",
                "reference_product": "liquid steel, unalloyed",
                "geography": "GLO",
                "unit": "kg",
                "system_boundaries": "cradle-to-gate",
                "sector": "metals",
                "tier_level": 2,
            },
            # 6. Upstream Solidification: Continuous Casting
            {
                "id": "proc-continuous-casting",
                "database_id": "ecoinvent-3.12-cutoff",
                "activity_uuid": "c6a11111-2222-3333-4444-555566667777",
                "product_uuid": "prod-steel-slab-01",
                "activity_name": "Continuous casting, slab and billet",
                "reference_product": "steel slab",
                "geography": "GLO",
                "unit": "kg",
                "system_boundaries": "cradle-to-gate",
                "sector": "metals",
                "tier_level": 2,
            },
            # 7. Downstream Forming: Hot Rolling
            {
                "id": "proc-hot-rolling-plate",
                "database_id": "ecoinvent-3.12-cutoff",
                "activity_uuid": "c7a11111-2222-3333-4444-555566667777",
                "product_uuid": "prod-rolled-sheet-01",
                "activity_name": "Hot rolling, steel plate and coil",
                "reference_product": "sheet rolling, steel",
                "geography": "GLO",
                "unit": "kg",
                "system_boundaries": "gate-to-gate",
                "sector": "metals",
                "tier_level": 2,
            },
            # 8. Downstream Machining: Cold Drawing & CNC
            {
                "id": "proc-machining-cold-drawing",
                "database_id": "ecoinvent-3.12-cutoff",
                "activity_uuid": "c8a11111-2222-3333-4444-555566667777",
                "product_uuid": "prod-machined-steel-01",
                "activity_name": "Cold drawing and precision CNC machining",
                "reference_product": "machining, steel, average",
                "geography": "GLO",
                "unit": "kg",
                "system_boundaries": "gate-to-gate",
                "sector": "machinery",
                "tier_level": 2,
            },
            # 9. Downstream Treatment: Surface Galvanizing / Coating
            {
                "id": "proc-surface-galvanizing",
                "database_id": "ecoinvent-3.12-cutoff",
                "activity_uuid": "c9a11111-2222-3333-4444-555566667777",
                "product_uuid": "prod-galv-steel-01",
                "activity_name": "Surface treatment, hot-dip galvanizing",
                "reference_product": "zinc coating, coils",
                "geography": "GLO",
                "unit": "m2",
                "system_boundaries": "gate-to-gate",
                "sector": "metals",
                "tier_level": 2,
            },
            # 10. Supply Chain Transport Link: Lorry Freight
            {
                "id": "proc-transport-freight-lorry",
                "database_id": "ecoinvent-3.12-cutoff",
                "activity_uuid": "c10a1111-2222-3333-4444-555566667777",
                "product_uuid": "prod-transport-tkm-01",
                "activity_name": "Transport, freight, lorry >32 metric ton, EURO5",
                "reference_product": "transport, freight, lorry >32 metric ton",
                "geography": "GLO",
                "unit": "metric ton*km",
                "system_boundaries": "well-to-wheel",
                "sector": "transport",
                "tier_level": 2,
            },
            # 11. Energy Carrier: Medium Voltage Grid Electricity
            {
                "id": "proc-electricity-grid-mv",
                "database_id": "ecoinvent-3.12-cutoff",
                "activity_uuid": "c11a1111-2222-3333-4444-555566667777",
                "product_uuid": "prod-electricity-kwh-01",
                "activity_name": "Electricity, medium voltage, country grid mix",
                "reference_product": "electricity, medium voltage",
                "geography": "GLO",
                "unit": "kWh",
                "system_boundaries": "cradle-to-gate",
                "sector": "energy",
                "tier_level": 2,
            }
        ]

        for node in nodes:
            existing = db.query(ProcessNode).filter_by(id=node["id"]).first()
            if not existing:
                db.add(ProcessNode(**node))
        db.commit()
        print(f"[OK] Seeded {len(nodes)} process inventory nodes.")

        # ---------------------------------------------------------------------
        # 4. Seed Process Entanglement Edges (Parent -> 10 Chained Sub-Processes)
        # ---------------------------------------------------------------------
        print("[SEED] Seeding Process Entanglement Edges (Chaining 1 Parent -> 10 Children)...")
        edges = [
            # 1. Iron ore (1.60 kg ore per 1 kg steel billet)
            {
                "id": "edge-steel-to-iron-ore",
                "parent_process_id": parent_id,
                "child_process_id": "proc-iron-ore-beneficiation",
                "scaling_factor": 1.60,
                "tier_level": 1,
                "relationship_type": "upstream_manufacturing",
                "allocation_factor": 1.0,
                "loss_rate": 0.05,
            },
            # 2. Coke (0.45 kg coke per 1 kg steel)
            {
                "id": "edge-steel-to-coke",
                "parent_process_id": parent_id,
                "child_process_id": "proc-coke-production",
                "scaling_factor": 0.45,
                "tier_level": 1,
                "relationship_type": "upstream_manufacturing",
                "allocation_factor": 0.90,
                "loss_rate": 0.02,
            },
            # 3. Sinter iron (1.25 kg sinter per 1 kg steel)
            {
                "id": "edge-steel-to-sinter",
                "parent_process_id": parent_id,
                "child_process_id": "proc-sinter-production",
                "scaling_factor": 1.25,
                "tier_level": 1,
                "relationship_type": "upstream_manufacturing",
                "allocation_factor": 1.0,
                "loss_rate": 0.03,
            },
            # 4. Blast furnace operation (1.05 kg hot metal per 1 kg steel)
            {
                "id": "edge-steel-to-blast-furnace",
                "parent_process_id": parent_id,
                "child_process_id": "proc-blast-furnace-pig-iron",
                "scaling_factor": 1.05,
                "tier_level": 1,
                "relationship_type": "upstream_manufacturing",
                "allocation_factor": 0.95,
                "loss_rate": 0.01,
            },
            # 5. Basic oxygen furnace (1.00 kg liquid steel)
            {
                "id": "edge-steel-to-bof",
                "parent_process_id": parent_id,
                "child_process_id": "proc-basic-oxygen-furnace",
                "scaling_factor": 1.00,
                "tier_level": 1,
                "relationship_type": "upstream_manufacturing",
                "allocation_factor": 1.0,
                "loss_rate": 0.01,
            },
            # 6. Continuous casting (0.98 kg slab/billet cast)
            {
                "id": "edge-steel-to-casting",
                "parent_process_id": parent_id,
                "child_process_id": "proc-continuous-casting",
                "scaling_factor": 0.98,
                "tier_level": 1,
                "relationship_type": "upstream_manufacturing",
                "allocation_factor": 1.0,
                "loss_rate": 0.02,
            },
            # 7. Hot rolling plate (1.02 kg input per rolled plate)
            {
                "id": "edge-steel-to-rolling",
                "parent_process_id": parent_id,
                "child_process_id": "proc-hot-rolling-plate",
                "scaling_factor": 1.02,
                "tier_level": 1,
                "relationship_type": "downstream_processing",
                "allocation_factor": 1.0,
                "loss_rate": 0.03,
            },
            # 8. Cold drawing & machining (0.95 kg machined component)
            {
                "id": "edge-steel-to-machining",
                "parent_process_id": parent_id,
                "child_process_id": "proc-machining-cold-drawing",
                "scaling_factor": 0.95,
                "tier_level": 1,
                "relationship_type": "downstream_processing",
                "allocation_factor": 0.98,
                "loss_rate": 0.05,
            },
            # 9. Surface treatment galvanizing (0.12 m2 coating surface per kg steel)
            {
                "id": "edge-steel-to-galvanizing",
                "parent_process_id": parent_id,
                "child_process_id": "proc-surface-galvanizing",
                "scaling_factor": 0.12,
                "tier_level": 1,
                "relationship_type": "downstream_processing",
                "allocation_factor": 1.0,
                "loss_rate": 0.01,
            },
            # 10. Transport freight (0.25 t*km per kg steel for regional supply)
            {
                "id": "edge-steel-to-transport",
                "parent_process_id": parent_id,
                "child_process_id": "proc-transport-freight-lorry",
                "scaling_factor": 0.25,
                "tier_level": 1,
                "relationship_type": "transport_link",
                "allocation_factor": 1.0,
                "loss_rate": 0.0,
            },
            # 11. Energy Carrier: Electricity grid (0.65 kWh per kg steel)
            {
                "id": "edge-steel-to-electricity",
                "parent_process_id": parent_id,
                "child_process_id": "proc-electricity-grid-mv",
                "scaling_factor": 0.65,
                "tier_level": 1,
                "relationship_type": "energy_carrier",
                "allocation_factor": 1.0,
                "loss_rate": 0.0,
            }
        ]

        for edge in edges:
            existing = db.query(ProcessEntanglementEdge).filter_by(id=edge["id"]).first()
            if not existing:
                db.add(ProcessEntanglementEdge(**edge))
        db.commit()
        print(f"[OK] Seeded {len(edges)} process entanglement edges.")

        print("\n[SUCCESS] Phase 1 Database Lineage & Entanglement Schema seeded successfully!")
        print(f"  - Ecoinvent Databases: {db.query(EcoinventDatabase).count()}")
        print(f"  - PCR / GPI Rules:    {db.query(PcrGpiIndicatorRule).count()}")
        print(f"  - Process Nodes:      {db.query(ProcessNode).count()}")
        print(f"  - Entanglement Edges: {db.query(ProcessEntanglementEdge).count()}")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to seed lineage & entanglement: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_lineage_and_entanglement()
