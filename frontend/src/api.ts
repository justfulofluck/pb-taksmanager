import { Task, Comment, ActivityLog, UserSession } from './types';

/**
 * 🚀 PINOBITE FASTAPI CLIENT INTEGRATION LAYER
 * 
 * This file is the primary service class that connects the React frontend to your FastAPI backend.
 * By default, if the environment variable `VITE_FASTAPI_BACKEND_URL` is not set, it falls back
 * seamlessly to offline-first LocalStorage. Once you plug in your FastAPI server URL, it starts
 * executing real HTTP requests.
 * 
 * --------------------------------------------------------------------------------------
 * 🐍 COMPATIBLE FASTAPI CODELAB (Python Code - Copy & Paste to your backend server)
 * --------------------------------------------------------------------------------------
 * 
 * ```python
 * from fastapi import FastAPI, HTTPException, status, Depends
 * from fastapi.middleware.cors import CORSMiddleware
 * from pydantic import BaseModel, EmailStr
 * from typing import List, Optional
 * import datetime
 * 
 * app = FastAPI(title="Pinobite Workspace Backend", version="1.0.0")
 * 
 * # ⚠️ IMPORTANT: Configure CORS so your React application can communicate with your backend
 * app.add_middleware(
 *     CORSMiddleware,
 *     allow_origins=["*"], # In production, specify your React app's host URL
 *     allow_credentials=True,
 *     allow_methods=["*"],
 *     allow_headers=["*"],
 * )
 * 
 * # Pydantic Models
 * class TaskCreate(BaseModel):
 *     id: str
 *     task: str
 *     description: str
 *     status: str # 'Not started' | 'In progress' | 'Done'
 *     dueDate: str
 *     priority: str
 *     tags: List[str]
 *     assignedTo: List[str]
 *     createdAt: str
 *     createdBy: str
 * 
 * class UserRegister(BaseModel):
 *     email: str
 *     name: str
 *     password: str
 *     securityQuestion: str
 *     securityAnswer: str
 * 
 * class UserLogin(BaseModel):
 *     email: str
 *     password: str
 * 
 * class CommentCreate(BaseModel):
 *     id: str
 *     taskId: str
 *     senderId: str
 *     senderName: str
 *     senderColor: str
 *     content: str
 *     timestamp: str
 * 
 * class ActivityLogCreate(BaseModel):
 *     id: str
 *     taskId: Optional[str] = None
 *     userId: str
 *     userName: str
 *     action: str
 *     timestamp: str
 *     details: Optional[str] = None
 * 
 * # In-memory DB / Replace with SQL Alchemy/PostgreSQL/SQLite as needed
 * db_tasks = []
 * db_users = {
 *     "admin@pinobite.com": {
 *         "email": "admin@pinobite.com",
 *         "name": "Workspace Admin",
 *         "password": "Password123!",
 *         "securityQuestion": "What was the name of your first pet?",
 *         "securityAnswer": "buddy"
 *     }
 * }
 * db_comments = []
 * db_activity_logs = []
 * 
 * @app.get("/api/tasks", response_model=List[TaskCreate])
 * def get_tasks():
 *     return db_tasks
 * 
 * @app.post("/api/tasks", status_code=status.HTTP_201_CREATED)
 * def save_task(task: TaskCreate):
 *     # Remove duplicate if exists, then append
 *     global db_tasks
 *     db_tasks = [t for t in db_tasks if t["id"] != task.id]
 *     db_tasks.append(task.dict())
 *     return task
 * 
 * @app.delete("/api/tasks/{task_id}")
 * def delete_task(task_id: str):
 *     global db_tasks
 *     db_tasks = [t for t in db_tasks if t["id"] != task_id]
 *     return {"message": f"Task {task_id} deleted successfully"}
 * 
 * @app.post("/api/tasks/bulk-delete")
 * def bulk_delete_tasks(task_ids: List[str]):
 *     global db_tasks
 *     db_tasks = [t for t in db_tasks if t["id"] not in task_ids]
 *     return {"message": "Bulk tasks deleted successfully"}
 * 
 * @app.post("/api/auth/register")
 * def register(user: UserRegister):
 *     email_key = user.email.lower().strip()
 *     if email_key in db_users:
 *         raise HTTPException(status_code=400, detail="User already exists")
 *     db_users[email_key] = user.dict()
 *     return {"email": user.email, "name": user.name}
 * 
 * @app.post("/api/auth/login")
 * def login(credentials: UserLogin):
 *     email_key = credentials.email.lower().strip()
 *     user = db_users.get(email_key)
 *     if not user or user["password"] != credentials.password:
 *         raise HTTPException(status_code=401, detail="Invalid email or password")
 *     return {"email": user["email"], "name": user["name"]}
 * 
 * @app.get("/api/comments", response_model=List[CommentCreate])
 * def get_comments(task_id: Optional[str] = None):
 *     if task_id:
 *         return [c for c in db_comments if c["taskId"] == task_id]
 *     return db_comments
 * 
 * @app.post("/api/comments")
 * def add_comment(comment: CommentCreate):
 *     db_comments.append(comment.dict())
 *     return comment
 * 
 * @app.get("/api/activity-logs", response_model=List[ActivityLogCreate])
 * def get_activity_logs():
 *     return db_activity_logs
 * 
 * @app.post("/api/activity-logs")
 * def add_activity_log(log: ActivityLogCreate):
 *     db_activity_logs.insert(0, log.dict())
 *     return log
 * ```
 */

