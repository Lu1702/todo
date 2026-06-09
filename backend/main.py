from fastapi import FastAPI, status, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

import models
from database import SessionLocal, engine

app = FastAPI(
    title="API for TodoWebsite",
    description="This is the API for the TodoWebsite project. It provides endpoints for managing todo items and managing user accounts.",
    version="1.0.0",
)

models.Base.metadata.create_all(bind=engine)

origin = [
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origin,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
class TaskCreate(BaseModel):
    title: str
    priority: str 
    status: str ="Incomplete"
class TaskUpdate(TaskCreate):
    title: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
@app.get("/")
async def root():
    return {"message": "Welcome to the TodoWebsite API! This API provides endpoints for managing todo items and user accounts. Please refer to the documentation for more details on how to use the API."}

@app.get("/api/v1/ping")
async def ping():
    return {"message": "ok", "status": 200}

@app.post("/api/v1/tasks", status_code=status.HTTP_201_CREATED)
async def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    if not task.title:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task can not miss a title"
        )
    if task.status == "Completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This task have not created before!"
        )
    if not task.priority:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing the priority for this task"
        )
    if task.priority not in ["Critical", "High", "Medium", "Low"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Priority just can be Critical, High, Medium or Low"
        )
    if task.status != "Incomplete":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task create with default status (Incomplete)"
        )
    new_task = models.Task(
        title=task.title,
        priority=task.priority,
        status=task.status
    )    
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return {
        "status": 201,
        "message": "Task created successfully",
        "data": new_task
    }
@app.get("/api/v1/tasks")
async def get_tasks(db: Session = Depends(get_db)):
    tasks = db.query(models.Task).all()
    if not tasks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty task right now!!"
        )
    return {
        "status": 200,
        "message": "Tasks retrieved successfully",
        "data": tasks
    }
@app.put("/api/v1/tasks/{task_id}")
async def update_task(task_id: int, task_update: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    isNameChanged = task.title is not None and task_update.title != task.title
    isPriorityChanged = task.priority is not None and task_update.priority != task.priority
    isStatusChanged = task.status is not None and task_update.status != task.status
    if not (isNameChanged or isPriorityChanged or isStatusChanged):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nothing Changed"
        )
    if task_update.status != task.status and task_update.title != task.title:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You need to change the name first and check done this task later"
        )
    if isPriorityChanged and isStatusChanged:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You need to change the priority first and check done this task later"
        )
    if task_update.title is not None:
        task.title = task_update.title
    if task_update.priority is not None:
        task.priority = task_update.priority
    if task_update.status is not None:
        task.status = task_update.status
    db.commit()
    db.refresh(task)
    return {
        "status": 200,
        "message": "Task updated successfully",
        "data": task
    }
@app.delete("/api/v1/tasks/{task_id}")
async def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    db.delete(task)
    db.commit()
    return {
        "status": 200,
        "message": "Task deleted successfully"
    }