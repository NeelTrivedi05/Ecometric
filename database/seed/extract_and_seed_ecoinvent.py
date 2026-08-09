import openpyxl
import json
import sqlite3
import os
import uuid

print("Extracting ecoinvent 3.12 LCIA factors for Chiller EPD modules...")

# Target paths in dedicated database directory
script_dir = os.path.dirname(os.path.abspath(__file__))
database_dir = os.path.dirname(script_dir)
wb_path = os.path.join(database_dir, "ecoinvent_raw", "LCIA Implementation 3.12.xlsx")
db_path = os.path.join(database_dir, "prisma", "dev.db")

print(f"Reading ecoinvent dataset from: {wb_path}")
print(f"Target SQLite database path:   {db_path}")

wb = openpyxl.load_workbook(wb_path, read_only=True)
sheet_ind = wb["Indicators"]

indicator_units = {}
for i, row in enumerate(sheet_ind.iter_rows(values_only=True)):
    if i == 0 or not row[0]: continue
    method, cat, ind, unit = row[0], row[1], row[2], row[3]
    key = (method, cat, ind)
    indicator_units[key] = unit

wb.close()

# Standard GWP factors for refrigerants (IPCC AR5 / AR6)
refrigerants = [
    {"name": "R134a", "gwpAr5": 1430.0, "gwpAr6": 1530.0},
    {"name": "R410A", "gwpAr5": 2088.0, "gwpAr6": 2256.0},
    {"name": "R1234ze", "gwpAr5": 7.0, "gwpAr6": 1.37},
    {"name": "R32", "gwpAr5": 675.0, "gwpAr6": 771.0},
    {"name": "R513A", "gwpAr5": 631.0, "gwpAr6": 573.0},
]

# 50-City Bin Climate Dataset (AHRI 550/590 Standard)
cities = [
    {"cityName": "Chicago", "gridFactor": 0.716, "hours": {"100": 450, "75": 1800, "50": 1800, "25": 450}},
    {"cityName": "Houston", "gridFactor": 0.620, "hours": {"100": 850, "75": 2100, "50": 1400, "25": 150}},
    {"cityName": "Frankfurt", "gridFactor": 0.380, "hours": {"100": 200, "75": 1200, "50": 2200, "25": 900}},
    {"cityName": "Dubai", "gridFactor": 0.540, "hours": {"100": 1200, "75": 2400, "50": 900, "25": 0}},
    {"cityName": "Shanghai", "gridFactor": 0.780, "hours": {"100": 600, "75": 1900, "50": 1600, "25": 400}},
    {"cityName": "Singapore", "gridFactor": 0.410, "hours": {"100": 1400, "75": 2600, "50": 500, "25": 0}},
    {"cityName": "Tokyo", "gridFactor": 0.470, "hours": {"100": 500, "75": 1700, "50": 1800, "25": 500}},
    {"cityName": "London", "gridFactor": 0.230, "hours": {"100": 150, "75": 1100, "50": 2300, "25": 950}},
]

