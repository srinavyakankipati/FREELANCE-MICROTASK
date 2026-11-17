import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Filter,
  DollarSign,
  Calendar,
  Star,
  ShieldCheck,
  Briefcase,
  User as UserIcon,
  Sparkles,
  ArrowRight,
  TrendingUp,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

const SORT_OPTIONS_TASKS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'budget-high', label: 'Budget: High to Low' },
  { value: 'budget-low', label: 'Budget: Low to High' },
  { value: 'deadline', label: 'Deadline: Soonest' },
];

const SORT_OPTIONS_FREELANCERS = [
  { value: 'rating-high', label: 'Highest Rating' },
  { value: 'hourly-low', label: 'Hourly: Low to High' },
  { value: 'hourly-high', label: 'Hourly: High to Low' },
  { value: 'newest', label: 'Newest Members' },
];

const SearchPage = () => {
  const { user, isAuthenticated } = useAuth();

  // Active search mode: 'tasks' | 'freelancers'
  const [activeTab, setActiveTab] = useState('tasks');

  // Search input & Debounced search term
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');

  // Autocomplete suggestions
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Trending categories & Recommended tasks
  const [trendingCategories, setTrendingCategories] = useState([]);
  const [recommendedTasks, setRecommendedTasks] = useState([]);

  // Task Filter states
  const [category, setCategory] = useState('All');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [taskStatus, setTaskStatus] = useState('open');
  const [taskSort, setTaskSort] = useState('newest');

  // Freelancer Filter states
  const [minRating, setMinRating] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [locationFilter, setLocationFilter] = useState('');
  const [minHourlyRate, setMinHourlyRate] = useState('');
  const [maxHourlyRate, setMaxHourlyRate] = useState('');
  const [freelancerSort, setFreelancerSort] = useState('rating-high');

  // Selected skill filter tag
  const [selectedSkill, setSelectedSkill] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(6);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Results & Loading
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Debounce keyword input (350ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedKeyword(keyword);
      setPage(1); // reset to page 1 on new search
    }, 350);

    return () => clearTimeout(handler);
  }, [keyword]);

  // 2. Fetch skill autocomplete suggestions when typing
  useEffect(() => {
    const fetchAutocomplete = async () => {
      if (keyword.trim().length > 1) {
        try {
          const res = await api.get(`/search/skills?q=${encodeURIComponent(keyword.trim())}`);
          setSuggestions(res.data.skills || []);
          setShowSuggestions(true);
        } catch (err) {
          console.error('Autocomplete error:', err);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };
    fetchAutocomplete();
  }, [keyword]);

  // 3. Fetch trending categories and recommended tasks on mount
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [trendRes, recRes] = await Promise.all([
          api.get('/search/trending-categories'),
          api.get('/search/recommended-tasks'),
        ]);
        setTrendingCategories(trendRes.data.categories || []);
        setRecommendedTasks(recRes.data.tasks || []);
      } catch (err) {
        console.error('Meta fetch error:', err);
      }
    };
    fetchMeta();
  }, [isAuthenticated]);

  // 4. Perform Search when filters / debounced keyword / tab / page changes
  useEffect(() => {
    const performSearch = async () => {
      setLoading(true);
      try {
        if (activeTab === 'tasks') {
          const params = new URLSearchParams({
            page,
            limit,
            sort: taskSort,
          });
          if (debouncedKeyword) params.append('keyword', debouncedKeyword);
          if (category && category !== 'All') params.append('category', category);
          if (minBudget) params.append('minBudget', minBudget);
          if (maxBudget) params.append('maxBudget', maxBudget);
          if (taskStatus) params.append('status', taskStatus);
          if (selectedSkill) params.append('skills', selectedSkill);

          const res = await api.get(`/search/tasks?${params.toString()}`);
          setResults(res.data.tasks || []);
          setTotal(res.data.total || 0);
          setTotalPages(res.data.totalPages || 1);
        } else {
          const params = new URLSearchParams({
            page,
            limit,
            sort: freelancerSort,
          });
          if (debouncedKeyword) params.append('keyword', debouncedKeyword);
          if (selectedSkill) params.append('skills', selectedSkill);
          if (minRating) params.append('minRating', minRating);
          if (verifiedOnly) params.append('verifiedOnly', 'true');
          if (locationFilter) params.append('location', locationFilter.trim());
          if (minHourlyRate) params.append('minHourlyRate', minHourlyRate);
          if (maxHourlyRate) params.append('maxHourlyRate', maxHourlyRate);

          const res = await api.get(`/search/freelancers?${params.toString()}`);
          setResults(res.data.freelancers || []);
          setTotal(res.data.total || 0);
          setTotalPages(res.data.totalPages || 1);
        }
      } catch (err) {
        console.error('Search query failed:', err);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [
    activeTab,
    debouncedKeyword,
    category,
    minBudget,
    maxBudget,
    taskStatus,
    taskSort,
    minRating,
    verifiedOnly,
    locationFilter,
    minHourlyRate,
    maxHourlyRate,
    freelancerSort,
    selectedSkill,
    page,
  ]);

  const handleSelectSuggestion = (skillName) => {
    setSelectedSkill(skillName);
    setKeyword('');
    setShowSuggestions(false);
  };

  const clearFilters = () => {
    setKeyword('');
    setDebouncedKeyword('');
    setCategory('All');
    setMinBudget('');
    setMaxBudget('');
    setTaskStatus('open');
    setSelectedSkill('');
    setMinRating('');
    setVerifiedOnly(false);
    setLocationFilter('');
    setMinHourlyRate('');
    setMaxHourlyRate('');
    setPage(1);
  };

  return (
    <div className="main-content">
      {/* Header Search Hero */}
      <div
        className="card"
        style={{
          padding: '2.5rem',
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(236, 72, 153, 0.1) 100%), rgba(17, 24, 39, 0.85)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.25rem', marginBottom: '0.75rem' }}>
            Search <span className="brand-gradient-text">Micro-Tasks & Top Talent</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '1.75rem' }}>
            Instant text search, multi-criteria filtering, verified skill badges, and algorithmic recommendations
          </p>

          {/* Search Mode Toggle Tabs */}
          <div style={{ display: 'inline-flex', background: 'rgba(15, 23, 42, 0.8)', padding: '0.35rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'tasks' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => { setActiveTab('tasks'); setPage(1); }}
              id="tab-search-tasks"
              style={{ border: 'none', padding: '0.5rem 1.25rem' }}
            >
              <Briefcase size={16} />
              <span>Explore Tasks</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'freelancers' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => { setActiveTab('freelancers'); setPage(1); }}
              id="tab-search-freelancers"
              style={{ border: 'none', padding: '0.5rem 1.25rem' }}
            >
              <UserIcon size={16} />
              <span>Find Freelancers</span>
            </button>
          </div>

          {/* Debounced Search Input with Autocomplete */}
          <div style={{ position: 'relative', maxWidth: '640px', margin: '0 auto' }}>
            <div className="input-wrapper">
              <span className="input-icon">
                <Search size={20} color="#818cf8" />
              </span>
              <input
                type="text"
                className="form-input has-icon"
                placeholder={
                  activeTab === 'tasks'
                    ? "Search tasks by title, description or skills (e.g. 'React Landing Page')..."
                    : "Search freelancers by name, title or skills (e.g. 'UI Designer')..."
                }
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                style={{
                  height: '52px',
                  fontSize: '1rem',
                  background: 'rgba(15, 23, 42, 0.9)',
                  borderColor: 'rgba(99, 102, 241, 0.4)',
                }}
              />
              {keyword && (
                <button
                  type="button"
                  className="input-action-btn"
                  onClick={() => setKeyword('')}
                  style={{ right: '1rem' }}
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Skill Autocomplete Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '0.5rem',
                  background: '#131b2e',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: '12px',
                  boxShadow: '0 15px 35px rgba(0,0,0,0.6)',
                  zIndex: 40,
                  overflow: 'hidden',
                  textAlign: 'left',
                }}
              >
                <div style={{ padding: '0.5rem 1rem', fontSize: '0.78rem', color: 'var(--text-dim)', borderBottom: '1px solid var(--border-subtle)' }}>
                  Skill Autocomplete Suggestions:
                </div>
                {suggestions.map((skill) => (
                  <div
                    key={skill}
                    onClick={() => handleSelectSuggestion(skill)}
                    style={{
                      padding: '0.65rem 1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.9rem',
                      color: '#e2e8f0',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Sparkles size={14} color="#818cf8" />
                    <span>Filter by skill: <strong>{skill}</strong></span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Skill Filter Chip */}
          {selectedSkill && (
            <div style={{ marginTop: '0.85rem', display: 'flex', justifyContent: 'center' }}>
              <div
                className="badge badge-role"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.85rem',
                }}
              >
                <span>Skill Filter: {selectedSkill}</span>
                <X
                  size={14}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedSkill('')}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Trending Categories Bar */}
      {trendingCategories.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            <TrendingUp size={16} color="#818cf8" />
            <span style={{ fontWeight: '600', color: '#fff' }}>Trending Categories:</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
            <button
              type="button"
              className={`btn btn-sm ${category === 'All' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setCategory('All'); setPage(1); }}
              style={{ borderRadius: '9999px', fontSize: '0.82rem' }}
            >
              All Categories
            </button>
            {trendingCategories.map((item) => (
              <button
                key={item.category}
                type="button"
                className={`btn btn-sm ${category === item.category ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { setCategory(item.category); setPage(1); }}
                style={{ borderRadius: '9999px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
              >
                <span>{item.category}</span>
                {item.taskCount > 0 && (
                  <span style={{ opacity: 0.7, fontSize: '0.75rem', marginLeft: '0.25rem' }}>
                    ({item.taskCount})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Filter & Results Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2rem', alignItems: 'flex-start' }}>
        {/* =========================================================================
            SIDEBAR FILTERS
            ========================================================================= */}
        <div className="card" style={{ padding: '1.5rem', position: 'sticky', top: '90px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '700' }}>
              <Filter size={16} />
              <span>Filter Results</span>
            </div>
            <button
              type="button"
              onClick={clearFilters}
              style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              Reset All
            </button>
          </div>

          {activeTab === 'tasks' ? (
            /* Tasks Filters */
            <div>
              {/* Category */}
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                >
                  <option value="All">All Categories</option>
                  {trendingCategories.map((c) => (
                    <option key={c.category} value={c.category}>
                      {c.category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Budget Range */}
              <div className="form-group">
                <label className="form-label">Budget Range (USD)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Min $"
                    value={minBudget}
                    onChange={(e) => { setMinBudget(e.target.value); setPage(1); }}
                  />
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Max $"
                    value={maxBudget}
                    onChange={(e) => { setMaxBudget(e.target.value); setPage(1); }}
                  />
                </div>
              </div>

              {/* Task Status */}
              <div className="form-group">
                <label className="form-label">Task Status</label>
                <select
                  className="form-select"
                  value={taskStatus}
                  onChange={(e) => { setTaskStatus(e.target.value); setPage(1); }}
                >
                  <option value="open">Open (Accepting Bids)</option>
                  <option value="assigned">Assigned</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="all">All Statuses</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="form-group">
                <label className="form-label">Sort By</label>
                <select
                  className="form-select"
                  value={taskSort}
                  onChange={(e) => setTaskSort(e.target.value)}
                >
                  {SORT_OPTIONS_TASKS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            /* Freelancers Filters */
            <div>
              {/* Location Filter */}
              <div className="form-group">
                <label className="form-label">Location / City</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <MapPin size={15} color="#818cf8" />
                  </span>
                  <input
                    type="text"
                    className="form-input has-icon"
                    placeholder="e.g. London, San Francisco"
                    value={locationFilter}
                    onChange={(e) => { setLocationFilter(e.target.value); setPage(1); }}
                  />
                  {locationFilter && (
                    <button
                      type="button"
                      className="input-action-btn"
                      onClick={() => setLocationFilter('')}
                      style={{ right: '0.5rem' }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Hourly Rate Range */}
              <div className="form-group">
                <label className="form-label">Hourly Rate ($/hr)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Min $/hr"
                    value={minHourlyRate}
                    onChange={(e) => { setMinHourlyRate(e.target.value); setPage(1); }}
                  />
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Max $/hr"
                    value={maxHourlyRate}
                    onChange={(e) => { setMaxHourlyRate(e.target.value); setPage(1); }}
                  />
                </div>
              </div>

              {/* Minimum Rating */}
              <div className="form-group">
                <label className="form-label">Minimum Rating</label>
                <select
                  className="form-select"
                  value={minRating}
                  onChange={(e) => { setMinRating(e.target.value); setPage(1); }}
                >
                  <option value="">Any Rating</option>
                  <option value="4.5">★ 4.5 & up</option>
                  <option value="4.0">★ 4.0 & up</option>
                  <option value="3.0">★ 3.0 & up</option>
                </select>
              </div>

              {/* Verified Only Toggle */}
              <div className="form-group" style={{ margin: '1rem 0' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    color: '#e2e8f0',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => { setVerifiedOnly(e.target.checked); setPage(1); }}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                  />
                  <ShieldCheck size={16} color="#818cf8" />
                  <span>Verified Freelancers Only</span>
                </label>
              </div>

              {/* Sort By */}
              <div className="form-group">
                <label className="form-label">Sort By</label>
                <select
                  className="form-select"
                  value={freelancerSort}
                  onChange={(e) => setFreelancerSort(e.target.value)}
                >
                  {SORT_OPTIONS_FREELANCERS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            SEARCH RESULTS CONTENT
            ========================================================================= */}
        <div>
          {/* Results Summary Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            <span>
              Showing <strong style={{ color: '#fff' }}>{results.length}</strong> of{' '}
              <strong style={{ color: '#fff' }}>{total}</strong> {activeTab}
            </span>
            <span>
              Page <strong style={{ color: '#fff' }}>{page}</strong> of{' '}
              <strong style={{ color: '#fff' }}>{totalPages}</strong>
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <div className="spinner" style={{ width: '2.5rem', height: '2.5rem', margin: '0 auto 1rem' }}></div>
              <p style={{ color: 'var(--text-muted)' }}>Searching matches...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
              <Search size={40} color="#818cf8" style={{ marginBottom: '1rem' }} />
              <h2 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>No matches found</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Try relaxing your search terms or clearing active filters.
              </p>
              <button type="button" className="btn btn-secondary" onClick={clearFilters}>
                Clear All Filters
              </button>
            </div>
          ) : activeTab === 'tasks' ? (
            /* =========================================================================
               TASKS RESULTS CARDS
               ========================================================================= */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {results.map((task) => (
                <div key={task._id} className="card card-hover" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1, minWidth: '280px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                        <span className="badge badge-role">{task.category}</span>
                        <span className="badge badge-open">{task.status}</span>
                      </div>
                      <h2 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', color: '#fff' }}>
                        {task.title}
                      </h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.5', marginBottom: '1rem' }}>
                        {task.description}
                      </p>

                      {/* Skills */}
                      {task.skills?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                          {task.skills.map((skill) => (
                            <span
                              key={skill}
                              className="badge badge-skill"
                              style={{ cursor: 'pointer' }}
                              onClick={() => setSelectedSkill(skill)}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Metadata */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-dim)', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#10b981', fontWeight: '700', fontSize: '1.05rem' }}>
                          <DollarSign size={16} />
                          <span>${task.budget} USD</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={15} />
                          <span>Due {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        {task.poster && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span>Posted by:</span>
                            <span style={{ color: '#e2e8f0', fontWeight: '600' }}>{task.poster.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* =========================================================================
               FREELANCERS RESULTS CARDS
               ========================================================================= */
            <div className="grid-2">
              {results.map((f) => (
                <div key={f._id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.4rem',
                        fontWeight: '800',
                        color: '#fff',
                        flexShrink: 0,
                      }}
                    >
                      {f.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1.15rem', color: '#fff' }}>{f.name}</h3>
                        {f.badges?.some((b) => b.startsWith('Verified')) && (
                          <ShieldCheck size={16} color="#818cf8" title="Verified Freelancer" />
                        )}
                      </div>
                      <span style={{ fontSize: '0.85rem', color: '#c7d2fe', display: 'block' }}>
                        {f.professionalTitle || 'Freelance Specialist'}
                      </span>
                    </div>
                  </div>

                  <p
                    style={{
                      color: 'var(--text-muted)',
                      fontSize: '0.88rem',
                      lineHeight: '1.5',
                      marginBottom: '1rem',
                      flex: 1,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {f.bio || 'Experienced freelance specialist dedicated to high-quality code delivery and transparent communication.'}
                  </p>

                  {/* Skills tags */}
                  {f.skills?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
                      {f.skills.slice(0, 4).map((s) => (
                        <span key={s} className="badge badge-skill" style={{ fontSize: '0.75rem' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Card Footer */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '0.85rem',
                      borderTop: '1px solid var(--border-subtle)',
                      marginTop: 'auto',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#f59e0b', fontWeight: '700' }}>
                      <Star size={15} fill="#f59e0b" />
                      <span>{f.rating?.toFixed(1) || '5.0'}</span>
                      <span style={{ color: 'var(--text-dim)', fontWeight: '400', fontSize: '0.8rem' }}>
                        ({f.reviewCount || 0})
                      </span>
                    </div>

                    <Link
                      to={`/profile/${f._id}`}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.82rem' }}
                    >
                      <span>View Profile</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* =========================================================================
              PAGINATION BAR
              ========================================================================= */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '2.5rem',
              }}
            >
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>

              {/* Page Number Buttons */}
              {[...Array(totalPages)].map((_, idx) => {
                const pageNumber = idx + 1;
                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setPage(pageNumber)}
                    className={`btn btn-sm ${page === pageNumber ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ minWidth: '36px' }}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* =========================================================================
              RECOMMENDED TASKS SECTION (Personalized)
              ========================================================================= */}
          {recommendedTasks.length > 0 && activeTab === 'tasks' && (
            <div style={{ marginTop: '3.5rem', paddingTop: '2rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Sparkles size={20} color="#818cf8" />
                <h2 style={{ fontSize: '1.4rem' }}>
                  {isAuthenticated && user?.skills?.length > 0
                    ? `Recommended for You (Based on your skills: ${user.skills.slice(0, 3).join(', ')})`
                    : 'Recommended High-Value Micro-Tasks'}
                </h2>
              </div>

              <div className="grid-2">
                {recommendedTasks.slice(0, 4).map((rec) => (
                  <div key={rec._id} className="card card-hover" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span className="badge badge-role" style={{ fontSize: '0.72rem' }}>
                        {rec.category}
                      </span>
                      <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#10b981' }}>
                        ${rec.budget} USD
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.4rem' }}>
                      {rec.title}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.4', marginBottom: '0.75rem' }}>
                      {rec.description}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {rec.skills?.slice(0, 3).map((s) => (
                        <span key={s} className="badge badge-skill" style={{ fontSize: '0.72rem' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
