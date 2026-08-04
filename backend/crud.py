from sqlalchemy.orm import Session
from sqlalchemy import delete
from typing import List, Optional
import models, schemas
from security import hash_password, verify_password, is_bcrypt_hash

# =========================================================================
# TASK CRUD OPERATIONS
# =========================================================================

def get_all_tasks(db: Session) -> List[schemas.TaskSchema]:
    task_records = db.query(models.TaskDB).all()
    results = []
    for t in task_records:
        tags = [tag.tag for tag in t.tags]
        assigned_to = [a.member_id for a in t.assignments]
        subtasks = [schemas.SubtaskSchema(id=s.id, title=s.title, completed=s.completed) for s in t.subtasks]
        attachments = [schemas.AttachmentSchema(id=a.id, name=a.name or "", url=a.url) for a in t.attachments]
        
        results.append(schemas.TaskSchema(
            id=t.id,
            task=t.title,
            description=t.description or "",
            status=t.status or "Not started",
            dueDate=t.due_date or "",
            priority=t.priority or "Medium Priority",
            tags=tags,
            assignedTo=assigned_to,
            createdAt=t.created_at or "",
            createdBy=t.created_by or "user",
            subtasks=subtasks,
            attachments=attachments
        ))
    return results


def save_task(db: Session, task_data: schemas.TaskSchema) -> schemas.TaskSchema:
    # Delete existing task if updating to refresh relationships
    existing = db.query(models.TaskDB).filter(models.TaskDB.id == task_data.id).first()
    if existing:
        db.delete(existing)
        db.commit()

    db_task = models.TaskDB(
        id=task_data.id,
        title=task_data.task,
        description=task_data.description,
        status=task_data.status,
        priority=task_data.priority,
        due_date=task_data.dueDate,
        created_at=task_data.createdAt,
        created_by=task_data.createdBy
    )
    db.add(db_task)
    db.flush()

    # Add tags
    for tag_str in task_data.tags:
        db.add(models.TaskTagDB(task_id=task_data.id, tag=tag_str))

    # Add assignments
    for member_id in task_data.assignedTo:
        db.add(models.TaskAssignmentDB(task_id=task_data.id, member_id=member_id))

    # Add subtasks
    if task_data.subtasks:
        for st in task_data.subtasks:
            db.add(models.SubtaskDB(id=st.id, task_id=task_data.id, title=st.title, completed=st.completed))

    # Add attachments
    if task_data.attachments:
        for att in task_data.attachments:
            db.add(models.AttachmentDB(id=att.id, task_id=task_data.id, name=att.name, url=att.url))

    db.commit()
    return task_data


def delete_task(db: Session, task_id: str) -> bool:
    existing = db.query(models.TaskDB).filter(models.TaskDB.id == task_id).first()
    if existing:
        db.delete(existing)
        db.commit()
        return True
    return False


def bulk_delete_tasks(db: Session, task_ids: List[str]) -> bool:
    db.query(models.TaskDB).filter(models.TaskDB.id.in_(task_ids)).delete(synchronize_session=False)
    db.commit()
    return True


# =========================================================================
# TEAM MEMBER CRUD OPERATIONS
# =========================================================================

def get_all_team_members(db: Session) -> List[schemas.TeamMemberSchema]:
    members = db.query(models.TeamMemberDB).all()
    results = []
    for m in members:
        skills = [s.skill for s in m.skills]
        checklist = [
            schemas.OnboardingChecklistItemSchema(id=c.id, title=c.title, completed=c.completed)
            for c in m.checklist_items
        ]
        results.append(schemas.TeamMemberSchema(
            id=m.id,
            name=m.name,
            email=m.email,
            role=m.role or "",
            team=m.department or "",
            accessLevel=m.access_level or "Member",
            onboardingStatus=m.onboarding_status or "Invited",
            joinedDate=m.joined_date or "",
            skills=skills,
            onboardingChecklist=checklist,
            avatarUrl=m.avatar_url or "",
            avatarChar=m.avatar_char or "U",
            color=m.color or "bg-indigo-500",
            isMe=m.is_me or False,
            password=m.password or "",
            location=m.location or "",
            timezone=m.timezone or "",
            bio=m.bio or ""
        ))
    return results


