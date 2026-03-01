from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, DateTime, UniqueConstraint, Table
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from database import Base

# Many-to-Many association table for District and Categories
district_categories = Table(
    'district_categories',
    Base.metadata,
    Column('district_id', String, ForeignKey('districts.id'), primary_key=True),
    Column('category_id', String, ForeignKey('categories.id'), primary_key=True)
)

def generate_uuid():
    return str(uuid.uuid4())

class District(Base):
    __tablename__ = "districts"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    name = Column(String, unique=True, index=True, nullable=False)
    province = Column(String, nullable=True) # Adding back the province field if it was there
    
    # Relationships
    places = relationship("Place", back_populates="district")
    categories = relationship("Category", secondary=district_categories, back_populates="districts")

class Category(Base):
    __tablename__ = "categories"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    name = Column(String, unique=True, index=True, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    
    # Relationships
    places = relationship("Place", back_populates="category")
    districts = relationship("District", secondary=district_categories, back_populates="categories")

class Place(Base):
    __tablename__ = "places"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    country = Column(String, default="Sri Lanka")
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    
    # FKs
    district_id = Column(String, ForeignKey("districts.id"))
    category_id = Column(String, ForeignKey("categories.id")) # Refactored from string 'category'
    
    district = relationship("District", back_populates="places")
    category = relationship("Category", back_populates="places")
    images = relationship("PlaceImage", back_populates="place")

    # Financials
    cost_min = Column(Integer, nullable=True)
    cost_max = Column(Integer, nullable=True)
    ticket_price = Column(Integer, nullable=True)
    food_avg_per_person = Column(Integer, nullable=True)
    parking_fee = Column(Integer, nullable=True)
    extra_cost_notes = Column(String, nullable=True)
    
    # Time & Duration
    duration_min = Column(Integer, nullable=True)
    best_time = Column(String, nullable=True)
    open_hours = Column(String, nullable=True)
    closed_day = Column(String, nullable=True)
    
    # Tags & Vibe
    tags = Column(String, nullable=True)
    crowd_level = Column(String, nullable=True)
    noise_level = Column(String, nullable=True)
    
    # Location
    address = Column(String, nullable=True)
    nearby_places = Column(String, nullable=True)
    
    # Safety & Rules
    safety_level = Column(String, nullable=True)
    safety_reason = Column(String, nullable=True)
    scam_warning = Column(String, nullable=True)
    dress_code_req = Column(Boolean, default=False)
    special_rules = Column(String, nullable=True)
    
    # Access & Facilities
    wheelchair_access = Column(Boolean, default=False)
    stairs_heavy = Column(Boolean, default=False)
    long_walk = Column(String, nullable=True)
    toilets = Column(Boolean, default=False)
    parking_avail = Column(Boolean, default=False)
    food_nearby = Column(Boolean, default=False)
    cash_only = Column(Boolean, default=False)
    mobile_signal = Column(String, nullable=True)
    
    # Weather
    is_indoor = Column(Boolean, default=False)
    outdoor_heavy = Column(Boolean, default=False)
    rain_sensitivity = Column(String, nullable=True)
    rain_note = Column(String, nullable=True)
    best_season = Column(String, nullable=True)
    monsoon_note = Column(String, nullable=True)
    
    # Quality & AI
    data_source = Column(String, default="user")
    source_id = Column(String, nullable=True) # Mapping to unique source (staff, web-link, scraper)
    verified = Column(Boolean, default=False)
    last_verified_at = Column(DateTime, nullable=True) # When was this data last checked
    status = Column(String, default="pending_review")
    admin_notes = Column(String, nullable=True)
    ai_summary = Column(String, nullable=True)
    embedding_text = Column(String, nullable=True) # Text blob designed for RAG/AI grounding

    __table_args__ = (UniqueConstraint('name', 'district_id', 'country', name='_name_district_country_uc'),)

    created_at = Column(DateTime, default=datetime.utcnow)

class PlaceImage(Base):
    __tablename__ = "place_images"
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    place_id = Column(String, ForeignKey("places.id"))
    image_path = Column(String, nullable=False)
    caption = Column(String, nullable=True)
    image_type = Column(String, nullable=True)
    is_cover = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    place = relationship("Place", back_populates="images")
