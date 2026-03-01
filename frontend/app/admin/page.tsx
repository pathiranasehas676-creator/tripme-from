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

    useEffect(() => {
        fetchDistricts();
        fetchQualityReport();
        handleSearch(); // Initial load
    }, []);

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

    const handleFilterChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

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

        .place-footer {
          margin-top: 1rem;
          font-size: 0.8rem;
          color: #777;
          display: flex;
          justify-content: space-between;
        }
      `}</style>

            <div className="header">
                <h1>TripMe.ai Admin Portal</h1>
                <Link href="/" className="nav-btn">Add New Place</Link>
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
                                <img
                                    src={place.images.find(i => i.is_cover)?.image_path.replace('uploads\\', 'http://localhost:8000/uploads/') || 'https://via.placeholder.com/300x180'}
                                    alt={place.name}
                                />
                                <div className="place-info">
                                    <h3>{place.name}</h3>
                                    <div>
                                        <span className="badge">{place.district_name}</span>
                                        <span className="badge">{place.category_name}</span>
                                        <span className={`badge status-badge ${place.status === 'approved' ? 'status-approved' : ''}`}>
                                            {place.status}
                                        </span>
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
        </div>
    );
}
