import os
import uuid
import sqlite3
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

DB_PATH = "tripme.db"
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI()

# allow browser dev (MVP)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    # 1. Districts Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS districts (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        province TEXT
    )
    """)
    
    # 2. Categories Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        slug TEXT UNIQUE NOT NULL
    )
    """)
    
    # 3. District-Categories Mapping
    cur.execute("""
    CREATE TABLE IF NOT EXISTS district_categories (
        district_id TEXT,
        category_id TEXT,
        PRIMARY KEY (district_id, category_id),
        FOREIGN KEY (district_id) REFERENCES districts (id),
        FOREIGN KEY (category_id) REFERENCES categories (id)
    )
    """)

    # 4. Places Table (Updated with category_id and district_id)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS places (
        id TEXT PRIMARY KEY,
        country TEXT DEFAULT 'Sri Lanka',
        district_id TEXT,
        category_id TEXT,
        name TEXT NOT NULL,
        description TEXT,
        lat REAL,
        lng REAL,
        cost_min INTEGER,
        cost_max INTEGER,
        is_indoor INTEGER,
        rain_note TEXT,
        safety_note TEXT,
        created_at TEXT,
        duration_min INTEGER,
        best_time TEXT,
        open_hours TEXT,
        closed_day TEXT,
        tags TEXT,
        crowd_level TEXT,
        noise_level TEXT,
        ticket_price INTEGER,
        food_avg_per_person INTEGER,
        parking_fee INTEGER,
        extra_cost_notes TEXT,
        address TEXT,
        nearby_places TEXT,
        safety_level TEXT,
        safety_reason TEXT,
        scam_warning TEXT,
        dress_code_req INTEGER,
        special_rules TEXT,
        wheelchair_access INTEGER,
        stairs_heavy INTEGER,
        long_walk TEXT,
        toilets INTEGER,
        parking_avail INTEGER,
        food_nearby INTEGER,
        cash_only INTEGER,
        mobile_signal TEXT,
        outdoor_heavy INTEGER,
        rain_sensitivity TEXT,
        best_season TEXT,
        monsoon_note TEXT,
        data_source TEXT,
        verified INTEGER,
        last_verified_at TEXT,
        status TEXT,
        admin_notes TEXT,
        ai_summary TEXT,
        source_id TEXT,
        embedding_text TEXT,
        FOREIGN KEY (district_id) REFERENCES districts (id),
        FOREIGN KEY (category_id) REFERENCES categories (id),
        UNIQUE(name, district_id, country)
    )
    """)

    # 5. Place Images
    cur.execute("""
    CREATE TABLE IF NOT EXISTS place_images (
        id TEXT PRIMARY KEY,
        place_id TEXT,
        image_path TEXT,
        created_at TEXT,
        caption TEXT,
        image_type TEXT,
        is_cover INTEGER,
        FOREIGN KEY (place_id) REFERENCES places (id)
    )
    """)

    conn.commit()
    seed_data(conn)
    conn.close()

def seed_data(conn):
    cur = conn.cursor()
    
    # 1. Seed Categories (Global List)
    cats = [
        ("Heritage & Culture", "heritage_culture"),
        ("Temples & Religious", "temple_religious"),
        ("Nature & Scenic", "nature_scenic"),
        ("Wildlife & Safari", "wildlife_safari"),
        ("Beach & Coastal", "beach_coastal"),
        ("Waterfalls & Rivers", "waterfall_river"),
        ("Hiking & Viewpoints", "hiking_viewpoints"),
        ("Adventure & Outdoor", "adventure_outdoor"),
        ("Museums & Indoor", "museum_indoor"),
        ("Food & Cafés", "food_cafe"),
        ("City & Shopping", "city_shopping"),
        ("Family & Kids", "family_kids"),
        ("Hotels & Stays", "hotels_stays"),
        ("Nightlife", "nightlife")
    ]
    cat_map = {} # slug -> id
    for name, slug in cats:
        cid = str(uuid.uuid5(uuid.NAMESPACE_DNS, slug))
        cur.execute("INSERT OR IGNORE INTO categories (id, name, slug) VALUES (?, ?, ?)", (cid, name, slug))
        cat_map[slug] = cid

    # 2. Seed Districts (25 Districts)
    districts = [
        ("Ampara", "Eastern"), ("Anuradhapura", "North Central"), ("Badulla", "Uva"),
        ("Batticaloa", "Eastern"), ("Colombo", "Western"), ("Galle", "Southern"),
        ("Gampaha", "Western"), ("Hambantota", "Southern"), ("Jaffna", "Northern"),
        ("Kalutara", "Western"), ("Kandy", "Central"), ("Kegalle", "Sabaragamuwa"),
        ("Kilinochchi", "Northern"), ("Kurunegala", "North Western"), ("Mannar", "Northern"),
        ("Matale", "Central"), ("Matara", "Southern"), ("Moneragala", "Uva"),
        ("Mullaitivu", "Northern"), ("Nuwara Eliya", "Central"), ("Polonnaruwa", "North Central"),
        ("Puttalam", "North Western"), ("Ratnapura", "Sabaragamuwa"), ("Trincomalee", "Eastern"),
        ("Vavuniya", "Northern")
    ]
    district_map = {} # name -> id
    for name, province in districts:
        did = str(uuid.uuid5(uuid.NAMESPACE_DNS, name.lower()))
        cur.execute("INSERT OR IGNORE INTO districts (id, name, province) VALUES (?, ?, ?)", (did, name, province))
        district_map[name] = did

    # 3. Seed District-Category Mapping
    mappings = {
        "Ampara": ["beach_coastal", "nature_scenic", "wildlife_safari", "waterfall_river", "adventure_outdoor", "food_cafe", "hotels_stays"],
        "Anuradhapura": ["heritage_culture", "temple_religious", "nature_scenic", "museum_indoor", "food_cafe", "family_kids", "hotels_stays"],
        "Badulla": ["nature_scenic", "hiking_viewpoints", "waterfall_river", "adventure_outdoor", "museum_indoor", "food_cafe", "hotels_stays"],
        "Batticaloa": ["beach_coastal", "nature_scenic", "heritage_culture", "adventure_outdoor", "food_cafe", "hotels_stays", "family_kids"],
        "Colombo": ["city_shopping", "food_cafe", "museum_indoor", "heritage_culture", "family_kids", "nightlife", "hotels_stays", "temple_religious"],
        "Galle": ["beach_coastal", "heritage_culture", "museum_indoor", "food_cafe", "city_shopping", "family_kids", "hotels_stays", "adventure_outdoor"],
        "Gampaha": ["nature_scenic", "temple_religious", "heritage_culture", "food_cafe", "family_kids", "waterfall_river", "hotels_stays"],
        "Hambantota": ["wildlife_safari", "beach_coastal", "nature_scenic", "adventure_outdoor", "family_kids", "food_cafe", "hotels_stays"],
        "Jaffna": ["heritage_culture", "temple_religious", "beach_coastal", "nature_scenic", "food_cafe", "city_shopping", "hotels_stays"],
        "Kalutara": ["beach_coastal", "nature_scenic", "temple_religious", "food_cafe", "family_kids", "hotels_stays", "adventure_outdoor"],
        "Kandy": ["heritage_culture", "temple_religious", "nature_scenic", "hiking_viewpoints", "museum_indoor", "food_cafe", "family_kids", "hotels_stays"],
        "Kegalle": ["nature_scenic", "hiking_viewpoints", "waterfall_river", "adventure_outdoor", "family_kids", "food_cafe", "hotels_stays"],
        "Kilinochchi": ["nature_scenic", "beach_coastal", "heritage_culture", "food_cafe", "hotels_stays", "family_kids"],
        "Kurunegala": ["heritage_culture", "temple_religious", "nature_scenic", "hiking_viewpoints", "food_cafe", "family_kids", "hotels_stays"],
        "Mannar": ["beach_coastal", "nature_scenic", "heritage_culture", "adventure_outdoor", "food_cafe", "hotels_stays"],
        "Matale": ["nature_scenic", "hiking_viewpoints", "heritage_culture", "temple_religious", "waterfall_river", "food_cafe", "hotels_stays"],
        "Matara": ["beach_coastal", "nature_scenic", "adventure_outdoor", "food_cafe", "family_kids", "hotels_stays", "heritage_culture"],
        "Moneragala": ["wildlife_safari", "nature_scenic", "hiking_viewpoints", "waterfall_river", "adventure_outdoor", "food_cafe", "hotels_stays"],
        "Mullaitivu": ["beach_coastal", "nature_scenic", "heritage_culture", "food_cafe", "hotels_stays", "family_kids"],
        "Nuwara Eliya": ["nature_scenic", "hiking_viewpoints", "waterfall_river", "heritage_culture", "museum_indoor", "food_cafe", "hotels_stays", "family_kids"],
        "Polonnaruwa": ["heritage_culture", "temple_religious", "nature_scenic", "museum_indoor", "food_cafe", "family_kids", "hotels_stays"],
        "Puttalam": ["beach_coastal", "nature_scenic", "wildlife_safari", "adventure_outdoor", "food_cafe", "hotels_stays", "family_kids"],
        "Ratnapura": ["nature_scenic", "waterfall_river", "hiking_viewpoints", "adventure_outdoor", "heritage_culture", "food_cafe", "hotels_stays"],
        "Trincomalee": ["beach_coastal", "nature_scenic", "adventure_outdoor", "heritage_culture", "food_cafe", "hotels_stays", "family_kids"],
        "Vavuniya": ["heritage_culture", "temple_religious", "nature_scenic", "food_cafe", "family_kids", "hotels_stays"]
    }

    for dname, slugs in mappings.items():
        did = district_map.get(dname)
        if did:
            for slug in slugs:
                cid = cat_map.get(slug)
                if cid:
                    cur.execute("INSERT OR IGNORE INTO district_categories (district_id, category_id) VALUES (?, ?)", (did, cid))

    conn.commit()

init_db()

# --- API Endpoints ---

@app.get("/api/districts")
async def get_districts():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("SELECT * FROM districts ORDER BY name ASC")
    rows = cur.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/api/districts/{district_id}/categories")
async def get_district_categories(district_id: str):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("""
        SELECT c.* FROM categories c
        JOIN district_categories dc ON c.id = dc.category_id
        WHERE dc.district_id = ?
    """, (district_id,))
    rows = cur.fetchall()
    conn.close()
    return [dict(r) for r in rows]

class NewCategory(BaseModel):
    name: str
    district_id: str

@app.post("/api/categories")
async def add_category(data: NewCategory):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    slug = data.name.lower().replace(" ", "-")
    cat_id = str(uuid.uuid4())
    
    try:
        # Check if category exists globally
        cur.execute("SELECT id FROM categories WHERE slug = ?", (slug,))
        row = cur.fetchone()
        if row:
            cat_id = row[0]
        else:
            cur.execute("INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)", (cat_id, data.name, slug))
        
        # Map to district
        cur.execute("INSERT OR IGNORE INTO district_categories (district_id, category_id) VALUES (?, ?)", (data.district_id, cat_id))
        conn.commit()
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=str(e))
    
    conn.close()
    return {"ok": True, "category_id": cat_id, "name": data.name}

@app.post("/api/places")
async def add_place(
    country: str = Form("Sri Lanka"),
    district_id: str = Form(""),
    category_id: str = Form(""),
    name: str = Form(""),
    description: str = Form(""),
    lat: str = Form(""),
    lng: str = Form(""),
    cost_min: str = Form("0"),
    cost_max: str = Form("0"),
    is_indoor: str = Form("false"),
    rain_note: str = Form(""),
    safety_note: str = Form(""),
    duration_min: str = Form("0"),
    best_time: str = Form(""),
    open_hours: str = Form(""),
    closed_day: str = Form(""),
    tags: str = Form(""),
    crowd_level: str = Form(""),
    noise_level: str = Form(""),
    ticket_price: str = Form("0"),
    food_avg_per_person: str = Form("0"),
    parking_fee: str = Form("0"),
    extra_cost_notes: str = Form(""),
    address: str = Form(""),
    nearby_places: str = Form(""),
    safety_level: str = Form(""),
    safety_reason: str = Form(""),
    scam_warning: str = Form(""),
    dress_code_req: str = Form("false"),
    special_rules: str = Form(""),
    wheelchair_access: str = Form("false"),
    stairs_heavy: str = Form("false"),
    long_walk: str = Form(""),
    toilets: str = Form("false"),
    parking_avail: str = Form("false"),
    food_nearby: str = Form("false"),
    cash_only: str = Form("false"),
    mobile_signal: str = Form(""),
    outdoor_heavy: str = Form("false"),
    rain_sensitivity: str = Form(""),
    best_season: str = Form(""),
    monsoon_note: str = Form(""),
    data_source: str = Form("user"),
    verified: str = Form("false"),
    status: str = Form("pending_review"),
    admin_notes: str = Form(""),
    ai_summary: str = Form(""),
    source_id: str = Form(""),
    images: list[UploadFile] = File(default=[]),
    image_captions: list[str] = Form([]),
    image_types: list[str] = Form([]),
    image_covers: list[str] = Form([]),
):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Duplicate check
    cur.execute("SELECT id FROM places WHERE name = ? AND district_id = ? AND country = ?", (name, district_id, country))
    if cur.fetchone():
        conn.close()
        raise HTTPException(status_code=409, detail="A place with this name already exists in this district.")

    place_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    # parse types
    lat_v = float(lat) if lat else None
    lng_v = float(lng) if lng else None
    
    cur.execute("""
    INSERT INTO places (
        id, country, district_id, category_id, name, description, lat, lng,
        cost_min, cost_max, is_indoor, rain_note, safety_note, created_at,
        duration_min, best_time, open_hours, closed_day, tags, crowd_level,
        noise_level, ticket_price, food_avg_per_person, parking_fee,
        extra_cost_notes, address, nearby_places, safety_level,
        safety_reason, scam_warning, dress_code_req, special_rules,
        wheelchair_access, stairs_heavy, long_walk, toilets,
        parking_avail, food_nearby, cash_only, mobile_signal,
        outdoor_heavy, rain_sensitivity, best_season, monsoon_note,
        data_source, verified, last_verified_at, status, admin_notes, ai_summary, source_id, embedding_text
    )
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, (
        place_id, country, district_id, category_id, name, description, lat_v, lng_v,
        int(cost_min or 0), int(cost_max or 0), 1 if is_indoor.lower()=="true" else 0,
        rain_note, safety_note, now, int(duration_min or 0), best_time, open_hours, closed_day,
        tags, crowd_level, noise_level, int(ticket_price or 0), int(food_avg_per_person or 0),
        int(parking_fee or 0), extra_cost_notes, address, nearby_places, safety_level,
        safety_reason, scam_warning, 1 if dress_code_req.lower()=="true" else 0, special_rules,
        1 if wheelchair_access.lower()=="true" else 0, 1 if stairs_heavy.lower()=="true" else 0,
        long_walk, 1 if toilets.lower()=="true" else 0, 1 if parking_avail.lower()=="true" else 0,
        1 if food_nearby.lower()=="true" else 0, 1 if cash_only.lower()=="true" else 0,
        mobile_signal, 1 if outdoor_heavy.lower()=="true" else 0, rain_sensitivity,
        best_season, monsoon_note, data_source, 1 if verified.lower()=="true" else 0,
        None, status, admin_notes, ai_summary, source_id, None
    ))

    saved_images = []
    for i, img in enumerate(images[:5]):
        ext = os.path.splitext(img.filename)[1].lower() or ".jpg"
        img_id = str(uuid.uuid4())
        filename = f"{place_id}_{img_id}{ext}"
        path = os.path.join(UPLOAD_DIR, filename)

        with open(path, "wb") as f:
            f.write(await img.read())

        cap = image_captions[i] if i < len(image_captions) else ""
        itype = image_types[i] if i < len(image_types) else ""
        icover = 1 if (i < len(image_covers) and image_covers[i].lower() == "true") else 0

        cur.execute("""
        INSERT INTO place_images (id, place_id, image_path, created_at, caption, image_type, is_cover)
        VALUES (?,?,?,?,?,?,?)
        """, (img_id, place_id, path, now, cap, itype, icover))
        saved_images.append(path)

    conn.commit()
    conn.close()
    return {"ok": True, "place_id": place_id, "saved_images": saved_images}

