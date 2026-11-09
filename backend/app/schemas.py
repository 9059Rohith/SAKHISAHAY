from datetime import datetime
from typing import Literal, TypeVar

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from .core.security import valid_password


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class Signup(Strict):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    _password = field_validator("password")(valid_password)


class Login(Strict):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class EmailInput(Strict):
    email: EmailStr


class Reset(Strict):
    email: EmailStr
    token: str = Field(min_length=10, max_length=200)
    new_password: str
    _password = field_validator("new_password")(valid_password)


class ChangePassword(Strict):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str
    _password = field_validator("new_password")(valid_password)


class Verify(Strict):
    token: str = Field(min_length=10, max_length=200)


class Profile(Strict):
    full_name: str = Field(min_length=2, max_length=100)


class UserOut(BaseModel):
    id: str
    full_name: str
    email: str
    role: Literal["user", "admin"]
    is_verified: bool
    created_at: datetime


class SessionOut(BaseModel):
    user: UserOut
    recovery_code: str | None = None
    verification_email_sent: bool | None = None


class Message(BaseModel):
    message: str


class ContactIn(Strict):
    name: str = Field(min_length=2, max_length=100)
    phone: str = Field(pattern=r"^[6-9]\d{9}$")
    relationship: Literal["Family", "Friend", "Guardian", "Other"]


class DocumentOut(BaseModel):
    id: str
    created_at: datetime
    updated_at: datetime


class ContactOut(DocumentOut, ContactIn):
    model_config = ConfigDict(extra="ignore")


class ReportIn(Strict):
    title: str = Field(min_length=3, max_length=160)
    category: Literal["online", "stalking", "verbal", "physical", "workplace", "other"]
    description: str = Field(min_length=10, max_length=10000)
    incident_at: datetime
    location: str = Field(default="", max_length=300)

    @field_validator("incident_at")
    @classmethod
    def timezone_required(cls, value):
        if value.tzinfo is None:
            raise ValueError("Include a timezone in incident_at")
        return value


class ReportUpdate(ReportIn):
    status: Literal["draft", "recorded", "closed"]
    version: int = Field(ge=1)


class ReportOut(DocumentOut, ReportIn):
    model_config = ConfigDict(extra="ignore")
    status: Literal["draft", "recorded", "closed"]
    version: int


class Coordinates(Strict):
    latitude: float = Field(ge=-90, le=90, allow_inf_nan=False)
    longitude: float = Field(ge=-180, le=180, allow_inf_nan=False)
    accuracy: float | None = Field(default=None, ge=0, le=100000, allow_inf_nan=False)


class ShareOut(DocumentOut, Coordinates):
    model_config = ConfigDict(extra="ignore")
    expires_at: datetime
    revoked: bool = False
    token: str | None = None


class PublicShare(BaseModel):
    latitude: float
    longitude: float
    accuracy: float | None
    updated_at: datetime
    expires_at: datetime


class ChatIn(Strict):
    message: str = Field(min_length=1, max_length=500)
    language: Literal["en", "kn"] = "en"


class ChatOut(DocumentOut):
    role: Literal["user", "assistant"]
    text: str
    language: Literal["en", "kn"]


class ChatPair(BaseModel):
    user: ChatOut
    assistant: ChatOut


class AlertIn(Strict):
    message: str = Field(min_length=1, max_length=1000)
    coordinates: Coordinates | None = None
    idempotency_key: str = Field(min_length=10, max_length=100)


class AlertOut(DocumentOut):
    message: str
    coordinates: Coordinates | None = None
    status: Literal["active", "resolved"]
    contacts: list[ContactOut] = Field(default_factory=list)


T = TypeVar("T")


class Page[T](BaseModel):
    items: list[T]
    total: int
    page: int
    page_size: int
    pages: int


class AdminSummary(BaseModel):
    users: int
    contacts: int
    reports: int
    alerts: int


class Health(BaseModel):
    status: str


class Version(BaseModel):
    version: str
    git_sha: str
    build_time: str
