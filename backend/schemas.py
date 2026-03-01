from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class CategoryBase(BaseModel):
    name: str
    slug: str

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: str

    class Config:
        orm_mode = True

class DistrictBase(BaseModel):
    name: str
    province: Optional[str] = None

class DistrictCreate(DistrictBase):
    pass

class District(DistrictBase):
    id: str
    categories: List[Category] = []

    class Config:
        orm_mode = True

class PlaceImageBase(BaseModel):
    image_path: str
    caption: Optional[str] = None
    image_type: Optional[str] = None
    is_cover: Optional[bool] = False

class PlaceImage(PlaceImageBase):
    id: str
    place_id: str
    created_at: datetime

    class Config:
        orm_mode = True

class PlaceBase(BaseModel):
    country: str = "Sri Lanka"
    district_id: str
    category_id: str # Refactored from string 'category'
    name: str
    description: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    
    # Financials
    cost_min: Optional[int] = None
    cost_max: Optional[int] = None
    ticket_price: Optional[int] = None
    food_avg_per_person: Optional[int] = None
    parking_fee: Optional[int] = None
    extra_cost_notes: Optional[str] = None
    
    # Time & Duration
    duration_min: Optional[int] = None
    best_time: Optional[str] = None
    open_hours: Optional[str] = None
    closed_day: Optional[str] = None
    
    # Tags & Vibe
    tags: Optional[str] = None
    crowd_level: Optional[str] = None
    noise_level: Optional[str] = None
    
    # Location
    address: Optional[str] = None
    nearby_places: Optional[str] = None
    
    # Safety & Rules
    safety_level: Optional[str] = None
    safety_reason: Optional[str] = None
    scam_warning: Optional[str] = None
    dress_code_req: Optional[bool] = False
    special_rules: Optional[str] = None
    
    # Access & Facilities
    wheelchair_access: Optional[bool] = False
    stairs_heavy: Optional[bool] = False
    long_walk: Optional[str] = None
    toilets: Optional[bool] = False
    parking_avail: Optional[bool] = False
    food_nearby: Optional[bool] = False
    cash_only: Optional[bool] = False
    mobile_signal: Optional[str] = None
    
    # Weather
    is_indoor: Optional[bool] = False
    outdoor_heavy: Optional[bool] = False
    rain_sensitivity: Optional[str] = None
    rain_note: Optional[str] = None
    best_season: Optional[str] = None
    monsoon_note: Optional[str] = None
    
    # Quality & AI
    data_source: Optional[str] = "user"
    source_id: Optional[str] = None
    verified: Optional[bool] = False
    last_verified_at: Optional[datetime] = None
    status: Optional[str] = "pending_review"
    admin_notes: Optional[str] = None
    ai_summary: Optional[str] = None
    embedding_text: Optional[str] = None

class PlaceCreate(PlaceBase):
    pass

class Place(PlaceBase):
    id: str
    created_at: datetime
    images: List[PlaceImage] = []
    district: Optional[District] = None
    category: Optional[Category] = None

    class Config:
        orm_mode = True
