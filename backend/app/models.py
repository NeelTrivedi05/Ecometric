import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, ForeignKey, Text, DateTime, JSON, Boolean
from sqlalchemy.orm import relationship
from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default="engineer")  # engineer, guide, reviewer
    created_at = Column(DateTime, default=datetime.utcnow)

    projects = relationship("Project", back_populates="owner")

class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    name = Column(String, nullable=False)
    product_category = Column(String, default="water_cooled_chiller")
    pcr_ref = Column(String, default="UL 10010-4 Part B v2.0 2018")
    status = Column(String, default="DRAFT")  # DRAFT, CALCULATED, REPORTED
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="projects")
    technical_data = relationship("TechnicalData", back_populates="project", uselist=False)
    results = relationship("Result", back_populates="project", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="project", cascade="all, delete-orphan")

class TechnicalData(Base):
    __tablename__ = "technical_data"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), unique=True)
    chilling_capacity_rt = Column(Float, default=500.0)
    chilling_capacity_kw = Column(Float, default=1758.4)
    refrigerant_type = Column(String, default="R134a")
    refrigerant_charge_kg = Column(Float, default=45.0)
    mass_delivered_kg = Column(Float, default=3470.0)
    conversion_factor_kg_per_ton = Column(Float, default=6.94)

    project = relationship("Project", back_populates="technical_data")

class Result(Base):
    __tablename__ = "results"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    module = Column(String, nullable=False)  # A1-A3, A4, A5, B1...B7, C1-C4, Module D
    impact_category = Column(String, default="GWP-total")
    methodology = Column(String, default="TRACI 2.1")
    unit = Column(String, default="kg CO2e")
    value = Column(Float, nullable=False)
    calculated_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="results")

class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    pdf_url = Column(String, nullable=False)
    version = Column(String, default="1.0")
    disclaimer_text_snapshot = Column(Text, nullable=True)
    generated_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="reports")


class LCIAIndicator(Base):
    __tablename__ = "lcia_indicators"

    id = Column(String(150), primary_key=True)
    methodology = Column(String(150), nullable=False, index=True)
    methodology_key = Column(String(100), nullable=False, index=True)
    category = Column(String(255), nullable=False, index=True)
    indicator = Column(String(255), nullable=False, index=True)
    unit = Column(String(100), nullable=False)
    canonical_key = Column(Text, nullable=False)
    is_no_lt = Column(Boolean, default=False)
    is_pcr_mandatory = Column(Boolean, default=False, index=True)
    acronyms = Column(JSON, default=list)
    synonyms = Column(JSON, default=list)
    search_tokens = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ProcessMetadata(Base):
    __tablename__ = "process_metadata"

    id = Column(String(150), primary_key=True)
    activity_uuid = Column(String(100), nullable=True)
    product_uuid = Column(String(100), nullable=True)
    activity_name = Column(String(255), nullable=False, index=True)
    reference_product = Column(String(255), nullable=False, index=True)
    geography = Column(String(20), default="GLO")
    unit = Column(String(50), default="kg")
    database_version = Column(String(20), default="3.12")
    system_model = Column(String(50), default="cut-off")
    search_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# =========================================================================
# Phase 1: Database Lineage & Entanglement Schema Models
# =========================================================================

class EcoinventDatabase(Base):
    __tablename__ = "ecoinvent_databases"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    version = Column(String(20), nullable=False, default="3.12")
    system_model = Column(String(50), nullable=False, default="cut-off")
    branch_name = Column(String(100), nullable=False, default="ecoinvent 3.12 default")
    file_reference = Column(Text, nullable=False)
    file_hash = Column(String(64), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    nodes = relationship("ProcessNode", back_populates="database")


class ProcessNode(Base):
    __tablename__ = "process_nodes"

    id = Column(String(150), primary_key=True)  # provider_id e.g. ecoinvent_steel_hot_rolled_glo
    database_id = Column(String(36), ForeignKey("ecoinvent_databases.id", ondelete="SET NULL"), nullable=True)
    activity_uuid = Column(String(100), nullable=True)
    product_uuid = Column(String(100), nullable=True)
    activity_name = Column(String(255), nullable=False, index=True)
    reference_product = Column(String(255), nullable=False, index=True)
    geography = Column(String(20), default="GLO")
    unit = Column(String(50), default="kg")
    system_boundaries = Column(String(100), default="cradle-to-gate")
    sector = Column(String(100), nullable=True, index=True)
    tier_level = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    database = relationship("EcoinventDatabase", back_populates="nodes")
    child_edges = relationship(
        "ProcessEntanglementEdge",
        foreign_keys="[ProcessEntanglementEdge.parent_process_id]",
        back_populates="parent_process",
        cascade="all, delete-orphan",
    )
    parent_edges = relationship(
        "ProcessEntanglementEdge",
        foreign_keys="[ProcessEntanglementEdge.child_process_id]",
        back_populates="child_process",
        cascade="all, delete-orphan",
    )


class ProcessEntanglementEdge(Base):
    __tablename__ = "process_entanglement_edges"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    parent_process_id = Column(String(150), ForeignKey("process_nodes.id", ondelete="CASCADE"), nullable=False, index=True)
    child_process_id = Column(String(150), ForeignKey("process_nodes.id", ondelete="CASCADE"), nullable=False, index=True)
    scaling_factor = Column(Float, default=1.0)
    tier_level = Column(Integer, nullable=False, default=1)
    relationship_type = Column(String(50), nullable=False, index=True)  # upstream_manufacturing, downstream_processing, energy_carrier, transport_link
    allocation_factor = Column(Float, default=1.0)
    loss_rate = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    parent_process = relationship("ProcessNode", foreign_keys=[parent_process_id], back_populates="child_edges")
    child_process = relationship("ProcessNode", foreign_keys=[child_process_id], back_populates="parent_edges")


class PcrGpiIndicatorRule(Base):
    __tablename__ = "pcr_gpi_indicator_rules"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    rule_name = Column(String(100), nullable=False)
    product_category = Column(String(100), default="water_cooled_chiller", index=True)
    methodology = Column(String(100), nullable=False, index=True)
    standard = Column(String(100), nullable=False)
    required_indicators = Column(JSON, default=list)
    optional_indicators = Column(JSON, default=list)
    cut_off_criteria = Column(String(255), default="1% mass / 1% energy cumulative 95%")
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
