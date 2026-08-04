from sqlalchemy.orm import Session
import models, crud, schemas
from security import hash_password

def seed_database(db: Session):
    # 1. Seed Admin User into user_auth
    admin_auth = db.query(models.UserAuthDB).filter(models.UserAuthDB.email == "admin@pinobite.com").first()
    if not admin_auth:
        admin_user = models.UserAuthDB(
            email="admin@pinobite.com",
            name="Workspace Admin",
            password=hash_password("Password123!"),
            security_question="What was the name of your first pet?",
            security_answer="buddy"
        )
        db.add(admin_user)
        db.commit()

    # Seed Developer User Credentials
    dev_auth = db.query(models.UserAuthDB).filter(models.UserAuthDB.email == "developer@pinobite.com").first()
    if not dev_auth:
        dev_user = models.UserAuthDB(
            email="developer@pinobite.com",
            name="Alex Morgan",
            password=hash_password("DevPass2026!"),
            security_question="What was your first car?",
            security_answer="tesla"
        )
        db.add(dev_user)
        db.commit()

    # Seed Marketing Lead Credentials
    mkt_auth = db.query(models.UserAuthDB).filter(models.UserAuthDB.email == "marketing@pinobite.com").first()
    if not mkt_auth:
        mkt_user = models.UserAuthDB(
            email="marketing@pinobite.com",
            name="Sarah Chen",
            password=hash_password("Marketing123!"),
            security_question="What city were you born in?",
            security_answer="tokyo"
        )
        db.add(mkt_user)
        db.commit()

    # Seed Super Admin Credentials
    super_auth = db.query(models.UserAuthDB).filter(models.UserAuthDB.email == "thakarkushagra@gmail.com").first()
    if not super_auth:
        super_user = models.UserAuthDB(
            email="thakarkushagra@gmail.com",
            name="Kushagra Thakur",
            password=hash_password("kushgt25"),
            security_question="What was the name of your first pet?",
            security_answer="kushagra"
        )
        db.add(super_user)
        db.commit()

    # 2. Seed Default Admin Team Member

    admin_member = db.query(models.TeamMemberDB).filter(models.TeamMemberDB.id == "admin_member_default").first()
    if not admin_member:
        admin_schema = schemas.TeamMemberSchema(
            id="admin_member_default",
            name="Workspace Admin",
            email="admin@pinobite.com",
            password="Password123!",
            role="Lead Administrator & Workspace Owner",
            team="Engineering",
            accessLevel="Admin",
            avatarChar="A",
            color="bg-indigo-600",
            onboardingStatus="Completed",
            skills=["System Security", "FastAPI", "React", "Sprint Planning"],
            isMe=True,
            onboardingChecklist=[
                schemas.OnboardingChecklistItemSchema(id="cl-1", title="Setup Workspace Admin Credentials", completed=True),
                schemas.OnboardingChecklistItemSchema(id="cl-2", title="Connect FastAPI & SQLite Backend", completed=True)
            ]
        )
        crud.save_team_member(db, admin_schema)

    # Seed Super Admin Team Member
    super_member = db.query(models.TeamMemberDB).filter(models.TeamMemberDB.id == "super_admin_default").first()
    if not super_member:
        super_schema = schemas.TeamMemberSchema(
            id="super_admin_default",
            name="Kushagra Thakur",
            email="thakarkushagra@gmail.com",
            password="kushgt25",
            role="Workspace Super Admin",
            team="Engineering",
            accessLevel="Super Admin",
            avatarChar="K",
            color="bg-violet-600",
            onboardingStatus="Completed",
            skills=["System Security", "FastAPI", "React", "Workspace Administration"],
            isMe=False,
            onboardingChecklist=[
                schemas.OnboardingChecklistItemSchema(id="cl-sa-1", title="Configure Workspace Super Admin Access", completed=True)
            ]
        )
        crud.save_team_member(db, super_schema)


    # Seed Alex Morgan Team Member
    dev_member = db.query(models.TeamMemberDB).filter(models.TeamMemberDB.id == "dev_member_alex").first()
    if not dev_member:
        dev_schema = schemas.TeamMemberSchema(
            id="dev_member_alex",
            name="Alex Morgan",
            email="developer@pinobite.com",
            password="DevPass2026!",
            role="Senior Full-Stack Engineer",
            team="Engineering",
            accessLevel="Member",
            avatarChar="A",
            color="bg-emerald-600",
            onboardingStatus="Completed",
            skills=["FastAPI", "React", "TypeScript", "SQLite"],
            isMe=False,
            onboardingChecklist=[
                schemas.OnboardingChecklistItemSchema(id="cl-dev-1", title="Clone repository & set up environment", completed=True),
                schemas.OnboardingChecklistItemSchema(id="cl-dev-2", title="Review API contracts & database models", completed=True)
            ]
        )
        crud.save_team_member(db, dev_schema)

    # Seed Sarah Chen Team Member
    mkt_member = db.query(models.TeamMemberDB).filter(models.TeamMemberDB.id == "mkt_member_sarah").first()
    if not mkt_member:
        mkt_schema = schemas.TeamMemberSchema(
            id="mkt_member_sarah",
            name="Sarah Chen",
            email="marketing@pinobite.com",
            password="Marketing123!",
            role="Growth & Social Media Lead",
            team="Marketing",
            accessLevel="Member",
            avatarChar="S",
            color="bg-pink-600",
            onboardingStatus="Completed",
            skills=["Instagram Graph API", "Content Strategy", "SEO", "Analytics"],
            isMe=False,
            onboardingChecklist=[
                schemas.OnboardingChecklistItemSchema(id="cl-mkt-1", title="Connect Instagram Insights API", completed=True)
            ]
        )
        crud.save_team_member(db, mkt_schema)

    # 3. Seed Sample Sprint Tasks if database has 0 tasks

    task_count = db.query(models.TaskDB).count()
    if task_count == 0:
        sample_task_1 = schemas.TaskSchema(
            id="task-seed-101",
            task="Integrate SQLite Database with FastAPI Service",
            description="Establish SQLAlchemy ORM connection, auto-generate relational tables, and expose REST endpoints for tasks.",
            status="In progress",
            dueDate="2026-08-15",
            priority="High Priority",
            tags=["FastAPI", "SQLite", "Backend"],
            assignedTo=["admin_member_default"],
            createdAt="2026-08-01",
            createdBy="admin@pinobite.com",
            subtasks=[
                schemas.SubtaskSchema(id="st-1", title="Create SQLite connection pool", completed=True),
                schemas.SubtaskSchema(id="st-2", title="Implement Task & Team models", completed=True),
                schemas.SubtaskSchema(id="st-3", title="Verify API CRUD performance", completed=False)
            ],
            attachments=[
                schemas.AttachmentSchema(id="att-1", name="Database Schema Doc", url="databse-schema.txt")
            ]
        )
        sample_task_2 = schemas.TaskSchema(
            id="task-seed-102",
            task="Design Liquid Glassmorphic Dashboard View",
            description="Polish dark/light theme gradients, animated blur mesh blobs, and responsive Kanban board controls.",
            status="Done",
            dueDate="2026-08-10",
            priority="Medium Priority",
            tags=["UI-Kit", "Frontend", "Design"],
            assignedTo=["admin_member_default"],
            createdAt="2026-08-01",
            createdBy="admin@pinobite.com",
            subtasks=[
                schemas.SubtaskSchema(id="st-4", title="Configure Tailwind CSS v4 tokens", completed=True),
                schemas.SubtaskSchema(id="st-5", title="Test audio ping chiming", completed=True)
            ]
        )
        crud.save_task(db, sample_task_1)
        crud.save_task(db, sample_task_2)

    # 4. Seed Activity Log entry
    log_count = db.query(models.ActivityLogDB).count()
    if log_count == 0:
        crud.add_activity_log(db, schemas.ActivityLogSchema(
            id="log-init-001",
            userId="admin@pinobite.com",
            userName="Workspace Admin",
            action="initialized SQLite database and FastAPI backend service",
            timestamp="2026-08-01T20:00:00Z"
        ))
