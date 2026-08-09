import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, ForeignKey, Text, DateTime, JSON
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
