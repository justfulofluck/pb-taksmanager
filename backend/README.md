# 🐍 Pinobite Workspace FastAPI & SQLite Backend

This is the Python **FastAPI** backend for the **Pinobite Task Manager** platform using **SQLite** as the database engine via **SQLAlchemy 2.0 ORM**.

## 📁 Architecture Overview

- `main.py`: FastAPI application entry point, CORS configuration, lifecycle table generation, and REST endpoint routes.
- `database.py`: SQLAlchemy database engine setup (`sqlite:///./pinobite_workspace.db`), session maker, foreign key enforcer, and dependency injector.
- `models.py`: Relational database ORM models corresponding to `databse-schema.txt`.
- `schemas.py`: Pydantic V2 request & response validation schemas.
- `crud.py`: Database query functions for Tasks, Team Members, Auth, Comments, Activity Logs, and Social Media Posts.
- `seed_data.py`: Seed script populating initial default workspace admin and sprint tasks.
- `run.py`: Server launcher script using `uvicorn`.

---

## 🚀 How to Run Locally

### 1. Create Virtual Environment & Install Dependencies

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Start FastAPI Server

```bash
python3 run.py
```
Or:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The server will automatically:
- Create the SQLite database file `pinobite_workspace.db`
- Generate all 11 relational tables matching `databse-schema.txt`
- Seed initial workspace admin credentials & default sprint tasks
- Listen on `http://localhost:8000`

---

## 🔗 Interactive API Documentation

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🔌 Connecting Frontend to FastAPI Backend

To point the React frontend to this FastAPI backend, set the environment variable in `frontend/.env.local`:

```env
VITE_FASTAPI_BACKEND_URL=http://localhost:8000
```

When this variable is set, the React application will automatically stream real-time data to/from SQLite via FastAPI!
