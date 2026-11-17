import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  Search,
  Filter,
  DollarSign,
  Calendar,
  Sparkles,
  ArrowRight,
  Briefcase,
  Star,
  Layers,
} from 'lucide-react';

const TasksFeed = () => {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [tasksRes, catRes] = await Promise.all([
          api.get('/tasks'),
          api.get('/tasks/categories'),
        ]);
        setTasks(tasksRes.data.tasks || []);
        if (catRes.data?.categories) {
          setCategories(['All', ...catRes.data.categories]);
        }
      } catch (err) {
        console.error('Error fetching marketplace tasks:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredTasks = tasks.filter((t) => {
    const matchesCategory =
      selectedCategory === 'All' || t.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.skills?.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="main-content">
      {/* Hero Banner */}
      <div
        className="card"
        style={{
          padding: '3rem 2.5rem',
          marginBottom: '2.5rem',
          background:
            'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(236, 72, 153, 0.1) 100%), rgba(17, 24, 39, 0.8)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: '700px' }}>
          <div
            className="badge badge-role"
            style={{ marginBottom: '1rem', background: 'rgba(99, 102, 241, 0.25)' }}
          >
            <Sparkles size={14} color="#818cf8" />
            <span>Discover Top Micro-Tasks</span>
          </div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', lineHeight: '1.2' }}>
            Find Instant Micro-Tasks.{' '}
            <span className="brand-gradient-text">Deliver & Earn.</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '1.75rem', lineHeight: '1.6' }}>
            Connect directly with verified clients. High-impact bite-sized projects with guaranteed payments and transparent deadlines.
          </p>

          {/* Quick Search */}
          <div style={{ display: 'flex', gap: '0.75rem', maxWidth: '540px' }}>
            <div className="input-wrapper" style={{ flex: 1 }}>
              <span className="input-icon">
                <Search size={18} />
              </span>
              <input
                type="text"
                className="form-input has-icon"
                placeholder="Search by keywords (e.g. React, Figma, Python)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ background: 'rgba(15, 23, 42, 0.8)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Categories Bar */}
      <div
        style={{
          display: 'flex',
          gap: '0.65rem',
          overflowX: 'auto',
          paddingBottom: '0.75rem',
          marginBottom: '2rem',
          scrollbarWidth: 'none',
        }}
      >
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedCategory(cat)}
            style={{ whiteSpace: 'nowrap', borderRadius: '9999px', fontSize: '0.85rem' }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tasks Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="spinner" style={{ width: '2.5rem', height: '2.5rem', margin: '0 auto 1rem' }}></div>
          <p style={{ color: 'var(--text-muted)' }}>Browsing marketplace tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <Briefcase size={40} color="#818cf8" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>No open tasks found</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Try adjusting your search keywords or selecting another category.
          </p>
        </div>
      ) : (
        <div className="grid-2">
          {filteredTasks.map((task) => (
            <div key={task._id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span className="badge badge-role">{task.category}</span>
                <span className="badge badge-open">{task.status}</span>
              </div>

              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.65rem', color: '#fff' }}>
                {task.title}
              </h2>

              <p
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  marginBottom: '1.25rem',
                  flex: 1,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {task.description}
              </p>

              {/* Skills */}
              {task.skills?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
                  {task.skills.map((skill) => (
                    <span key={skill} className="badge badge-skill">
                      {skill}
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
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>
                    Fixed Budget
                  </span>
                  <span style={{ fontSize: '1.15rem', fontWeight: '800', color: '#10b981' }}>
                    ${task.budget} USD
                  </span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>
                    Due Date
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                    {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Poster info */}
              {task.poster && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.85rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Posted by:</span>
                  <span style={{ color: '#fff', fontWeight: '600' }}>{task.poster.name}</span>
                  {task.poster.rating && (
                    <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                      <Star size={12} fill="#f59e0b" />
                      {task.poster.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              )}

              {/* View Details CTA */}
              <Link
                to={`/tasks/${task._id}`}
                style={{
                  display: 'block',
                  marginTop: '1rem',
                  padding: '0.55rem',
                  textAlign: 'center',
                  borderRadius: '0.6rem',
                  background: 'rgba(99,102,241,0.12)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  color: '#818cf8',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  textDecoration: 'none',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.22)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.12)'}
              >
                View Details & Apply →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TasksFeed;
