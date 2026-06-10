from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel

app = FastAPI(
    title= "Test for turtorial Python fastapi",
    description="This is turtorial of Liam, create in local Memory and how to create a calculator",
    version="1.0.0",
)

class User(BaseModel):
    username: str
    password: str
account = {}
@app.get("/")
async def root():
    return {"messsage":"testing"}
@app.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user :User):
    if not user.username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=("The field username is required")
        )
    if not user.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The password field is required"
        )
    user_id = len(account)+1
    account[user_id] = user
    return {"id": user_id,"username":user.username,"password":user.password}
@app.get("/api/v1/login",status_code=status.HTTP_200_OK)
async def users(username:str, passwrod:str):
    if username in account and passwrod in account:
        return {"message":"Login successfully"}
