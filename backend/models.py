from sqlalchemy import Column, String, Text, Boolean, Integer, Float, DateTime, ForeignKey, PrimaryKeyConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class TeamMemberDB(Base):
    __tablename__ = "team_members"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=True)
    role = Column(String(255), nullable=True)
    department = Column(String(255), nullable=True) # maps to team
    access_level = Column(String(20), default="Member") # Super Admin, Member
    avatar_char = Column(String(10), nullable=True, default="U")
    avatar_url = Column(String(500), nullable=True)
    color = Column(String(50), nullable=True, default="bg-indigo-500")
    onboarding_status = Column(String(20), default="Invited") # Invited, In Progress, Completed
    joined_date = Column(String(100), nullable=True)
    location = Column(String(255), nullable=True)
    timezone = Column(String(100), nullable=True)
    is_me = Column(Boolean, default=False)
    bio = Column(Text, nullable=True)

    skills = relationship("MemberSkillDB", back_populates="member", cascade="all, delete-orphan")
    checklist_items = relationship("OnboardingChecklistDB", back_populates="member", cascade="all, delete-orphan")


class MemberSkillDB(Base):
    __tablename__ = "member_skills"

    member_id = Column(String(50), ForeignKey("team_members.id", ondelete="CASCADE"), primary_key=True)
    skill = Column(String(100), primary_key=True)

    member = relationship("TeamMemberDB", back_populates="skills")


class OnboardingChecklistDB(Base):
    __tablename__ = "onboarding_checklist"

    id = Column(String(50), primary_key=True)
    member_id = Column(String(50), ForeignKey("team_members.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    completed = Column(Boolean, default=False)

    member = relationship("TeamMemberDB", back_populates="checklist_items")


class TaskDB(Base):
    __tablename__ = "tasks"

    id = Column(String(50), primary_key=True, index=True)
    title = Column(String(255), nullable=False) # task title
    description = Column(Text, nullable=True)
    status = Column(String(50), default="Not started") # Not started, In progress, Done
    priority = Column(String(50), default="Medium Priority") # High Priority, Medium Priority, Low Priority, Minimal Priority
    due_date = Column(String(100), nullable=True)
    created_at = Column(String(100), nullable=True)
    created_by = Column(String(50), nullable=True)

    assignments = relationship("TaskAssignmentDB", back_populates="task", cascade="all, delete-orphan")
    tags = relationship("TaskTagDB", back_populates="task", cascade="all, delete-orphan")
    subtasks = relationship("SubtaskDB", back_populates="task", cascade="all, delete-orphan")
    attachments = relationship("AttachmentDB", back_populates="task", cascade="all, delete-orphan")
    comments = relationship("CommentDB", back_populates="task", cascade="all, delete-orphan")


class TaskAssignmentDB(Base):
    __tablename__ = "task_assignments"

    task_id = Column(String(50), ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True)
    member_id = Column(String(50), primary_key=True)

    task = relationship("TaskDB", back_populates="assignments")


class TaskTagDB(Base):
    __tablename__ = "task_tags"

    task_id = Column(String(50), ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True)
    tag = Column(String(100), primary_key=True)

    task = relationship("TaskDB", back_populates="tags")


class SubtaskDB(Base):
    __tablename__ = "subtasks"

    id = Column(String(50), primary_key=True)
    task_id = Column(String(50), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    completed = Column(Boolean, default=False)

    task = relationship("TaskDB", back_populates="subtasks")


class AttachmentDB(Base):
    __tablename__ = "attachments"

    id = Column(String(50), primary_key=True)
    task_id = Column(String(50), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=True)
    url = Column(Text, nullable=False)

    task = relationship("TaskDB", back_populates="attachments")


class CommentDB(Base):
    __tablename__ = "comments"

    id = Column(String(50), primary_key=True, index=True)
    task_id = Column(String(50), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(String(50), nullable=False)
    sender_name = Column(String(255), nullable=False)
    sender_color = Column(String(50), nullable=True, default="bg-indigo-500")
    content = Column(Text, nullable=False)
    timestamp = Column(String(100), nullable=False)

    task = relationship("TaskDB", back_populates="comments")


class ActivityLogDB(Base):
    __tablename__ = "activity_logs"

    id = Column(String(50), primary_key=True, index=True)
    task_id = Column(String(50), ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    user_id = Column(String(50), nullable=False)
    user_name = Column(String(255), nullable=False)
    action = Column(String(255), nullable=False)
    details = Column(Text, nullable=True)
    timestamp = Column(String(100), nullable=False)


class UserAuthDB(Base):
    __tablename__ = "user_auth"

    email = Column(String(255), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    password = Column(String(255), nullable=False)
    security_question = Column(String(255), nullable=True)
    security_answer = Column(String(255), nullable=True)


class SocialMediaPostDB(Base):
    __tablename__ = "social_media_posts"

    id = Column(String(50), primary_key=True, index=True)
    date = Column(String(50), nullable=True)
    day = Column(String(50), nullable=True)
    platform = Column(String(50), nullable=True)
    content_pillar = Column(String(100), nullable=True)
    content_format = Column(String(100), nullable=True)
    campaign = Column(String(255), nullable=True)
    product = Column(String(255), nullable=True)
    title_hook = Column(Text, nullable=True)
    cta = Column(String(255), nullable=True)
    owner = Column(String(255), nullable=True)
    influencer = Column(String(255), nullable=True)
    design_status = Column(String(50), nullable=True)
    caption_status = Column(String(50), nullable=True)
    approval = Column(String(50), nullable=True)
    post_time = Column(String(50), nullable=True)
    publishing_status = Column(String(50), nullable=True)
    url_link = Column(Text, nullable=True)
    reach = Column(Integer, default=0)
    likes = Column(Integer, default=0)
    comments = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    saves = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    orders = Column(Integer, default=0)
    revenue = Column(Float, default=0.0)
    remarks = Column(Text, nullable=True)