def save_team_member(db: Session, member_data: schemas.TeamMemberSchema) -> schemas.TeamMemberSchema:
    existing = db.query(models.TeamMemberDB).filter(models.TeamMemberDB.id == member_data.id).first()
    if existing:
        db.delete(existing)
        db.commit()

    db_member = models.TeamMemberDB(
        id=member_data.id,
        name=member_data.name,
        email=member_data.email,
        role=member_data.role,
        department=member_data.team,
        access_level=member_data.accessLevel,
        onboarding_status=member_data.onboardingStatus,
        joined_date=member_data.joinedDate,
        avatar_url=member_data.avatarUrl,
        avatar_char=member_data.avatarChar,
        color=member_data.color,
        is_me=member_data.isMe,
        password=member_data.password,
        location=member_data.location,
        timezone=member_data.timezone,
        bio=member_data.bio
    )
    db.add(db_member)
    db.flush()

    if member_data.skills:
        for sk in member_data.skills:
            db.add(models.MemberSkillDB(member_id=member_data.id, skill=sk))

    if member_data.onboardingChecklist:
        for cl in member_data.onboardingChecklist:
            db.add(models.OnboardingChecklistDB(id=cl.id, member_id=member_data.id, title=cl.title, completed=cl.completed))

    db.commit()
    return member_data


def delete_team_member(db: Session, member_id: str) -> bool:
    existing = db.query(models.TeamMemberDB).filter(models.TeamMemberDB.id == member_id).first()
    if existing:
        db.delete(existing)
        db.commit()
        return True
    return False


# =========================================================================
# COMMENT CRUD OPERATIONS
# =========================================================================

def get_comments(db: Session, task_id: Optional[str] = None) -> List[schemas.CommentSchema]:
    query = db.query(models.CommentDB)
    if task_id:
        query = query.filter(models.CommentDB.task_id == task_id)
    records = query.all()
    return [
        schemas.CommentSchema(
            id=c.id,
            taskId=c.task_id,
            senderId=c.sender_id,
            senderName=c.sender_name,
            senderColor=c.sender_color or "bg-indigo-500",
            content=c.content,
            timestamp=c.timestamp
        )
        for c in records
    ]


def save_comment(db: Session, comment_data: schemas.CommentSchema) -> schemas.CommentSchema:
    existing = db.query(models.CommentDB).filter(models.CommentDB.id == comment_data.id).first()
    if existing:
        db.delete(existing)
        db.commit()

    db_comment = models.CommentDB(
        id=comment_data.id,
        task_id=comment_data.taskId,
        sender_id=comment_data.senderId,
        sender_name=comment_data.senderName,
        sender_color=comment_data.senderColor,
        content=comment_data.content,
        timestamp=comment_data.timestamp
    )
    db.add(db_comment)
    db.commit()
    return comment_data


# =========================================================================
# ACTIVITY LOG CRUD OPERATIONS
# =========================================================================

def get_activity_logs(db: Session) -> List[schemas.ActivityLogSchema]:
    records = db.query(models.ActivityLogDB).order_by(models.ActivityLogDB.timestamp.desc()).all()
    return [
        schemas.ActivityLogSchema(
            id=l.id,
            taskId=l.task_id,
            userId=l.user_id,
            userName=l.user_name,
            action=l.action,
            timestamp=l.timestamp,
            details=l.details
        )
        for l in records
    ]


def add_activity_log(db: Session, log_data: schemas.ActivityLogSchema) -> schemas.ActivityLogSchema:
    db_log = models.ActivityLogDB(
        id=log_data.id,
        task_id=log_data.taskId,
        user_id=log_data.userId,
        user_name=log_data.userName,
        action=log_data.action,
        timestamp=log_data.timestamp,
        details=log_data.details
    )
    db.add(db_log)
    db.commit()
    return log_data


# =========================================================================
# AUTHENTICATION OPERATIONS
# =========================================================================

