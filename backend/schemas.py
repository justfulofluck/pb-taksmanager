from pydantic import BaseModel, Field
from typing import List, Optional

# --- Subtasks & Attachments ---

class SubtaskSchema(BaseModel):
    id: str
    title: str
    completed: bool = False

    class Config:
        from_attributes = True

class AttachmentSchema(BaseModel):
    id: str
    name: Optional[str] = ""
    url: str

    class Config:
        from_attributes = True

# --- Tasks ---

class TaskSchema(BaseModel):
    id: str
    task: str
    description: Optional[str] = ""
    status: str = "Not started" # 'Not started' | 'In progress' | 'Done'
    dueDate: Optional[str] = Field(default="", alias="due_date")
    priority: str = "Medium Priority" # 'High Priority' | 'Medium Priority' | 'Low Priority' | 'Minimal Priority'
    tags: List[str] = []
    assignedTo: List[str] = []
    createdAt: Optional[str] = Field(default="", alias="created_at")
    createdBy: Optional[str] = Field(default="user", alias="created_by")
    attachments: Optional[List[AttachmentSchema]] = []
    subtasks: Optional[List[SubtaskSchema]] = []

    class Config:
        from_attributes = True
        populate_by_name = True

# --- Onboarding Checklist & Team Members ---

class OnboardingChecklistItemSchema(BaseModel):
    id: str
    title: str
    completed: bool = False

    class Config:
        from_attributes = True

class TeamMemberSchema(BaseModel):
    id: str
    name: str
    email: str
    role: Optional[str] = ""
    team: Optional[str] = ""
    teams: Optional[List[str]] = []
    accessLevel: Optional[str] = Field(default="Member", alias="access_level")
    onboardingStatus: Optional[str] = Field(default="Invited", alias="onboarding_status")
    joinedDate: Optional[str] = Field(default="", alias="joined_date")
    skills: Optional[List[str]] = []
    onboardingChecklist: Optional[List[OnboardingChecklistItemSchema]] = Field(default=[], alias="onboarding_checklist")
    avatarUrl: Optional[str] = Field(default="", alias="avatar_url")
    avatarChar: str = Field(default="U", alias="avatar_char")
    color: str = Field(default="bg-indigo-500", alias="color")
    isMe: Optional[bool] = Field(default=False, alias="is_me")
    password: Optional[str] = ""
    location: Optional[str] = ""
    timezone: Optional[str] = ""
    bio: Optional[str] = ""

    class Config:
        from_attributes = True
        populate_by_name = True

# --- Comments ---

class CommentSchema(BaseModel):
    id: str
    taskId: str = Field(alias="task_id")
    senderId: str = Field(alias="sender_id")
    senderName: str = Field(alias="sender_name")
    senderColor: Optional[str] = Field(default="bg-indigo-500", alias="sender_color")
    content: str
    timestamp: str

    class Config:
        from_attributes = True
        populate_by_name = True

# --- Activity Logs ---

class ActivityLogSchema(BaseModel):
    id: str
    taskId: Optional[str] = Field(default=None, alias="task_id")
    userId: str = Field(alias="user_id")
    userName: str = Field(alias="user_name")
    action: str
    timestamp: str
    details: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True

# --- Authentication ---

class UserRegisterSchema(BaseModel):
    email: str
    name: str
    password: str
    securityQuestion: Optional[str] = Field(default="", alias="security_question")
    securityAnswer: Optional[str] = Field(default="", alias="security_answer")

    class Config:
        populate_by_name = True

class UserLoginSchema(BaseModel):
    email: str
    password: str

class UserAuthResponseSchema(BaseModel):
    email: str
    name: str

# --- Social Media Posts ---

class SocialMediaPostSchema(BaseModel):
    id: str
    date: Optional[str] = ""
    day: Optional[str] = ""
    platform: Optional[str] = "Instagram"
    contentPillar: Optional[str] = Field(default="", alias="content_pillar")
    contentFormat: Optional[str] = Field(default="", alias="content_format")
    campaign: Optional[str] = ""
    product: Optional[str] = ""
    titleHook: Optional[str] = Field(default="", alias="title_hook")
    cta: Optional[str] = ""
    owner: Optional[str] = ""
    influencer: Optional[str] = ""
    designStatus: Optional[str] = Field(default="In Progress", alias="design_status")
    captionStatus: Optional[str] = Field(default="Draft", alias="caption_status")
    approval: Optional[str] = Field(default="Pending", alias="approval")
    postTime: Optional[str] = Field(default="", alias="post_time")
    publishingStatus: Optional[str] = Field(default="Draft", alias="publishing_status")
    urlLink: Optional[str] = Field(default="", alias="url_link")
    reach: int = 0
    likes: int = 0
    comments: int = 0
    shares: int = 0
    saves: int = 0
    clicks: int = 0
    orders: int = 0
    revenue: float = 0.0
    remarks: Optional[str] = ""

    class Config:
        from_attributes = True
        populate_by_name = True
