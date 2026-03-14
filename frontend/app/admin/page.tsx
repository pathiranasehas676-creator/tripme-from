"use client";

import React, { useState, useEffect, ChangeEvent } from 'react';
import Link from 'next/link';

type Place = {
  id: string;
  name: string;
  district_name: string;
  category_name: string;
  status: string;
  created_at: string;
  lat: number | null;
  lng: number | null;
  images: any[];
  thumbnail_path?: string;
};

type QualityReport = {
  missing_coordinates: any[];
  no_images: any[];
  no_cover_image: any[];
  no_safety_notes: any[];
  summary: {
    missing_coords_count: number;
    no_images_count: number;
    no_cover_count: number;
    no_safety_count: number;
  }
};

type District = { id: string; name: string };
type Category = { id: string; name: string };

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  const [places, setPlaces] = useState<Place[]>([]);
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [filters, setFilters] = useState({
    name: '',
    district_id: '',
    category_id: '',
    status: '',
    is_indoor: ''
  });

  const [loading, setLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);

  useEffect(() => {
    const auth = localStorage.getItem('tripme_admin_auth');
    if (auth === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchDistricts();
      fetchQualityReport();
      handleSearch(); // Initial load
    }
  }, [isLoggedIn]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple password for MVP: tripme2026
    if (password === 'admin123') {
      setIsLoggedIn(true);
      localStorage.setItem('tripme_admin_auth', 'true');
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('tripme_admin_auth');
  };

  const fetchDistricts = async () => {
    const res = await fetch('http://localhost:8000/api/districts');
    const data = await res.json();
    setDistricts(data);
  };

  const fetchQualityReport = async () => {
    const res = await fetch('http://localhost:8000/api/reports/quality');
    const data = await res.json();
    setQualityReport(data);
  };

  const handleSearch = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.name) params.append('name', filters.name);
    if (filters.district_id) params.append('district_id', filters.district_id);
    if (filters.category_id) params.append('category_id', filters.category_id);
    if (filters.status) params.append('status', filters.status);
    if (filters.is_indoor) params.append('is_indoor', filters.is_indoor);

    const res = await fetch(`http://localhost:8000/api/places?${params.toString()}`);
    const data = await res.json();
    setPlaces(data);
    setLoading(false);
  };

  const handleDelete = async (placeId: string) => {
    if (!confirm('Are you sure you want to delete this place and all its images?')) return;

    try {
      const res = await fetch(`http://localhost:8000/api/places/${placeId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setPlaces(prev => prev.filter(p => p.id !== placeId));
        fetchQualityReport(); // Update stats
      }
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete place.");
    }
  };

  const handleStatusUpdate = async (placeId: string, newStatus: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/places/${placeId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setPlaces(prev => prev.map(p => p.id === placeId ? { ...p, status: newStatus } : p));
        fetchQualityReport(); // Update stats
      }
    } catch (err) {
      console.error("Status update failed", err);
    }
  };

  const handleEditSave = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/places/${selectedPlace.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        setPlaces(prev => prev.map(p => p.id === selectedPlace.id ? { ...p, ...editForm } : p));
        setSelectedPlace({ ...selectedPlace, ...editForm });
        setIsEditing(false);
        fetchQualityReport();
      }
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  const handleEditToggle = () => {
    if (!isEditing) {
      // Initialize form with current data
      const { images, district_name, category_name, created_at, ...cleanData } = selectedPlace;
      setEditForm(cleanData);
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  };

  const handleEditChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? parseInt(value) || 0 : value;
    setEditForm((prev: any) => ({ ...prev, [name]: val }));
  };

  const handleImageDelete = async (imageId: number) => {
    if (!confirm('Are you sure you want to delete this image?')) return;
    try {
      const res = await fetch(`http://localhost:8000/api/places/${selectedPlace.id}/images/${imageId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const updatedImages = selectedPlace.images.filter((img: any) => img.id !== imageId);
        const updatedPlace = { ...selectedPlace, images: updatedImages };
        setSelectedPlace(updatedPlace);
        setPlaces(prev => prev.map(p => p.id === updatedPlace.id ? updatedPlace : p));
      }
    } catch (err) {
      console.error("Image delete failed", err);
    }
  };

  const handleSetCover = async (imageId: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/places/${selectedPlace.id}/images/${imageId}/cover`, {
        method: 'PATCH'
      });
      if (res.ok) {
        const data = await res.json();
        const updatedPlace = { ...selectedPlace, images: data.images };
        setSelectedPlace(updatedPlace);
        setPlaces(prev => prev.map(p => p.id === updatedPlace.id ? updatedPlace : p));
      }
    } catch (err) {
      console.error("Set cover failed", err);
    }
  };

  const handleAddImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const formData = new FormData();
    Array.from(e.target.files).forEach(file => {
      formData.append('images', file);
    });

    try {
      setLoading(true);
      const res = await fetch(`http://localhost:8000/api/places/${selectedPlace.id}/images`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        const updatedImages = [...selectedPlace.images, ...data.added_images];
        const updatedPlace = { ...selectedPlace, images: updatedImages };
        setSelectedPlace(updatedPlace);
        setPlaces(prev => prev.map(p => p.id === updatedPlace.id ? updatedPlace : p));
      }
    } catch (err) {
      console.error("Add images failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  if (!isLoggedIn) {
    return (
      <div className="admin-container login-gate">
        <style jsx>{`
                    .login-gate {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        background: radial-gradient(circle at top right, #1a1a2e, #16213e, #0f3460);
                    }
                    .login-card {
                        background: rgba(255, 255, 255, 0.05);
                        backdrop-filter: blur(20px);
                        padding: 3rem;
                        border-radius: 24px;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        width: 100%;
                        max-width: 400px;
                        text-align: center;
                    }
                    h1 {
                        color: #e94560;
                        margin-bottom: 2rem;
                    }
                    input {
                        width: 100%;
                        padding: 1rem;
                        background: rgba(0, 0, 0, 0.3);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 12px;
                        color: white;
                        margin-bottom: 1.5rem;
                        outline: none;
                    }
                    input:focus {
                        border-color: #e94560;
                    }
                    button {
                        width: 100%;
                        padding: 1rem;
                        background: #e94560;
                        color: white;
                        border: none;
                        border-radius: 12px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: 0.3s;
                    }
                    button:hover {
                        background: #ff2e63;
                        transform: translateY(-2px);
                    }
                    .error {
                        color: #ff4d4d;
                        margin-bottom: 1rem;
                        font-size: 0.9rem;
                    }
                    .back-link {
                        display: block;
                        margin-top: 1.5rem;
                        color: #aaa;
                        text-decoration: none;
                        font-size: 0.9rem;
                    }
                    .back-link:hover {
                        color: #fff;
                    }
                `}</style>
        <div className="login-card">
          <h1>Admin Login</h1>
          <form onSubmit={handleLogin}>
            {loginError && <div className="error">Incorrect password. Please try again.</div>}
            <input
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Login to Panel</button>
          </form>
          <Link href="/" className="back-link">← Back to Portal</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <style jsx>{`
        .admin-container {
          min-height: 100vh;
          background: radial-gradient(circle at top right, #1a1a2e, #16213e, #0f3460);
          color: #e94560;
          font-family: 'Inter', sans-serif;
          padding: 2rem;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .header h1 {
          font-size: 2rem;
          background: linear-gradient(45deg, #e94560, #ff2e63);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
        }

        .nav-btn {
          background: #e94560;
          color: white;
          padding: 0.8rem 1.5rem;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(233, 69, 96, 0.3);
        }

        .nav-btn:hover {
          transform: translateY(-2px);
          background: #ff2e63;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 2rem;
        }

        .sidebar {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
          padding: 1.5rem;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          height: fit-content;
        }

        .sidebar h2 {
          font-size: 1.2rem;
          margin-bottom: 1.5rem;
          color: #fff;
        }

        .filter-group {
          margin-bottom: 1.2rem;
        }

        .filter-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
          color: #aaa;
        }

        .filter-group input, .filter-group select {
          width: 100%;
          padding: 0.8rem;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: white;
          outline: none;
        }

        .search-btn {
          width: 100%;
          padding: 1rem;
          background: #0f3460;
          color: #fff;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.3s;
          margin-top: 1rem;
          border: 1px solid #e94560;
        }

        .search-btn:hover {
          background: #e94560;
        }

        .main-content {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .quality-report {
          background: rgba(233, 69, 96, 0.05);
          backdrop-filter: blur(12px);
          padding: 1.5rem;
          border-radius: 20px;
          border: 1px solid rgba(233, 69, 96, 0.2);
        }

        .report-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-top: 1rem;
        }

        .stat-card {
          background: rgba(0, 0, 0, 0.2);
          padding: 1rem;
          border-radius: 15px;
          text-align: center;
        }

        .stat-card h3 {
          font-size: 1.5rem;
          margin: 0;
          color: #e94560;
        }

        .stat-card p {
          font-size: 0.8rem;
          color: #aaa;
          margin: 0.5rem 0 0 0;
        }

        .places-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .place-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          overflow: hidden;
          transition: 0.3s;
        }

        .place-card:hover {
          transform: translateY(-5px);
          border-color: #e94560;
        }

        .place-card img {
          width: 100%;
          height: 180px;
          object-fit: cover;
        }

        .place-info {
          padding: 1.2rem;
        }

        .place-info h3 {
          margin: 0 0 0.5rem 0;
          color: #fff;
        }

        .badge {
          display: inline-block;
          padding: 0.3rem 0.6rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          margin-right: 0.5rem;
          background: rgba(233, 69, 96, 0.2);
          color: #e94560;
        }

        .status-badge {
          background: #0f3460;
          color: #4db8ff;
        }

        .status-approved {
          background: rgba(77, 255, 166, 0.2);
          color: #2ecc71;
        }

        .status-rejected {
          background: rgba(233, 69, 96, 0.2);
          color: #ff4d4d;
        }

        .place-footer {
          margin-top: 1rem;
          font-size: 0.8rem;
          color: #777;
          display: flex;
          justify-content: space-between;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 2rem;
        }

        .modal-content {
          background: #1a1a2e;
          border: 1px solid rgba(233, 69, 96, 0.3);
          border-radius: 24px;
          width: 100%;
          max-width: 900px;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          padding: 2rem;
          color: white;
        }

        .close-btn {
          position: sticky;
          top: 0;
          float: right;
          background: none;
          border: none;
          color: #e94560;
          font-size: 2rem;
          cursor: pointer;
          z-index: 10;
        }

        .image-gallery {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1rem;
          margin: 1.5rem 0;
        }

        .gallery-item {
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .gallery-item img {
          width: 100%;
          height: 150px;
          object-fit: cover;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-top: 2rem;
        }

        .detail-section h4 {
          color: #e94560;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 0.5rem;
          margin-bottom: 1rem;
        }

        .detail-item {
          margin-bottom: 0.8rem;
          font-size: 0.9rem;
        }

        .detail-item strong {
          color: #aaa;
          margin-right: 0.5rem;
        }
      `}</style>

      <div className="header">
        <h1>TripMe.ai Admin Portal</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/" className="nav-btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
            ← Back to Portal
          </Link>
          <button onClick={handleLogout} className="nav-btn" style={{ background: '#e94560', border: 'none', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        <aside className="sidebar">
          <h2>Filters & Actions</h2>
          <div className="filter-group">
            <label>Search Name</label>
            <input name="name" value={filters.name} onChange={handleFilterChange} placeholder="e.g. Temple..." />
          </div>
          <div className="filter-group">
            <label>District</label>
            <select name="district_id" value={filters.district_id} onChange={handleFilterChange}>
              <option value="">All Districts</option>
              {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Status</label>
            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">All Statuses</option>
              <option value="pending_review">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <button className="search-btn" onClick={handleSearch} disabled={loading}>
            {loading ? 'Searching...' : 'Search Places'}
          </button>

          <button className="search-btn" style={{ marginTop: '1rem', background: '#e94560', color: 'white' }}
            onClick={() => window.open('http://localhost:8000/api/export/places.json', '_blank')}>
            Export Approved JSON
          </button>
        </aside>

        <main className="main-content">
          {qualityReport && (
            <section className="quality-report">
              <h2>Data Quality Audit</h2>
              <div className="report-stats">
                <div className="stat-card">
                  <h3>{qualityReport.summary.missing_coords_count}</h3>
                  <p>Missing Lat/Lng</p>
                </div>
                <div className="stat-card">
                  <h3>{qualityReport.summary.no_images_count}</h3>
                  <p>No Images</p>
                </div>
                <div className="stat-card">
                  <h3>{qualityReport.summary.no_cover_count}</h3>
                  <p>No Cover Image</p>
                </div>
                <div className="stat-card">
                  <h3>{qualityReport.summary.no_safety_count}</h3>
                  <p>No Safety Notes</p>
                </div>
              </div>
            </section>
          )}

          <div className="places-list">
            {places.map(place => (
              <div key={place.id} className="place-card">
                <div onClick={() => setSelectedPlace(place)} style={{ cursor: 'pointer' }}>
                  <img
                    src={
                      place.images.find(i => i.is_cover)?.thumbnail_path
                        ? `http://localhost:8000/${place.images.find(i => i.is_cover).thumbnail_path.replace(/\\/g, '/')}`
                        : place.images.find(i => i.is_cover)?.image_path?.replace(/\\/g, '/').replace('uploads/', 'http://localhost:8000/uploads/')
                        || 'https://via.placeholder.com/300x180'
                    }
                    alt={place.name}
                  />
                </div>
                <div className="place-info">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 onClick={() => setSelectedPlace(place)} style={{ cursor: 'pointer' }}>{place.name}</h3>
                    <button
                      onClick={() => handleDelete(place.id)}
                      style={{
                        background: 'rgba(233, 69, 96, 0.1)',
                        color: '#e94560',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                      title="Delete Place"
                    >
                      🗑️
                    </button>
                  </div>
                  <div onClick={() => setSelectedPlace(place)} style={{ cursor: 'pointer' }}>
                    <span className="badge">{place.district_name}</span>
                    <span className="badge">{place.category_name}</span>
                    <span className={`badge status-badge ${place.status === 'approved' ? 'status-approved' : place.status === 'rejected' ? 'status-rejected' : ''}`}>
                      {place.status}
                    </span>
                  </div>
                  <div style={{ marginTop: '0.8rem', display: 'flex', gap: '0.5rem' }}>
                    {place.status !== 'approved' && (
                      <button
                        onClick={() => handleStatusUpdate(place.id, 'approved')}
                        style={{ background: '#2ecc71', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                      >
                        Approve
                      </button>
                    )}
                    {place.status !== 'rejected' && (
                      <button
                        onClick={() => handleStatusUpdate(place.id, 'rejected')}
                        style={{ background: '#e94560', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                      >
                        Reject
                      </button>
                    )}
                  </div>
                  <div className="place-footer">
                    <span>{new Date(place.created_at).toLocaleDateString()}</span>
                    {place.lat && place.lng ? (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#4db8ff', textDecoration: 'none', fontWeight: 600 }}
                      >
                        📍 View on Map
                      </a>
                    ) : (
                      <span style={{ color: '#aaa' }}>❌ No Coords</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {places.length === 0 && !loading && <p style={{ color: '#aaa' }}>No places found. Try adjusting your filters.</p>}
          </div>
        </main>
      </div>

      {selectedPlace && (
        <div className="modal-overlay" onClick={() => { setSelectedPlace(null); setIsEditing(false); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ position: 'sticky', top: 0, background: '#1a1a2e', padding: '10px 0', zIndex: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem' }}>
              <h2 style={{ color: '#e94560', margin: 0 }}>
                {isEditing ? `Editing: ${editForm.name}` : selectedPlace.name}
              </h2>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={handleEditToggle}
                  style={{ background: isEditing ? '#aaa' : 'rgba(77, 184, 255, 0.2)', color: isEditing ? 'black' : '#4db8ff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                >
                  {isEditing ? 'Cancel Edit' : '📝 Edit Details'}
                </button>
                {isEditing && (
                  <button
                    onClick={handleEditSave}
                    style={{ background: '#2ecc71', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    💾 Save Changes
                  </button>
                )}
                <button className="close-btn" style={{ position: 'relative', float: 'none' }} onClick={() => { setSelectedPlace(null); setIsEditing(false); }}>×</button>
              </div>
            </div>

            <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{selectedPlace.district_name} • {selectedPlace.category_name}</p>

            <div className="image-gallery">
              {selectedPlace.images.map((img: any, idx: number) => (
                <div key={idx} className="gallery-item" style={{ position: 'relative' }}>
                  <img src={`http://localhost:8000/${img.image_path.replace(/\\/g, '/')}`} alt={img.caption || `Image ${idx}`} />
                  {img.is_cover === 1 && <span style={{ position: 'absolute', top: 5, right: 5, background: '#e94560', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', color: 'white', fontWeight: 'bold' }}>COVER</span>}
                  {isEditing && (
                    <div style={{ position: 'absolute', bottom: 5, right: 5, display: 'flex', gap: '5px' }}>
                      {img.is_cover === 0 && (
                        <button onClick={(e) => { e.stopPropagation(); handleSetCover(img.id); }} style={{ background: '#4db8ff', color: 'black', border: 'none', padding: '4px 6px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}>Set Cover</button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); handleImageDelete(img.id); }} style={{ background: '#ff4d4d', color: 'white', border: 'none', padding: '4px 6px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}>Delete</button>
                    </div>
                  )}
                  {img.caption && <p style={{ fontSize: '0.7rem', padding: '5px', background: 'black', color: 'white', margin: 0 }}>{img.caption}</p>}
                </div>
              ))}
              {isEditing && (
                <div className="gallery-item" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', border: '2px dashed rgba(255,255,255,0.2)', minHeight: '150px' }}>
                  <label style={{ cursor: 'pointer', padding: '2rem', textAlign: 'center', color: '#aaa', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <input type="file" multiple accept="image/*" onChange={handleAddImages} style={{ display: 'none' }} />
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>+ Add Images</span>
                  </label>
                </div>
              )}
            </div>

            <div className="detail-grid">
              <div className="detail-section">
                <h4>Description & Context</h4>
                <div className="detail-item">
                  <strong>Name:</strong>
                  {isEditing ? <input name="name" value={editForm.name} onChange={handleEditChange} style={{ width: '100%', padding: '5px', background: '#333', color: 'white', border: 'none' }} /> : selectedPlace.name}
                </div>
                <div className="detail-item">
                  <strong>Description:</strong>
                  {isEditing ? <textarea name="description" value={editForm.description} onChange={handleEditChange} style={{ width: '100%', padding: '5px', background: '#333', color: 'white', border: 'none', minHeight: '80px' }} /> : (selectedPlace.description || 'N/A')}
                </div>
                <div className="detail-item">
                  <strong>Tags:</strong>
                  {isEditing ? <input name="tags" value={editForm.tags} onChange={handleEditChange} style={{ width: '100%', padding: '5px', background: '#333', color: 'white', border: 'none' }} /> : (selectedPlace.tags || 'N/A')}
                </div>
                <div className="detail-item">
                  <strong>Duration (min):</strong>
                  {isEditing ? <input type="number" name="duration_min" value={editForm.duration_min} onChange={handleEditChange} style={{ width: '100%', padding: '5px', background: '#333', color: 'white', border: 'none' }} /> : selectedPlace.duration_min}
                </div>
              </div>

              <div className="detail-section">
                <h4>Financials & Vibe</h4>
                <div className="detail-item">
                  <strong>Budget Min:</strong>
                  {isEditing ? <input type="number" name="cost_min" value={editForm.cost_min} onChange={handleEditChange} style={{ width: '100%', padding: '5px', background: '#333', color: 'white', border: 'none' }} /> : selectedPlace.cost_min}
                </div>
                <div className="detail-item">
                  <strong>Budget Max:</strong>
                  {isEditing ? <input type="number" name="cost_max" value={editForm.cost_max} onChange={handleEditChange} style={{ width: '100%', padding: '5px', background: '#333', color: 'white', border: 'none' }} /> : selectedPlace.cost_max}
                </div>
                <div className="detail-item">
                  <strong>Ticket Price:</strong>
                  {isEditing ? <input type="number" name="ticket_price" value={editForm.ticket_price} onChange={handleEditChange} style={{ width: '100%', padding: '5px', background: '#333', color: 'white', border: 'none' }} /> : selectedPlace.ticket_price}
                </div>
              </div>

              <div className="detail-section">
                <h4>Location & Security</h4>
                <div className="detail-item">
                  <strong>Latitude:</strong>
                  {isEditing ? <input name="lat" value={editForm.lat || ''} onChange={handleEditChange} style={{ width: '100%', padding: '5px', background: '#333', color: 'white', border: 'none' }} /> : (selectedPlace.lat || 'N/A')}
                </div>
                <div className="detail-item">
                  <strong>Longitude:</strong>
                  {isEditing ? <input name="lng" value={editForm.lng || ''} onChange={handleEditChange} style={{ width: '100%', padding: '5px', background: '#333', color: 'white', border: 'none' }} /> : (selectedPlace.lng || 'N/A')}
                </div>
                <div className="detail-item">
                  <strong>Safety Note:</strong>
                  {isEditing ? <textarea name="safety_note" value={editForm.safety_note} onChange={handleEditChange} style={{ width: '100%', padding: '5px', background: '#333', color: 'white', border: 'none' }} /> : (selectedPlace.safety_note || 'N/A')}
                </div>
              </div>

              <div className="detail-section">
                <h4>Logistics</h4>
                <div className="detail-item">
                  <strong>Address:</strong>
                  {isEditing ? <input name="address" value={editForm.address} onChange={handleEditChange} style={{ width: '100%', padding: '5px', background: '#333', color: 'white', border: 'none' }} /> : (selectedPlace.address || 'N/A')}
                </div>
                <div className="detail-item">
                  <strong>Open Hours:</strong>
                  {isEditing ? <input name="open_hours" value={editForm.open_hours} onChange={handleEditChange} style={{ width: '100%', padding: '5px', background: '#333', color: 'white', border: 'none' }} /> : (selectedPlace.open_hours || 'N/A')}
                </div>
                {!isEditing && selectedPlace.lat && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${selectedPlace.lat},${selectedPlace.lng}`}
                    target="_blank"
                    style={{ background: '#e94560', color: 'white', padding: '10px', borderRadius: '10px', textDecoration: 'none', display: 'inline-block', marginTop: '1rem' }}
                  >
                    🚀 Open in Google Maps
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
