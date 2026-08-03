import uvicorn

if __name__ == "__main__":
    print("🚀 Starting Pinobite FastAPI Backend Server with SQLite Database...")
    print("📍 Interactive Swagger Docs: http://localhost:8000/docs")
    print("📍 ReDoc Documentation: http://localhost:8000/redoc")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
