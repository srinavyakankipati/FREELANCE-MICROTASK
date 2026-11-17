import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  PlusCircle,
  DollarSign,
  Calendar,
  Tag,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react';

const DEFAULT_CATEGORIES = [
  'Web Development',
  'Mobile Apps',
  'UI/UX Design',
  'Writing & Content',
  'AI & Machine Learning',
  'Data Science & Analytics',
  'Graphic & Visual Design',
  'Video & Animation',
  'DevOps & Cloud',
  'Digital Marketing',
];

const SKILL_SUGGESTIONS = [
  'React',
  'Node.js',
  'MongoDB',
  'Python',
  'TypeScript',
  'Figma',
  'TailwindCSS',
  'Docker',
  'AWS',
  'GraphQL',
];

const PostTask = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: DEFAULT_CATEGORIES[0],
    budget: '',
    deadline: '',
  });

  const [skillsList, setSkillsList] = useState([]);
  const [currentSkillInput, setCurrentSkillInput] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch live categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/tasks/categories');
        if (res.data?.categories?.length > 0) {
          setCategories(res.data.categories);
          setFormData((prev) => ({ ...prev, category: res.data.categories[0] }));
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = (skill) => {
    const trimmed = skill.trim();
    if (trimmed && !skillsList.includes(trimmed)) {
      setSkillsList([...skillsList, trimmed]);
      setCurrentSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkillsList(skillsList.filter((s) => s !== skillToRemove));
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddSkill(currentSkillInput);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (user?.role === 'freelancer') {
      setError('Only clients or admins can post new tasks.');
      return;
    }

    if (!formData.title.trim()) {
      setError('Please provide a descriptive task title.');
      return;
    }

    if (!formData.description.trim()) {
      setError('Please enter a detailed task description.');
      return;
    }

    if (!formData.budget || Number(formData.budget) < 5) {
      setError('Budget must be at least $5.');
      return;
    }

    if (!formData.deadline) {
      setError('Please select a valid deadline date.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await api.post('/tasks', {
        ...formData,
        budget: Number(formData.budget),
        skills: skillsList,
      });

      setSuccessMsg('Task published successfully! Redirecting...');
      setTimeout(() => {
        navigate('/my-tasks');
      }, 1200);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create task. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get tomorrow's date for min date picker
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split('T')[0];

  return (
    <div className="main-content" style={{ maxWidth: '820px' }}>
      <div className="card" style={{ padding: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 15px var(--primary-glow)',
            }}
          >
            <PlusCircle size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', marginBottom: '0.2rem' }}>Post a New Micro-Task</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Describe your project, define required skills, set a budget, and connect with top talent
            </p>
          </div>
        </div>

        {error && (
          <div className="alert alert-error" id="post-task-error-alert">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success" id="post-task-success-alert">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} />
              <span>{successMsg}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="form-group">
            <div className="form-label">
              <label htmlFor="task-title">Task Title</label>
              <span className="form-hint">{formData.title.length}/120</span>
            </div>
            <input
              id="task-title"
              name="title"
              type="text"
              required
              maxLength={120}
              className="form-input"
              placeholder="e.g. Build Responsive Landing Page in React + Tailwind"
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          {/* Category & Budget row */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="task-category">
                Category
              </label>
              <select
                id="task-category"
                name="category"
                className="form-select"
                value={formData.category}
                onChange={handleChange}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="task-budget">
                Budget (USD)
              </label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <DollarSign size={18} />
                </span>
                <input
                  id="task-budget"
                  name="budget"
                  type="number"
                  min="5"
                  step="1"
                  required
                  className="form-input has-icon"
                  placeholder="250"
                  value={formData.budget}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Deadline */}
          <div className="form-group">
            <label className="form-label" htmlFor="task-deadline">
              Completion Deadline
            </label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Calendar size={18} />
              </span>
              <input
                id="task-deadline"
                name="deadline"
                type="date"
                min={minDateStr}
                required
                className="form-input has-icon"
                value={formData.deadline}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Skills Required */}
          <div className="form-group">
            <label className="form-label">Required Skills & Tools</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div className="input-wrapper" style={{ flex: 1 }}>
                <span className="input-icon">
                  <Tag size={17} />
                </span>
                <input
                  type="text"
                  className="form-input has-icon"
                  placeholder="Type skill and press Enter or click suggestions below"
                  value={currentSkillInput}
                  onChange={(e) => setCurrentSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                />
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleAddSkill(currentSkillInput)}
              >
                Add Skill
              </button>
            </div>

            {/* Selected Skills Chips */}
            {skillsList.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', margin: '0.5rem 0' }}>
                {skillsList.map((skill) => (
                  <span
                    key={skill}
                    className="badge badge-role"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.82rem',
                      padding: '0.3rem 0.65rem',
                    }}
                  >
                    <span>{skill}</span>
                    <X
                      size={14}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleRemoveSkill(skill)}
                    />
                  </span>
                ))}
              </div>
            )}

            {/* Suggested Skill Chips */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.35rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginRight: '0.2rem' }}>
                Suggestions:
              </span>
              {SKILL_SUGGESTIONS.map((skill) => (
                <button
                  type="button"
                  key={skill}
                  onClick={() => handleAddSkill(skill)}
                  className="badge badge-skill"
                  style={{
                    cursor: 'pointer',
                    background: skillsList.includes(skill)
                      ? 'rgba(99,102,241,0.2)'
                      : 'rgba(255,255,255,0.04)',
                    borderColor: skillsList.includes(skill)
                      ? 'var(--primary)'
                      : 'var(--border-subtle)',
                  }}
                >
                  + {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <div className="form-label">
              <label htmlFor="task-description">Detailed Description & Deliverables</label>
            </div>
            <textarea
              id="task-description"
              name="description"
              required
              rows={5}
              className="form-textarea"
              placeholder="Outline the exact scope of work, technical requirements, deliverables, and acceptance criteria..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate('/my-tasks')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              id="btn-publish-task"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner"></div>
                  <span>Publishing Task...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Publish Task Now</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostTask;
