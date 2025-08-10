from pydantic import BaseModel
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy import Integer, String, Boolean, ForeignKey
from database import Base  # tämä tulee sinun database.py -tiedostosta
from typing import List, Optional

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    is_premium: Mapped[bool] = mapped_column(Boolean, default=True)

    videos: Mapped[List["Video"]] = relationship("Video", back_populates="user")


class UserCreate(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str

class VideoBase(BaseModel):
    title: str
    filename: str
    is_premium: bool

    class Config:
        from_attributes = True  # päivitetty Pydanticin V2-tyyliin

class Video(Base):
    __tablename__ = "videos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    filename: Mapped[str] = mapped_column(String, nullable=False)
    is_premium: Mapped[bool] = mapped_column(Boolean, default=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))

    user: Mapped["User"] = relationship("User", back_populates="videos")