def register_user(db: Session, payload: schemas.UserRegisterSchema) -> schemas.UserAuthResponseSchema:
    email_key = payload.email.lower().strip()
    existing = db.query(models.UserAuthDB).filter(models.UserAuthDB.email == email_key).first()
    if existing:
        raise ValueError("User already exists")

    db_user = models.UserAuthDB(
        email=email_key,
        name=payload.name,
        password=hash_password(payload.password),
        security_question=payload.securityQuestion,
        security_answer=payload.securityAnswer
    )
    db.add(db_user)
    db.commit()
    return schemas.UserAuthResponseSchema(email=payload.email, name=payload.name)


def login_user(db: Session, payload: schemas.UserLoginSchema) -> schemas.UserAuthResponseSchema:
    email_key = payload.email.lower().strip()
    user = db.query(models.UserAuthDB).filter(models.UserAuthDB.email == email_key).first()
    if not user or not verify_password(payload.password, user.password):
        raise ValueError("Invalid email or password")
    # Lazily upgrade legacy plaintext passwords to hashes
    if not is_bcrypt_hash(user.password):
        user.password = hash_password(payload.password)
        db.commit()
    return schemas.UserAuthResponseSchema(email=user.email, name=user.name)


# =========================================================================
# SOCIAL MEDIA POST CRUD OPERATIONS
# =========================================================================

def get_social_posts(db: Session) -> List[schemas.SocialMediaPostSchema]:
    posts = db.query(models.SocialMediaPostDB).all()
    return [
        schemas.SocialMediaPostSchema(
            id=p.id,
            date=p.date or "",
            day=p.day or "",
            platform=p.platform or "Instagram",
            contentPillar=p.content_pillar or "",
            contentFormat=p.content_format or "",
            campaign=p.campaign or "",
            product=p.product or "",
            titleHook=p.title_hook or "",
            cta=p.cta or "",
            owner=p.owner or "",
            influencer=p.influencer or "",
            designStatus=p.design_status or "In Progress",
            captionStatus=p.caption_status or "Draft",
            approval=p.approval or "Pending",
            postTime=p.post_time or "",
            publishingStatus=p.publishing_status or "Draft",
            urlLink=p.url_link or "",
            reach=p.reach,
            likes=p.likes,
            comments=p.comments,
            shares=p.shares,
            saves=p.saves,
            clicks=p.clicks,
            orders=p.orders,
            revenue=p.revenue,
            remarks=p.remarks or ""
        )
        for p in posts
    ]


def save_social_post(db: Session, post_data: schemas.SocialMediaPostSchema) -> schemas.SocialMediaPostSchema:
    existing = db.query(models.SocialMediaPostDB).filter(models.SocialMediaPostDB.id == post_data.id).first()
    if existing:
        db.delete(existing)
        db.commit()

    db_post = models.SocialMediaPostDB(
        id=post_data.id,
        date=post_data.date,
        day=post_data.day,
        platform=post_data.platform,
        content_pillar=post_data.contentPillar,
        content_format=post_data.contentFormat,
        campaign=post_data.campaign,
        product=post_data.product,
        title_hook=post_data.titleHook,
        cta=post_data.cta,
        owner=post_data.owner,
        influencer=post_data.influencer,
        design_status=post_data.designStatus,
        caption_status=post_data.captionStatus,
        approval=post_data.approval,
        post_time=post_data.postTime,
        publishing_status=post_data.publishingStatus,
        url_link=post_data.urlLink,
        reach=post_data.reach,
        likes=post_data.likes,
        comments=post_data.comments,
        shares=post_data.shares,
        saves=post_data.saves,
        clicks=post_data.clicks,
        orders=post_data.orders,
        revenue=post_data.revenue,
        remarks=post_data.remarks
    )
    db.add(db_post)
    db.commit()
    return post_data


def delete_social_post(db: Session, post_id: str) -> bool:
    existing = db.query(models.SocialMediaPostDB).filter(models.SocialMediaPostDB.id == post_id).first()
    if existing:
        db.delete(existing)
        db.commit()
        return True
    return False
