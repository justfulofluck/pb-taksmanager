import os
import yagmail
from typing import Optional, List, Union

# SMTP Configuration from Environment Variables
SMTP_USER = os.getenv("SMTP_USER") or os.getenv("GMAIL_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD") or os.getenv("GMAIL_APP_PASSWORD")

def get_yagmail_client() -> Optional[yagmail.SMTP]:
    if not SMTP_USER or not SMTP_PASSWORD:
        print("⚠️ Yagmail: SMTP_USER or SMTP_PASSWORD environment variables not set.")
        return None
    try:
        return yagmail.SMTP(user=SMTP_USER, password=SMTP_PASSWORD)
    except Exception as e:
        print(f"🚨 Yagmail client initialization error: {e}")
        return None

def send_email(
    to: Union[str, List[str]],
    subject: str,
    contents: Union[str, List[str]],
    attachments: Optional[List[str]] = None
) -> bool:
    """
    Sends an email using yagmail library.
    Returns True if sent successfully, False otherwise.
    """
    client = get_yagmail_client()
    if not client:
        print(f"📧 [Simulated Email Sent] To: {to} | Subject: '{subject}'")
        return False
    try:
        client.send(
            to=to,
            subject=subject,
            contents=contents,
            attachments=attachments
        )
        print(f"✅ Yagmail: Email sent successfully to {to}")
        return True
    except Exception as e:
        print(f"🚨 Yagmail send failure to {to}: {e}")
        return False

def send_welcome_onboarding_email(
    to_email: str,
    name: str,
    role: str,
    temp_password: str
) -> bool:
    """
    Sends a welcome onboarding invitation email to new team members.
    """
    subject = f"🎉 Welcome to Pinobite Workspace, {name}!"
    body = [
        f"<h2>Welcome to Pinobite Sprint Sync Workspace!</h2>",
        f"<p>Hello <b>{name}</b>,</p>",
        f"<p>You have been invited to join our team workspace as a <b>{role}</b>.</p>",
        f"<div style='background-color:#f1f5f9; padding:15px; border-radius:10px; border:1px solid #cbd5e1;'>",
        f"<p style='margin:0;'><b>Login Email:</b> {to_email}</p>",
        f"<p style='margin:5px 0 0 0;'><b>Temporary Password:</b> <code style='background:#e2e8f0; padding:2px 6px; border-radius:4px;'>{temp_password}</code></p>",
        f"</div>",
        f"<p>Please log in and update your credentials upon your first sign-in.</p>",
        f"<p>Best regards,<br><i>Pinobite Admin Team</i></p>"
    ]
    return send_email(to=to_email, subject=subject, contents=body)

def send_task_assignment_email(
    to_email: str,
    assignee_name: str,
    task_title: str,
    due_date: str,
    priority: str
) -> bool:
    """
    Sends an alert email when a task is assigned to a member.
    """
    subject = f"📋 New Task Assigned: {task_title}"
    body = [
        f"<h3>New Task Assigned to You</h3>",
        f"<p>Hi <b>{assignee_name}</b>,</p>",
        f"<p>You have been assigned a new task on Pinobite Workspace:</p>",
        f"<ul>",
        f"<li><b>Task Name:</b> {task_title}</li>",
        f"<li><b>Priority:</b> {priority}</li>",
        f"<li><b>Due Date:</b> {due_date}</li>",
        f"</ul>",
        f"<p>Log into your workspace portal to view requirements and update progress.</p>"
    ]
    return send_email(to=to_email, subject=subject, contents=body)