# --- Export Endpoints ---

@app.get("/api/export/places.json")
async def export_json(status: Optional[str] = "approved"):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    
    query = "SELECT * FROM places"
    params = []
    if status:
        query += " WHERE status = ?"
        params.append(status)
    
    cur.execute(query, params)
    rows = cur.fetchall()
    
    res = []
    for r in rows:
        d = dict(r)
        # Fetch images
        cur.execute("SELECT image_path, caption, image_type, is_cover FROM place_images WHERE place_id = ?", (d['id'],))
        d['images'] = [dict(img) for img in cur.fetchall()]
        res.append(d)
        
    conn.close()
    return res

@app.get("/api/export/places.csv")
async def export_csv(status: Optional[str] = "approved"):
    import csv
    import io
    from fastapi.responses import StreamingResponse
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    
    query = "SELECT * FROM places"
    params = []
    if status:
        query += " WHERE status = ?"
        params.append(status)
    
    cur.execute(query, params)
    rows = cur.fetchall()
    
    if not rows:
        conn.close()
        return StreamingResponse(io.StringIO(""), media_type="text/csv")

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=rows[0].keys())
    writer.writeheader()
    for row in rows:
        writer.writerow(dict(row))
    
    output.seek(0)
    conn.close()
    
    return StreamingResponse(
        output, 
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=places_export_{datetime.now().strftime('%Y%m%d')}.csv"}
    )
