import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app, get_db
import models

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    models.Base.metadata.create_all(bind=engine)
    yield
    models.Base.metadata.drop_all(bind=engine)
def test_default_webapi():
    response = client.get("/")
    assert response.json() == {"message": "Welcome to the TodoWebsite API! This API provides endpoints for managing todo items and user accounts. Please refer to the documentation for more details on how to use the API."}
def test_ping_api():
    response = client.get("/api/v1/ping")
    assert response.status_code == 200
    assert response.json() == {"message": "ok", "status": 200}
def test_create_task():
    response = client.post("/api/v1/tasks", json={"title": "Học Test Coverage", "priority": "High"})
    assert response.status_code == 201
    data = response.json()["data"]
    assert data["title"] == "Học Test Coverage"
    assert data["priority"] == "High"
def test_get_all_tasks():
    client.post("/api/v1/tasks", json={"title": "Task 1", "priority": "Low"})
    response = client.get("/api/v1/tasks")
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) == 1
    assert data[0]["title"] == "Task 1"
def test_update_task_success():
    create_res = client.post("/api/v1/tasks", json={"title": "Cũ", "priority": "Low"})
    task_id = create_res.json()["data"]["id"]
    update_res = client.put(f"/api/v1/tasks/{task_id}", json={
        "title": "Mới",
        "priority": "Critical",
        "status": "Incomplete"
    })
    assert update_res.status_code == 200
    assert update_res.json()["data"]["title"] == "Mới"
def test_update_task_not_found():
    response = client.put("/api/v1/tasks/9999", json={"title": "SƠN TÙNG","priority":"Critical", "status":"Incomplete"})
    assert response.status_code == 404


def test_delete_task_success():
    create_res = client.post("/api/v1/tasks", json={"title": "Task cần xóa", "priority": "Low", "status":"Incomplete"})
    task_id = create_res.json()["data"]["id"]
    delete_res = client.delete(f"/api/v1/tasks/{task_id}")
    assert delete_res.status_code == 200
    get_res = client.get("/api/v1/tasks")
    tasks_list = get_res.json().get("data", [])
    assert all(task["id"] != task_id for task in tasks_list)
    
def test_delete_task_not_found():
    response = client.delete("/api/v1/tasks/9999")
    assert response.status_code == 404


def test_create_missingpriority_cannotcreate():
    response = client.post("/api/v1/tasks", json={"title": "TestingTheMissingPriority", "priority": ""})
    assert response.status_code == 400
def test_create_missingtitle_cannotcreate():
    response = client.post("/api/v1/tasks", json={"title": "","priority":"High"})
    assert response.status_code == 400
def test_create_missingbothtitleandpriority_cannotcreate():
    response = client.post("/api/v1/tasks", json={"title":"", "priority":""})
    assert response.status_code == 400
    assert response.status_code == 400
def test_create_statuscannotbeallowed_cannotcreate():
    response = client.post("/api/v1/tasks", json={"title":"Testing task2", "priority": "Critical", "status":"Completed"})
    assert response.status_code == 400
def test_create_statusisnotdefaultstatus_cannotcreate():
    response = client.post("/api/v1/tasks", json={"title":"Testing task2", "priority": "Critical", "status":"KAKAKAKAKA"})
    assert response.status_code == 400

def test_edit_dontchangeanything_cannotedit():
    create_res = client.post("/api/v1/tasks", json={"title": "Cũ", "priority": "Low", "status":"Incomplete"})
    task_id = create_res.json()["data"]["id"]
    update_res = client.put(f"/api/v1/tasks/{task_id}", json={
        "title": "Cũ",
        "priority": "Low",
        "status": "Incomplete"
    })
    assert update_res.status_code == 400
def test_edit_titlechanged_success():
    create_res = client.post("/api/v1/tasks", json={"title": "Cũ", "priority": "Low", "status":"Incomplete"})
    task_id = create_res.json()["data"]["id"]
    update_res = client.put(f"/api/v1/tasks/{task_id}", json={
        "title": "Mới",
        "priority": "Low",
        "status": "Incomplete"
    })
    assert update_res.status_code == 200
def test_edit_prioritychanged_sucess():
    create_res = client.post("/api/v1/tasks", json={"title": "Cũ", "priority": "Low", "status":"Incomplete"})
    task_id = create_res.json()["data"]["id"]
    update_res = client.put(f"/api/v1/tasks/{task_id}", json={
        "title": "Cũ",
        "priority": "Critical",
        "status": "Incomplete"
    })
    assert update_res.status_code == 200
def test_edit_statuschanged_sucess():
    create_res = client.post("/api/v1/tasks", json={"title": "Cũ", "priority": "Low", "status":"Incomplete"})
    task_id = create_res.json()["data"]["id"]
    update_res = client.put(f"/api/v1/tasks/{task_id}", json={
        "title": "Cũ",
        "priority": "Low",
        "status": "Completed"
    })
    assert update_res.status_code == 200
def test_edit_priorityandtitlechanged_sucess():
    create_res = client.post("/api/v1/tasks", json={"title": "Cũ", "priority": "Low", "status":"Incomplete"})
    task_id = create_res.json()["data"]["id"]
    update_res = client.put(f"/api/v1/tasks/{task_id}", json={
        "title": "Mới",
        "priority": "Critical",
        "status": "Incomplete"
    })
    assert update_res.status_code == 200
def test_create_prioritynotallowed_cannotcreate():
    response = client.post("/api/v1/tasks", json={"title":"New task","priority":"KAKAKAKAKA"})
    assert response.status_code == 400
def test_create_statusnotallowed_cannotcreate():
    response = client.post("/api/v1/tasks", json={"title":"New Task","priority":"Critical","status":"kakaak"})
    assert response.status_code == 400
def test_read_root_success():
    response = client.get("/")
    assert response.status_code == 200
    expected_message = {
        "message": "Welcome to the TodoWebsite API! This API provides endpoints for managing todo items and user accounts. Please refer to the documentation for more details on how to use the API."
    }
    assert response.json() == expected_message