const BACKEND_URL = (import.meta as any).env?.VITE_FASTAPI_BACKEND_URL || '';

// Logs active backend environment status
if (BACKEND_URL) {
  console.log(`🔌 Pinobite Workspace: Connected to FastAPI backend at: ${BACKEND_URL}`);
} else {
  console.log('📦 Pinobite Workspace: Operating in LocalStorage offline-first mode.');
}

/**
 * Executes a fetch helper with standard headers and error handling
 */
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  if (!BACKEND_URL) return null;
  
  const url = `${BACKEND_URL.replace(/\/$/, '')}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.detail || `API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (err) {
    console.error(`🚨 FastAPI request failure [${endpoint}]:`, err);
    throw err;
  }
}

export const ApiClient = {
  /**
   * Check if backend is plugged in
   */
  isBackendActive(): boolean {
    return !!BACKEND_URL;
  },

  // =========================================================================
  // TASK ENDPOINTS
  // =========================================================================

  async getTasks(): Promise<Task[]> {
    if (this.isBackendActive()) {
      try {
        const tasks = await fetchAPI<Task[]>('/api/tasks');
        if (tasks) return tasks;
      } catch (e) {
        console.warn('Falling back to local storage due to connection error.');
      }
    }
    
    // LocalStorage Fallback
    const stored = localStorage.getItem('pinobite_tasks');
    return stored ? JSON.parse(stored) : [];
  },

  async saveTask(task: Task): Promise<Task> {
    if (this.isBackendActive()) {
      try {
        const saved = await fetchAPI<Task>('/api/tasks', {
          method: 'POST',
          body: JSON.stringify(task),
        });
        if (saved) return saved;
      } catch (e) {
        console.warn('Falling back to local storage due to connection error.');
      }
    }
    
    // LocalStorage Fallback
    const stored = localStorage.getItem('pinobite_tasks');
    const tasks: Task[] = stored ? JSON.parse(stored) : [];
    const updated = tasks.filter(t => t.id !== task.id);
    updated.push(task);
    localStorage.setItem('pinobite_tasks', JSON.stringify(updated));
    return task;
  },

  async deleteTask(taskId: string): Promise<boolean> {
    if (this.isBackendActive()) {
      try {
        await fetchAPI<{ message: string }>(`/api/tasks/${taskId}`, {
          method: 'DELETE',
        });
        return true;
      } catch (e) {
        console.warn('Falling back to local storage due to connection error.');
      }
    }
    
    // LocalStorage Fallback
    const stored = localStorage.getItem('pinobite_tasks');
    if (stored) {
      const tasks: Task[] = JSON.parse(stored);
      const filtered = tasks.filter(t => t.id !== taskId);
      localStorage.setItem('pinobite_tasks', JSON.stringify(filtered));
    }
    return true;
  },

  async bulkDeleteTasks(taskIds: string[]): Promise<boolean> {
    if (this.isBackendActive()) {
      try {
        await fetchAPI<{ message: string }>('/api/tasks/bulk-delete', {
          method: 'POST',
          body: JSON.stringify(taskIds),
        });
        return true;
      } catch (e) {
        console.warn('Falling back to local storage due to connection error.');
      }
    }
    
    // LocalStorage Fallback
    const stored = localStorage.getItem('pinobite_tasks');
    if (stored) {
      const tasks: Task[] = JSON.parse(stored);
      const filtered = tasks.filter(t => !taskIds.includes(t.id));
      localStorage.setItem('pinobite_tasks', JSON.stringify(filtered));
    }
    return true;
  },

  // =========================================================================
  // AUTHENTICATION ENDPOINTS
  // =========================================================================

  async registerUser(payload: UserSession & { password: string }): Promise<{ email: string; name: string }> {
    if (this.isBackendActive()) {
      const response = await fetchAPI<{ email: string; name: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (response) return response;
    }
    
    // LocalStorage Fallback
    const storedUsers = localStorage.getItem('pinobite_users');
    const users = storedUsers ? JSON.parse(storedUsers) : {};
    const emailKey = payload.email.toLowerCase().trim();
    if (users[emailKey]) {
      throw new Error('User already exists');
    }
    users[emailKey] = payload;
    localStorage.setItem('pinobite_users', JSON.stringify(users));
    return { email: payload.email, name: payload.name };
  },

  async loginUser(payload: { email: string; password: string }): Promise<{ email: string; name: string }> {
    if (this.isBackendActive()) {
      const response = await fetchAPI<{ email: string; name: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (response) return response;
    }
    
    // LocalStorage Fallback
    const storedUsers = localStorage.getItem('pinobite_users');
    if (!storedUsers) throw new Error('Invalid email or password.');
    const users = JSON.parse(storedUsers);
    const user = users[payload.email.toLowerCase().trim()];
    if (user && user.password === payload.password) {
      return { email: user.email, name: user.name };
    }
    throw new Error('Invalid email or password.');
  },

  // =========================================================================
  // INTEGRATED CHAT ENDPOINTS
  // =========================================================================

  async getComments(taskId?: string): Promise<Comment[]> {
    if (this.isBackendActive()) {
      try {
        const query = taskId ? `?task_id=${taskId}` : '';
        const list = await fetchAPI<Comment[]>(`/api/comments${query}`);
        if (list) return list;
      } catch (e) {
        console.warn('Falling back to local storage due to connection error.');
      }
    }
    
    // LocalStorage Fallback
    const stored = localStorage.getItem('pinobite_comments');
    const comments: Comment[] = stored ? JSON.parse(stored) : [];
    if (taskId) {
      return comments.filter(c => c.taskId === taskId);
    }
    return comments;
  },

  async saveComment(comment: Comment): Promise<Comment> {
    if (this.isBackendActive()) {
      try {
        const saved = await fetchAPI<Comment>('/api/comments', {
          method: 'POST',
          body: JSON.stringify(comment),
        });
        if (saved) return saved;
      } catch (e) {
        console.warn('Falling back to local storage due to connection error.');
      }
    }
    
    // LocalStorage Fallback
    const stored = localStorage.getItem('pinobite_comments');
    const comments: Comment[] = stored ? JSON.parse(stored) : [];
    const updated = comments.filter(c => c.id !== comment.id);
    updated.push(comment);
    localStorage.setItem('pinobite_comments', JSON.stringify(updated));
    return comment;
  },

  // =========================================================================
  // ACTIVITY LOGS ENDPOINTS
  // =========================================================================

  async getActivityLogs(): Promise<ActivityLog[]> {
    if (this.isBackendActive()) {
      try {
        const logs = await fetchAPI<ActivityLog[]>('/api/activity-logs');
        if (logs) return logs;
      } catch (e) {
        console.warn('Falling back to local storage due to connection error.');
      }
    }
    
    // LocalStorage Fallback
    const stored = localStorage.getItem('pinobite_logs');
    return stored ? JSON.parse(stored) : [];
  },

  async addActivityLog(log: ActivityLog): Promise<ActivityLog> {
    if (this.isBackendActive()) {
      try {
        const saved = await fetchAPI<ActivityLog>('/api/activity-logs', {
          method: 'POST',
          body: JSON.stringify(log),
        });
        if (saved) return saved;
      } catch (e) {
        console.warn('Falling back to local storage due to connection error.');
      }
    }
    
    // LocalStorage Fallback
    const stored = localStorage.getItem('pinobite_logs');
    const logs: ActivityLog[] = stored ? JSON.parse(stored) : [];
    const updated = [log, ...logs.filter(l => l.id !== log.id)];
    localStorage.setItem('pinobite_logs', JSON.stringify(updated));
    return log;
  },

  // =========================================================================
  // TEAM MEMBERS & ONBOARDING ENDPOINTS
  // =========================================================================

  async getTeamMembers(): Promise<import('./types').TeamMember[]> {
    if (this.isBackendActive()) {
      try {
        const members = await fetchAPI<import('./types').TeamMember[]>('/api/team-members');
        if (members) return members;
      } catch (e) {
        console.warn('Falling back to local storage for team members.');
      }
    }

    const stored = localStorage.getItem('pinobite_team_members');
    const { INITIAL_TEAM } = await import('./data/team');
    if (stored) {
      return JSON.parse(stored);
    }
    localStorage.setItem('pinobite_team_members', JSON.stringify(INITIAL_TEAM));
    return INITIAL_TEAM;
  },

  async saveTeamMember(member: import('./types').TeamMember): Promise<import('./types').TeamMember> {
    if (this.isBackendActive()) {
      try {
        const saved = await fetchAPI<import('./types').TeamMember>('/api/team-members', {
          method: 'POST',
          body: JSON.stringify(member),
        });
        if (saved) return saved;
      } catch (e) {
        console.warn('Falling back to local storage for team members.');
      }
    }

    const members = await this.getTeamMembers();
    const updated = members.filter(m => m.id !== member.id);
    updated.push(member);
    localStorage.setItem('pinobite_team_members', JSON.stringify(updated));
    return member;
  },

  async deleteTeamMember(memberId: string): Promise<boolean> {
    if (this.isBackendActive()) {
      try {
        await fetchAPI<{ message: string }>(`/api/team-members/${memberId}`, {
          method: 'DELETE',
        });
        return true;
      } catch (e) {
        console.warn('Falling back to local storage for team members.');
      }
    }

    const members = await this.getTeamMembers();
    const filtered = members.filter(m => m.id !== memberId);
    localStorage.setItem('pinobite_team_members', JSON.stringify(filtered));
    return true;
  },

  // =========================================================================
  // SOCIAL MEDIA MARKETING ENDPOINTS
  // =========================================================================

  async getSocialPosts(): Promise<import('./types').SocialMediaPost[]> {
    if (this.isBackendActive()) {
      try {
        const posts = await fetchAPI<import('./types').SocialMediaPost[]>('/api/social-posts');
        if (posts) return posts;
      } catch (e) {
        console.warn('Falling back to local storage for social posts.');
      }
    }

    const stored = localStorage.getItem('pinobite_social_posts');
    const { INITIAL_SOCIAL_POSTS } = await import('./data/socialMediaData');
    if (stored) {
      return JSON.parse(stored);
    }
    localStorage.setItem('pinobite_social_posts', JSON.stringify(INITIAL_SOCIAL_POSTS));
    return INITIAL_SOCIAL_POSTS;

  },

  async saveSocialPost(post: import('./types').SocialMediaPost): Promise<import('./types').SocialMediaPost> {
    if (this.isBackendActive()) {
      try {
        const saved = await fetchAPI<import('./types').SocialMediaPost>('/api/social-posts', {
          method: 'POST',
          body: JSON.stringify(post),
        });
        if (saved) return saved;
      } catch (e) {
        console.warn('Falling back to local storage for social posts.');
      }
    }

    const posts = await this.getSocialPosts();
    const updated = posts.filter(p => p.id !== post.id);
    updated.push(post);
    localStorage.setItem('pinobite_social_posts', JSON.stringify(updated));
    return post;
  },

  async deleteSocialPost(postId: string): Promise<boolean> {
    if (this.isBackendActive()) {
      try {
        await fetchAPI<{ message: string }>(`/api/social-posts/${postId}`, {
          method: 'DELETE',
        });
        return true;
      } catch (e) {
        console.warn('Falling back to local storage for social posts.');
      }
    }

    const posts = await this.getSocialPosts();
    const filtered = posts.filter(p => p.id !== postId);
    localStorage.setItem('pinobite_social_posts', JSON.stringify(filtered));
    return true;
  }
};

