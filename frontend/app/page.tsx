"use client";

import React, { useState, FormEvent, ChangeEvent, useEffect } from 'react';

type ImageMeta = {
  file: File;
  caption: string;
  type: string;
  isCover: boolean;
};

type District = {
  id: string;
  name: string;
};

type Category = {
  id: string;
  name: string;
};

export default function Home() {
  const [formData, setFormData] = useState({
    country: 'Sri Lanka', district_id: '', name: '', category_id: '', description: '',
    duration_min: '', best_time: '', open_hours: '', closed_day: '',
    lat: '', lng: '', address: '', nearby_places: '',
    crowd_level: '', noise_level: '',
    cost_min: '', cost_max: '', ticket_price: '', food_avg_per_person: '', parking_fee: '', extra_cost_notes: '',
    is_indoor: false, outdoor_heavy: false, rain_sensitivity: '', best_season: '', monsoon_note: '', rain_note: '',
    wheelchair_access: false, stairs_heavy: false, long_walk: '', toilets: false, parking_avail: false, food_nearby: false, cash_only: false, mobile_signal: '',
    safety_level: '', safety_reason: '', scam_warning: '', dress_code_req: false, special_rules: '',
    data_source: 'user', verified: false, status: 'pending_review', admin_notes: '', ai_summary: ''
  });

  const [districts, setDistricts] = useState<District[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [tags, setTags] = useState<string[]>([]);
  const [images, setImages] = useState<ImageMeta[]>([]);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Fetch Districts on Load
  useEffect(() => {
    fetch('http://localhost:8000/api/districts')
      .then(res => res.json())
      .then(data => setDistricts(data))
      .catch(err => console.error("Failed to fetch districts", err));
  }, []);

  // Fetch Categories when District Changes
  useEffect(() => {
    if (formData.district_id) {
      fetch(`http://localhost:8000/api/districts/${formData.district_id}/categories`)
        .then(res => res.json())
        .then(data => {
          setCategories(data);
          setFormData(prev => ({ ...prev, category_id: '' })); // Reset category on district change
          setIsAddingCategory(false);
        })
        .catch(err => console.error("Failed to fetch categories", err));
    } else {
      setCategories([]);
    }
  }, [formData.district_id]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));

      // Handle the "Add New" trigger in dropdown
      if (name === 'category_id' && value === 'ADD_NEW') {
        setIsAddingCategory(true);
        setFormData(prev => ({ ...prev, category_id: '' }));
      }
    }
  };

  const handleAddNewCategory = async () => {
    if (!newCategoryName || !formData.district_id) return;
    try {
      const res = await fetch('http://localhost:8000/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName, district_id: formData.district_id })
      });
      const result = await res.json();
      if (result.ok) {
        const newCat = { id: result.category_id, name: result.name };
        setCategories(prev => [...prev, newCat]);
        setFormData(prev => ({ ...prev, category_id: result.category_id }));
        setIsAddingCategory(false);
        setNewCategoryName('');
      }
    } catch (err) {
      alert("Failed to add category");
    }
  };

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (images.length + selectedFiles.length > 5) {
        setSubmitStatus('error');
        setMessage('You can only upload up to 5 images.');
        return;
      }
      const newImages = selectedFiles.map(file => ({
        file, caption: '', type: 'outdoor', isCover: images.length === 0
      }));
      setImages(prev => [...prev, ...newImages]);
      setSubmitStatus('idle');
    }
  };

  const updateImageMeta = (index: number, field: keyof ImageMeta, value: any) => {
    const newImages = [...images];
    if (field === 'isCover' && value === true) {
      newImages.forEach(img => img.isCover = false); // only one cover
    }
    newImages[index] = { ...newImages[index], [field]: value };
    setImages(newImages);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const fillCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData(prev => ({
          ...prev,
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6)
        }));
        alert("Location filled from browser!");
      }, () => {
        alert("Geolocation failed or permission denied.");
      });
    } else {
      alert("Geolocation not supported by this browser.");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.district_id || !formData.category_id) {
      alert("Please select District and Category");
      return;
    }
    setSubmitStatus('loading');

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value.toString());
      });
      data.append('tags', tags.join(','));

      images.forEach(img => {
        data.append('images', img.file);
        data.append('image_captions', img.caption);
        data.append('image_types', img.type);
        data.append('image_covers', img.isCover.toString());
      });

      const res = await fetch('http://localhost:8000/api/places', {
        method: 'POST',
        body: data,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to save place');
      }

      const result = await res.json();
      setSubmitStatus('success');
      setMessage('Place successfully Added! DB ID: ' + result.place_id);
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err: any) {
      console.error(err);
      setSubmitStatus('error');
      setMessage(err.message || 'Something went wrong');
    }
  };

  const TAGS_LIST = ['family-friendly', 'couple', 'solo', 'kids', 'senior-friendly', 'adventure', 'budget-friendly', 'luxury'];

  return (
    <main className="container">
      <div className="header">
        <h1>TripMe.ai Portal</h1>
        <p>Comprehensive Data Collection for Context-Aware AI</p>
      </div>

      {submitStatus === 'success' && <div className="alert alert-success" style={{ marginBottom: '2rem' }}>{message}</div>}
      {submitStatus === 'error' && <div className="alert alert-error" style={{ marginBottom: '2rem' }}>{message}</div>}

      <form onSubmit={handleSubmit}>

        <div className="glass-panel">
          <h2 className="section-title">1. Basic Details</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Country</label>
              <select name="country" value={formData.country} onChange={handleInputChange} required>
                <option value="Sri Lanka">Sri Lanka</option>
              </select>
            </div>
            <div className="form-group">
              <label>District</label>
              <select name="district_id" value={formData.district_id} onChange={handleInputChange} required>
                <option value="" disabled>Select District</option>
                {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Place Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Category</label>
              {!isAddingCategory ? (
                <select name="category_id" value={formData.category_id} onChange={handleInputChange} required disabled={!formData.district_id}>
                  <option value="" disabled>{!formData.district_id ? 'Select District First' : 'Select Category'}</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  {formData.district_id && <option value="ADD_NEW">+ Add New Category</option>}
                </select>
              ) : (
                <div style={{ display: 'flex', gap: '5px' }}>
                  <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Enter New Category..." autoFocus />
                  <button type="button" onClick={handleAddNewCategory} className="tag-btn active" style={{ padding: '0 10px' }}>Add</button>
                  <button type="button" onClick={() => setIsAddingCategory(false)} className="tag-btn" style={{ padding: '0 10px' }}>✕</button>
                </div>
              )}
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} placeholder="Full description for catalog..."></textarea>
          </div>
        </div>

        {/* ... Sections 2-10 remains same, but references formData correctly ... */}
        {/* Note: I'm keeping the rest of the form sections as they were in the previous version, just ensuring the logic is connected */}

        <div className="glass-panel">
          <h2 className="section-title">2. Time & Schedules (AI Itinerary)</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Recommended Duration (Minutes)</label>
              <input type="number" name="duration_min" value={formData.duration_min} onChange={handleInputChange} placeholder="E.g. 90" />
            </div>
            <div className="form-group">
              <label>Best Time to Visit</label>
              <select name="best_time" value={formData.best_time} onChange={handleInputChange}>
                <option value="">Anytime</option>
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Sunset">Sunset</option>
                <option value="Night">Night</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Open Hours</label>
              <input type="text" name="open_hours" value={formData.open_hours} onChange={handleInputChange} placeholder="E.g. 08:00 AM - 05:00 PM or 24/7" />
            </div>
            <div className="form-group">
              <label>Closed Day</label>
              <input type="text" name="closed_day" value={formData.closed_day} onChange={handleInputChange} placeholder="E.g. Monday, Poya Days" />
            </div>
          </div>
        </div>

        <div className="glass-panel">
          <h2 className="section-title">3. Location & Nearby</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Latitude</label>
              <input type="number" step="any" name="lat" value={formData.lat} onChange={handleInputChange} placeholder="6.9271" />
            </div>
            <div className="form-group">
              <label>Longitude</label>
              <input type="number" step="any" name="lng" value={formData.lng} onChange={handleInputChange} placeholder="79.8612" />
              <button type="button" className="btn-location" onClick={fillCurrentLocation}>📍 Use My Current Location</button>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Short Address / City</label>
              <input type="text" name="address" value={formData.address} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label>Nearby Landmark (For AI Clustering)</label>
              <input type="text" name="nearby_places" value={formData.nearby_places} onChange={handleInputChange} placeholder="E.g. Near Kandy Lake" />
            </div>
          </div>
        </div>

        <div className="glass-panel">
          <h2 className="section-title">4. Attributes & Vibe</h2>
          <div className="form-group">
            <label>Tags (Multi-select)</label>
            <div className="tags-container">
              {TAGS_LIST.map(t => (
                <button type="button" key={t} onClick={() => toggleTag(t)} className={`tag-btn ${tags.includes(t) ? 'active' : ''}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Crowd Level</label>
              <select name="crowd_level" value={formData.crowd_level} onChange={handleInputChange}>
                <option value="">Select</option>
                <option value="low">Low (Quiet)</option>
                <option value="medium">Medium</option>
                <option value="high">High (Busy)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Noise Level</label>
              <select name="noise_level" value={formData.noise_level} onChange={handleInputChange}>
                <option value="">Select</option>
                <option value="quiet">Quiet</option>
                <option value="normal">Normal</option>
                <option value="loud">Loud</option>
              </select>
            </div>
          </div>
        </div>

        <div className="glass-panel">
          <h2 className="section-title">5. Financials (LKR)</h2>
          <div className="form-row-3">
            <div className="form-group">
              <label>Budget Min</label>
              <input type="number" name="cost_min" value={formData.cost_min} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label>Budget Max</label>
              <input type="number" name="cost_max" value={formData.cost_max} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label>Ticket Price (Exact)</label>
              <input type="number" name="ticket_price" value={formData.ticket_price} onChange={handleInputChange} />
            </div>
          </div>
          <div className="form-row-3">
            <div className="form-group">
              <label>Avg Food Person</label>
              <input type="number" name="food_avg_per_person" value={formData.food_avg_per_person} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label>Parking Fee</label>
              <input type="number" name="parking_fee" value={formData.parking_fee} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label>Extra Cost Notes</label>
              <input type="text" name="extra_cost_notes" value={formData.extra_cost_notes} onChange={handleInputChange} placeholder="E.g. Boat fee Rs. 500" />
            </div>
          </div>
        </div>

        <div className="glass-panel">
          <h2 className="section-title">6. Weather & Environment</h2>
          <div className="checkbox-grid">
            <div className="checkbox-item">
              <input type="checkbox" id="is_indoor" name="is_indoor" checked={formData.is_indoor} onChange={handleInputChange} />
              <label htmlFor="is_indoor">Has Indoor Area</label>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" id="outdoor_heavy" name="outdoor_heavy" checked={formData.outdoor_heavy} onChange={handleInputChange} />
              <label htmlFor="outdoor_heavy">Outdoor Heavy</label>
            </div>
          </div>

          <div className="form-row" style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label>Rain Sensitivity</label>
              <select name="rain_sensitivity" value={formData.rain_sensitivity} onChange={handleInputChange}>
                <option value="">Select</option>
                <option value="low">Low (Fine in rain)</option>
                <option value="medium">Medium</option>
                <option value="high">High (Ruined by rain)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Best Season</label>
              <input type="text" name="best_season" value={formData.best_season} onChange={handleInputChange} placeholder="E.g. Dec - March" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Rain Plan Note</label>
              <input type="text" name="rain_note" value={formData.rain_note} onChange={handleInputChange} placeholder="E.g. Visit museum instead" />
            </div>
            <div className="form-group">
              <label>Monsoon Warning</label>
              <input type="text" name="monsoon_note" value={formData.monsoon_note} onChange={handleInputChange} placeholder="E.g. Road floods heavily" />
            </div>
          </div>
        </div>

        <div className="glass-panel">
          <h2 className="section-title">7. Safety & Rules</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Safety Level</label>
              <select name="safety_level" value={formData.safety_level} onChange={handleInputChange}>
                <option value="">Select</option>
                <option value="safe">Safe</option>
                <option value="caution">Caution</option>
                <option value="avoid_night">Avoid at Night</option>
              </select>
            </div>
            <div className="form-group">
              <label>Safety Reason / Scam Warning</label>
              <input type="text" name="safety_reason" value={formData.safety_reason} onChange={handleInputChange} placeholder="E.g. Pickpockets in crowd" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Special Rules</label>
              <input type="text" name="special_rules" value={formData.special_rules} onChange={handleInputChange} placeholder="E.g. No shoes inside, ID needed" />
            </div>
          </div>
          <div className="checkbox-grid">
            <div className="checkbox-item">
              <input type="checkbox" id="dress_code_req" name="dress_code_req" checked={formData.dress_code_req} onChange={handleInputChange} />
              <label htmlFor="dress_code_req">Dress Code Required (Cover knees/shoulders)</label>
            </div>
          </div>
        </div>

        <div className="glass-panel">
          <h2 className="section-title">8. Accessibility & Facilities</h2>
          <div className="checkbox-grid">
            <div className="checkbox-item">
              <input type="checkbox" id="wheelchair_access" name="wheelchair_access" checked={formData.wheelchair_access} onChange={handleInputChange} />
              <label htmlFor="wheelchair_access">Wheelchair Accessible</label>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" id="stairs_heavy" name="stairs_heavy" checked={formData.stairs_heavy} onChange={handleInputChange} />
              <label htmlFor="stairs_heavy">Heavy Stairs</label>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" id="toilets" name="toilets" checked={formData.toilets} onChange={handleInputChange} />
              <label htmlFor="toilets">Toilets Available</label>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" id="parking_avail" name="parking_avail" checked={formData.parking_avail} onChange={handleInputChange} />
              <label htmlFor="parking_avail">Parking Available</label>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" id="food_nearby" name="food_nearby" checked={formData.food_nearby} onChange={handleInputChange} />
              <label htmlFor="food_nearby">Food Nearby</label>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" id="cash_only" name="cash_only" checked={formData.cash_only} onChange={handleInputChange} />
              <label htmlFor="cash_only">Cash Only Venue</label>
            </div>
          </div>
          <div className="form-row" style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label>Long Walk Needed?</label>
              <select name="long_walk" value={formData.long_walk} onChange={handleInputChange}>
                <option value="">Select</option>
                <option value="none">No (Park & enter)</option>
                <option value="short">Short Hike (15m)</option>
                <option value="long">Long Hike (1h+)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Mobile Signal</label>
              <select name="mobile_signal" value={formData.mobile_signal} onChange={handleInputChange}>
                <option value="">Select</option>
                <option value="good">Good 4G</option>
                <option value="poor">Poor/No Signal</option>
              </select>
            </div>
          </div>
        </div>

        <div className="glass-panel">
          <h2 className="section-title">9. Quality & AI Engine</h2>
          <div className="form-group">
            <label>🤖 Strict AI Summary (2 Lines max)</label>
            <textarea name="ai_summary" value={formData.ai_summary} onChange={handleInputChange} rows={2}
              placeholder="E.g. Historic temple, busy afternoons, best early morning. Dress modestly and beware of monkeys. No cash machines nearby."></textarea>
          </div>
          <div className="form-row-3">
            <div className="form-group">
              <label>Data Source</label>
              <select name="data_source" value={formData.data_source} onChange={handleInputChange}>
                <option value="user">User Submitted</option>
                <option value="staff">Staff Visit</option>
                <option value="web">Web Research</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={formData.status} onChange={handleInputChange}>
                <option value="pending_review">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center' }}>
              <div className="checkbox-item" style={{ marginTop: '20px', width: '100%' }}>
                <input type="checkbox" id="verified" name="verified" checked={formData.verified} onChange={handleInputChange} />
                <label htmlFor="verified">Expert Verified?</label>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>Admin Notes</label>
            <input type="text" name="admin_notes" value={formData.admin_notes} onChange={handleInputChange} />
          </div>
        </div>

        <div className="glass-panel">
          <h2 className="section-title">10. Media Uploads</h2>
          <div className="file-upload" onClick={() => document.getElementById('file-upload')?.click()}>
            <div className="file-upload-icon">📸</div>
            <p>Click to browse images (Max 5)</p>
            <input id="file-upload" type="file" accept="image/*" multiple onChange={handleImageChange} />
          </div>

          {images.length > 0 && (
            <div className="file-list">
              {images.map((img, index) => (
                <div key={index} className="file-item">
                  <div className="file-item-header">
                    <span>🖼️ {img.file.name}</span>
                    <button type="button" onClick={() => removeImage(index)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontWeight: 'bold' }}>Remove ✕</button>
                  </div>
                  <div className="file-item-meta">
                    <div>
                      <label style={{ fontSize: '0.8rem' }}>Caption / Description</label>
                      <input type="text" value={img.caption} onChange={e => updateImageMeta(index, 'caption', e.target.value)} placeholder="E.g. Main Entrance" />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem' }}>Image Type</label>
                      <select value={img.type} onChange={e => updateImageMeta(index, 'type', e.target.value)}>
                        <option value="outdoor">Outdoor / View</option>
                        <option value="indoor">Indoor / Detail</option>
                        <option value="food">Food / Menu</option>
                        <option value="entrance">Entrance / Sign</option>
                      </select>
                    </div>
                  </div>
                  <div className="checkbox-item" style={{ marginTop: '1rem', border: 'none', padding: 0, background: 'none' }}>
                    <input type="checkbox" id={`cover-${index}`} checked={img.isCover} onChange={e => updateImageMeta(index, 'isCover', e.target.checked)} />
                    <label htmlFor={`cover-${index}`}>Set as Location Cover Image</label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="submit-panel">
          <button type="submit" className="btn-submit" disabled={submitStatus === 'loading'}>
            {submitStatus === 'loading' ? <div className="spinner"></div> : '💾 Save Completely to TripMe.ai Database'}
          </button>
        </div>

      </form>
    </main>
  );
}
