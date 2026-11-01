from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Project
from ..auth import AuthenticatedUser, get_current_user

router = APIRouter(prefix="/api/submissions", tags=["Submissions"])

@router.get("/")
def list_submissions(
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    projects = db.query(Project).filter(Project.user_id == current_user.id).all()
    return [{"id": p.id, "name": p.name, "status": p.status, "created_at": p.created_at} for p in projects]

@router.get("/{project_id}")
def get_submission(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project submission not found")
    return {
        "id": project.id,
        "name": project.name,
        "product_category": project.product_category,
        "pcr_ref": project.pcr_ref,
        "status": project.status,
        "technical_data": project.technical_data,
        "results": project.results,
        "reports": project.reports
    }
