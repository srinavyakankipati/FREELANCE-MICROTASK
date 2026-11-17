import React, { useState } from 'react';
import api from '../api/axios';
import { Star, X, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';

const ReviewModal = ({ task, isOpen, onClose, onReviewSubmitted }) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Please provide feedback comment.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await api.post('/reviews', {
        taskId: task._id,
        rating,
        comment: comment.trim(),
      });

      setSuccess(true);
      if (onReviewSubmitted) {
        onReviewSubmitted(res.data);
      }
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setComment('');
      }, 1500);
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '0.5rem', borderRadius: '10px' }}>
              <Star size={20} fill="#f59e0b" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem' }}>Leave a Review</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                For task: {task.title}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="input-action-btn"
            onClick={onClose}
            style={{ position: 'static' }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} />
              <span>Review submitted! Rating updated successfully.</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Star Rating Selector */}
          <div className="form-group" style={{ textAlign: 'center', margin: '1.5rem 0' }}>
            <label className="form-label" style={{ justifyContent: 'center', marginBottom: '0.75rem' }}>
              Your Overall Rating
            </label>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem' }}>
              {[1, 2, 3, 4, 5].map((starVal) => {
                const isFilled = (hoverRating || rating) >= starVal;
                return (
                  <button
                    key={starVal}
                    type="button"
                    onMouseEnter={() => setHoverRating(starVal)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(starVal)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.35rem',
                      transition: 'transform 0.15s ease',
                      transform: isFilled ? 'scale(1.15)' : 'scale(1)',
                    }}
                    id={`star-rating-btn-${starVal}`}
                  >
                    <Star
                      size={32}
                      color={isFilled ? '#f59e0b' : '#64748b'}
                      fill={isFilled ? '#f59e0b' : 'transparent'}
                    />
                  </button>
                );
              })}
            </div>
            <span style={{ fontSize: '0.9rem', color: '#f59e0b', fontWeight: '700', marginTop: '0.5rem', display: 'block' }}>
              {rating === 5 && 'Outstanding Experience! ★★★★★'}
              {rating === 4 && 'Very Good ★★★★☆'}
              {rating === 3 && 'Average Quality ★★★☆☆'}
              {rating === 2 && 'Needs Improvement ★★☆☆☆'}
              {rating === 1 && 'Unsatisfactory ★☆☆☆☆'}
            </span>
          </div>

          {/* Comment */}
          <div className="form-group">
            <label className="form-label">Feedback & Experience</label>
            <textarea
              required
              rows={4}
              className="form-textarea"
              placeholder="Describe your collaboration, communication, code quality, and delivery speed..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              id="btn-submit-review"
              disabled={isSubmitting || success}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <MessageSquare size={16} />
                  <span>Submit Review</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
