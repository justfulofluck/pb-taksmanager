from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from contextlib import asynccontextmanager

from database import engine, Base, get_db
from sqlalchemy import text
import models, schemas, crud, email_service



@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite tables
    Base.metadata.create_all(bind=engine)
    
    # Run migrations for time_spent if needed
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE tasks ADD COLUMN time_spent INTEGER DEFAULT 0;"))
            conn.commit()
    except Exception:
        pass
        
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE subtasks ADD COLUMN time_spent INTEGER DEFAULT 0;"))
            conn.commit()
    except Exception:
        pass

    yield

app = FastAPI(
    title="Pinobite Workspace Backend",
    description="FastAPI REST Backend with SQLite Database for Task & Team Management",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS Middleware for Frontend React Application
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root & Health Check
@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": "Pinobite Workspace FastAPI Backend",
        "database": "SQLite (pinobite_workspace.db)",
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {"status": "ok", "timestamp": "live"}

# =========================================================================
# TASKS ENDPOINTS
# =========================================================================

@app.get("/api/tasks", response_model=List[schemas.TaskSchema], response_model_by_alias=False)
def get_tasks(db: Session = Depends(get_db)):
    return crud.get_all_tasks(db)

@app.post("/api/tasks", response_model=schemas.TaskSchema, status_code=status.HTTP_201_CREATED, response_model_by_alias=False)
def save_task(task: schemas.TaskSchema, db: Session = Depends(get_db)):
    return crud.save_task(db, task)

@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: str, db: Session = Depends(get_db)):
    success = crud.delete_task(db, task_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    return {"message": f"Task {task_id} deleted successfully"}

@app.post("/api/tasks/bulk-delete")
def bulk_delete_tasks(task_ids: List[str], db: Session = Depends(get_db)):
    crud.bulk_delete_tasks(db, task_ids)
    return {"message": f"Bulk deleted {len(task_ids)} tasks successfully"}

# =========================================================================
# AUTHENTICATION ENDPOINTS
# =========================================================================

@app.post("/api/auth/register", response_model=schemas.UserAuthResponseSchema, response_model_by_alias=False)
def register(user: schemas.UserRegisterSchema, db: Session = Depends(get_db)):
    try:
        return crud.register_user(db, user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/auth/login", response_model=schemas.UserAuthResponseSchema, response_model_by_alias=False)
def login(credentials: schemas.UserLoginSchema, db: Session = Depends(get_db)):
    try:
        return crud.login_user(db, credentials)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

# =========================================================================
# COMMENTS ENDPOINTS
# =========================================================================

@app.get("/api/comments", response_model=List[schemas.CommentSchema], response_model_by_alias=False)
def get_comments(task_id: Optional[str] = None, db: Session = Depends(get_db)):
    return crud.get_comments(db, task_id)

@app.post("/api/comments", response_model=schemas.CommentSchema, status_code=status.HTTP_201_CREATED, response_model_by_alias=False)
def add_comment(comment: schemas.CommentSchema, db: Session = Depends(get_db)):
    return crud.save_comment(db, comment)

# =========================================================================
# ACTIVITY LOGS ENDPOINTS
# =========================================================================

@app.get("/api/activity-logs", response_model=List[schemas.ActivityLogSchema], response_model_by_alias=False)
def get_activity_logs(db: Session = Depends(get_db)):
    return crud.get_activity_logs(db)

@app.post("/api/activity-logs", response_model=schemas.ActivityLogSchema, status_code=status.HTTP_201_CREATED, response_model_by_alias=False)
def add_activity_log(log: schemas.ActivityLogSchema, db: Session = Depends(get_db)):
    return crud.add_activity_log(db, log)

# =========================================================================
# TEAM MEMBERS ENDPOINTS
# =========================================================================

@app.get("/api/team-members", response_model=List[schemas.TeamMemberSchema], response_model_by_alias=False)
def get_team_members(db: Session = Depends(get_db)):
    return crud.get_all_team_members(db)

@app.post("/api/team-members", response_model=schemas.TeamMemberSchema, status_code=status.HTTP_201_CREATED, response_model_by_alias=False)
def save_team_member(member: schemas.TeamMemberSchema, db: Session = Depends(get_db)):
    return crud.save_team_member(db, member)

@app.delete("/api/team-members/{member_id}")
def delete_team_member(member_id: str, db: Session = Depends(get_db)):
    success = crud.delete_team_member(db, member_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Member {member_id} not found")
    return {"message": f"Team member {member_id} deleted successfully"}

# =========================================================================
# SOCIAL MEDIA POSTS ENDPOINTS
# =========================================================================

@app.get("/api/social-posts", response_model=List[schemas.SocialMediaPostSchema], response_model_by_alias=False)
def get_social_posts(db: Session = Depends(get_db)):
    return crud.get_social_posts(db)

@app.post("/api/social-posts", response_model=schemas.SocialMediaPostSchema, status_code=status.HTTP_201_CREATED, response_model_by_alias=False)
def save_social_post(post: schemas.SocialMediaPostSchema, db: Session = Depends(get_db)):
    return crud.save_social_post(db, post)

@app.delete("/api/social-posts/{post_id}")
def delete_social_post(post_id: str, db: Session = Depends(get_db)):
    success = crud.delete_social_post(db, post_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Post {post_id} not found")
    return {"message": f"Social media post {post_id} deleted successfully"}

# =========================================================================
# EMAIL NOTIFICATIONS ENDPOINTS (YAGMAIL)
# =========================================================================

class EmailSendRequest(schemas.BaseModel):
    to_email: str
    subject: str
    content: str

class InviteMemberEmailRequest(schemas.BaseModel):
    to_email: str
    name: str
    role: str
    temp_password: Optional[str] = "Welcome123!"

@app.post("/api/notifications/send-email")
def send_generic_email(payload: EmailSendRequest):
    sent = email_service.send_email(
        to=payload.to_email,
        subject=payload.subject,
        contents=payload.content
    )
    return {
        "status": "sent" if sent else "queued_or_simulated",
        "to": payload.to_email,
        "subject": payload.subject
    }

@app.post("/api/team-members/send-onboarding-email")
def send_onboarding_email(payload: InviteMemberEmailRequest):
    sent = email_service.send_welcome_onboarding_email(
        to_email=payload.to_email,
        name=payload.name,
        role=payload.role,
        temp_password=payload.temp_password or "Welcome123!"
    )
    return {
        "status": "sent" if sent else "queued_or_simulated",
        "recipient": payload.to_email,
        "message": f"Onboarding email dispatched to {payload.name}"
    }

if __name__ == "__main__":

    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
