from sqlalchemy import Column, BigInteger, Text, Numeric, TIMESTAMP, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from datetime import datetime

Base = declarative_base()

class SimRun(Base):
    __tablename__ = "sim_runs"
    __table_args__ = {"schema": "ng"}
    
    id = Column(BigInteger, primary_key=True)
    site_id = Column(BigInteger, ForeignKey("ng.sites.id"), nullable=False)
    period_start = Column(TIMESTAMP(timezone=True), nullable=False)
    period_end = Column(TIMESTAMP(timezone=True), nullable=False)
    step_minutes = Column(BigInteger, nullable=False)
    status = Column(Text, nullable=False, default="queued")
    params_json = Column(JSON, nullable=False)
    created_by = Column(Text, nullable=False)
    version = Column(Text, nullable=False, default="v1")
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())

class Result(Base):
    __tablename__ = "results"
    __table_args__ = {"schema": "ng"}
    
    sim_run_id = Column(BigInteger, ForeignKey("ng.sim_runs.id"), primary_key=True)
    kpi_json = Column(JSON, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())

