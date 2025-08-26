
from fastapi import FastAPI, Depends, HTTPException, Header
from pydantic import BaseModel
from passlib.context import CryptContext
from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from typing import Generator, Optional
from datetime import datetime, timedelta
import uuid
import os
from dotenv import load_dotenv

# FastAPI app
app = FastAPI()

# Load environment variables from a .env file if present
load_dotenv()
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "app_db")

DATABASE_URL = (
    f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    future=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)
Base = declarative_base()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class User(BaseModel):
    username: str
    password: str

class UserDB(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)

class SessionDB(Base):
    __tablename__ = "sessions"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    expiry = Column(DateTime, nullable=False)

# Auto-create tables on startup (dev convenience)
Base.metadata.create_all(bind=engine)

# ---- DB token helpers (no JWT) ----
TOKEN_HEADER = "Authorization"

def extract_token(auth_header: Optional[str]) -> str:
    if not auth_header:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    parts = auth_header.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    if len(parts) == 1:
        return parts[0]
    raise HTTPException(status_code=401, detail="Invalid Authorization header")

def get_current_session(authorization: Optional[str] = Header(None, alias=TOKEN_HEADER),
                        db: Session = Depends(get_db)) -> "SessionDB":
    token = extract_token(authorization)
    session = db.query(SessionDB).filter(SessionDB.id == token).first()
    if not session or session.expiry < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return session

def get_current_user(session: "SessionDB" = Depends(get_current_session),
                     db: Session = Depends(get_db)) -> "UserDB":
    user = db.query(UserDB).filter(UserDB.id == session.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
        
@app.post("/register")
def register_endpoint(user: User, db: Session = Depends(get_db)):
    hashed = pwd_context.hash(user.password)
    db_user = UserDB(username=user.username, password=hashed)
    db.add(db_user)
    db.commit()
    return {"msg": "registered"}


@app.post("/login")
def login_endpoint(user: User, db: Session = Depends(get_db)):
    db_user = db.query(UserDB).filter(UserDB.username == user.username).first()
    if not db_user or not pwd_context.verify(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    session_id = str(uuid.uuid4())
    expiry = datetime.utcnow() + timedelta(hours=1)
    db.add(SessionDB(id=session_id, user_id=db_user.id, expiry=expiry))
    db.commit()
    return {"session_token": session_id}

@app.get("/me")
def me_endpoint(current_user: UserDB = Depends(get_current_user)):
    return {"id": current_user.id, "username": current_user.username}

@app.post("/refresh")
def refresh_endpoint(session: SessionDB = Depends(get_current_session), db: Session = Depends(get_db)):
    new_session_id = str(uuid.uuid4())
    session.id = new_session_id
    session.expiry = datetime.utcnow() + timedelta(hours=1)
    db.commit()
    return {"session_token": new_session_id}

@app.post("/logout")
def logout_endpoint(session: SessionDB = Depends(get_current_session), db: Session = Depends(get_db)):
    db.delete(session)
    db.commit()
    return {"msg": "Logged out successfully"}

@app.get("/sessions")
def list_sessions_endpoint(current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    sessions = db.query(SessionDB).filter(SessionDB.user_id == current_user.id).all()
    return [{"id": s.id, "expiry": s.expiry.isoformat()} for s in sessions]

@app.delete("/sessions/{id}")
def revoke_session_endpoint(id: str, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(SessionDB).filter(SessionDB.id == id, SessionDB.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()
    return {"msg": "Session revoked"}