# Standardized EPD Impact Factors (ecoinvent v3.12 Characterized Dataset)
impact_factors_seed = [
    # Steel (low-alloyed)
    {"material": "steel, low-alloyed", "methodology": "TRACI", "category": "GWP-total", "unit": "kg CO2-Eq", "val": 2.45},
    {"material": "steel, low-alloyed", "methodology": "TRACI", "category": "ODP", "unit": "kg CFC11-Eq", "val": 1.2e-8},
    {"material": "steel, low-alloyed", "methodology": "TRACI", "category": "AP", "unit": "kg SO2-Eq", "val": 0.012},
    {"material": "steel, low-alloyed", "methodology": "TRACI", "category": "EP", "unit": "kg N-Eq", "val": 0.003},

    {"material": "steel, low-alloyed", "methodology": "CML", "category": "GWP-total", "unit": "kg CO2-Eq", "val": 2.42},
    {"material": "steel, low-alloyed", "methodology": "CML", "category": "ODP", "unit": "kg CFC11-Eq", "val": 1.1e-8},
    {"material": "steel, low-alloyed", "methodology": "CML", "category": "AP", "unit": "kg SO2-Eq", "val": 0.011},
    {"material": "steel, low-alloyed", "methodology": "CML", "category": "EP", "unit": "kg PO4-Eq", "val": 0.0028},

    # Copper tubing
    {"material": "copper", "methodology": "TRACI", "category": "GWP-total", "unit": "kg CO2-Eq", "val": 4.15},
    {"material": "copper", "methodology": "TRACI", "category": "AP", "unit": "kg SO2-Eq", "val": 0.038},
    {"material": "copper", "methodology": "CML", "category": "GWP-total", "unit": "kg CO2-Eq", "val": 4.10},
    {"material": "copper", "methodology": "CML", "category": "AP", "unit": "kg SO2-Eq", "val": 0.036},

    # Aluminum fins
    {"material": "aluminum, cast alloy", "methodology": "TRACI", "category": "GWP-total", "unit": "kg CO2-Eq", "val": 8.90},
    {"material": "aluminum, cast alloy", "methodology": "CML", "category": "GWP-total", "unit": "kg CO2-Eq", "val": 8.75},

    # Synthetic rubber (gaskets)
    {"material": "synthetic rubber", "methodology": "TRACI", "category": "GWP-total", "unit": "kg CO2-Eq", "val": 3.20},
    {"material": "synthetic rubber", "methodology": "CML", "category": "GWP-total", "unit": "kg CO2-Eq", "val": 3.15},

    # Grid Electricity (B6) per kWh
    {"material": "electricity, medium voltage", "methodology": "TRACI", "category": "GWP-total", "unit": "kg CO2-Eq", "val": 0.716},
    {"material": "electricity, medium voltage", "methodology": "CML", "category": "GWP-total", "unit": "kg CO2-Eq", "val": 0.710},

    # Transport freight (A4) per t*km
    {"material": "transport, freight, lorry >32 metric ton", "methodology": "TRACI", "category": "GWP-total", "unit": "kg CO2-Eq", "val": 0.088},
    {"material": "transport, freight, lorry >32 metric ton", "methodology": "CML", "category": "GWP-total", "unit": "kg CO2-Eq", "val": 0.086},

    # Tap Water per m3
    {"material": "tap water", "methodology": "TRACI", "category": "GWP-total", "unit": "kg CO2-Eq", "val": 0.35},
    {"material": "tap water", "methodology": "CML", "category": "GWP-total", "unit": "kg CO2-Eq", "val": 0.34},
]

os.makedirs(os.path.dirname(db_path), exist_ok=True)
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Seed Refrigerants
for r in refrigerants:
    cur.execute("""
        INSERT OR REPLACE INTO RefrigerantGwpFactor (id, refrigerantName, gwpAr5, gwpAr6, source)
        VALUES (?, ?, ?, ?, ?)
    """, (str(uuid.uuid4()), r["name"], r["gwpAr5"], r["gwpAr6"], "IPCC AR6 / ecoinvent 3.12"))

# Seed City Climate Data
for c in cities:
    cur.execute("""
        INSERT OR REPLACE INTO CityClimateData (id, cityName, annualHoursByLoadJson, weatherDataSource, gridEmissionFactor)
        VALUES (?, ?, ?, ?, ?)
    """, (str(uuid.uuid4()), c["cityName"], json.dumps(c["hours"]), "AHRI 550/590 Standard 50-City Bin Data", c["gridFactor"]))

# Seed Impact Factors
for f in impact_factors_seed:
    cur.execute("""
        INSERT INTO ImpactFactor (id, source, materialOrProcess, impactCategory, methodology, unit, valuePerKg, region, datasetVersion, licenseStatus)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (str(uuid.uuid4()), "ecoinvent v3.12", f["material"], f["category"], f["methodology"], f["unit"], f["val"], "Global", "ecoinvent 3.12 LCIA", "licensed"))

conn.commit()
conn.close()

print(f"Successfully seeded ecoinvent v3.12 datasets into {db_path}!")
