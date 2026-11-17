import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  ShieldCheck,
  Award,
  Zap,
  Lock,
  MessageSquare,
  Scale,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
  Briefcase,
  DollarSign,
  Star,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

const LandingPage = () => {
  const { isAuthenticated, user } = useAuth();
  const [platformMetrics, setPlatformMetrics] = useState({
    users: 250,
    tasks: 120,
    escrowVolume: 45000,
    completionRate: 98,
  });

  // Fetch live stats if available
  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        if (res.data?.success && res.data.stats) {
          const s = res.data.stats;
          setPlatformMetrics({
            users: s.users?.total || 250,
            tasks: s.tasks?.total || 120,
            escrowVolume: s.escrow?.totalVolume || 45000,
            completionRate: s.tasks?.completionRate || 98,
          });
        }
      } catch (e) {
        // Fallback gracefully to default metrics
      }
    };
    loadStats();
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* =========================================================================
          HERO SECTION
          ========================================================================= */}
      <section
        style={{
          position: 'relative',
          padding: '5rem 1.5rem 4rem',
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: '960px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          {/* Eyebrow badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 1rem',
              borderRadius: '999px',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              color: '#a5b4fc',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '1.75rem',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.2)',
            }}
          >
            <Sparkles size={16} color="#818cf8" />
            <span>The Micro-Task Marketplace Powered by Verified Skills & Escrow</span>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 6vw, 4.2rem)',
              lineHeight: 1.15,
              fontWeight: 800,
              marginBottom: '1.5rem',
              letterSpacing: '-0.03em',
            }}
          >
            Hire Verified Experts.{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #6366f1 20%, #ec4899 60%, #06b6d4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Get Paid Safe.
            </span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
              color: 'var(--text-muted)',
              maxWidth: '740px',
              margin: '0 auto 2.5rem',
              lineHeight: 1.6,
            }}
          >
            Connect top skill-tested freelancers with clients via guaranteed milestone escrows,
            real-time per-task collaboration workspaces, and transparent dispute arbitration.
          </p>

          {/* Action CTAs */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: '3.5rem',
            }}
          >
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary btn-lg" id="btn-hero-dashboard">
                <span>Go to My Dashboard</span>
                <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg" id="btn-hero-get-started">
                  <span>Get Started Free</span>
                  <ArrowRight size={18} />
                </Link>
                <Link to="/tasks" className="btn btn-secondary btn-lg" id="btn-hero-browse">
                  <Briefcase size={18} />
                  <span>Browse Tasks</span>
                </Link>
              </>
            )}
            <Link to="/skill-tests" className="btn btn-outline btn-lg" id="btn-hero-skills">
              <Award size={18} />
              <span>Take Skill Tests</span>
            </Link>
          </div>

          {/* Stat Ticker */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1.25rem',
              padding: '1.5rem',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fff' }}>
                ${(platformMetrics.escrowVolume || 0).toLocaleString()}+
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Escrow Protected Volume
              </div>
            </div>

            <div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#818cf8' }}>
                {(platformMetrics.tasks || 0).toLocaleString()}+
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Tasks Completed
              </div>
            </div>

            <div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#34d399' }}>
                {(platformMetrics.completionRate || 98)}%
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Delivery Success Rate
              </div>
            </div>

            <div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f472b6' }}>
                100%
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Proctored Skill Badges
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          HOW IT WORKS (CLIENT VS FREELANCER)
          ========================================================================= */}
      <section style={{ padding: '4rem 1.5rem', background: 'rgba(0, 0, 0, 0.2)' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span
              className="badge"
              style={{
                background: 'rgba(6, 182, 212, 0.15)',
                color: '#67e8f9',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                fontSize: '0.8rem',
                marginBottom: '0.5rem',
              }}
            >
              Streamlined Lifecycle
            </span>
            <h2 style={{ fontSize: '2.2rem', margin: '0.5rem 0' }}>How TaskForge Works</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
              Built specifically for micro-tasks and deliverables that demand precision, speed, and safety.
            </p>
          </div>

          <div className="grid-2" style={{ gap: '2rem' }}>
            {/* Poster Flow */}
            <div className="card" style={{ padding: '2rem', borderTop: '3px solid #6366f1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div
                  style={{
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: '#818cf8',
                    padding: '0.65rem',
                    borderRadius: '10px',
                  }}
                >
                  <Briefcase size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>For Task Posters & Clients</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Hire verified talent with complete financial security
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {[
                  {
                    step: '1',
                    title: 'Post Your Task & Milestones',
                    desc: 'Define scope, deadline, required skills, and breakout milestone budgets.',
                  },
                  {
                    step: '2',
                    title: 'Smart Algorithmic Matching',
                    desc: 'Instantly view verified applicants ranked by skill test badges and rating overlap.',
                  },
                  {
                    step: '3',
                    title: 'Fund Escrow Deposit',
                    desc: 'Deposit milestone funds into escrow. Funds are securely locked before work starts.',
                  },
                  {
                    step: '4',
                    title: 'Collaborate & Release',
                    desc: 'Review deliverables in the real-time workspace and release funds with one click.',
                  },
                ].map((item) => (
                  <div key={item.step} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'rgba(99, 102, 241, 0.25)',
                        color: '#a5b4fc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        flexShrink: 0,
                      }}
                    >
                      {item.step}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', margin: '0 0 0.2rem', color: '#fff' }}>{item.title}</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '2rem' }}>
                <Link to="/post-task" className="btn btn-primary" style={{ width: '100%' }}>
                  <span>Post a Task Now</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* Freelancer Flow */}
            <div className="card" style={{ padding: '2rem', borderTop: '3px solid #ec4899' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div
                  style={{
                    background: 'rgba(236, 72, 153, 0.2)',
                    color: '#f472b6',
                    padding: '0.65rem',
                    borderRadius: '10px',
                  }}
                >
                  <Award size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>For Verified Freelancers</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Prove competence and earn guaranteed payouts
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {[
                  {
                    step: '1',
                    title: 'Earn Verified Skill Badges',
                    desc: 'Take timed technical assessments to earn permanent verified badges on your profile.',
                  },
                  {
                    step: '2',
                    title: 'Apply to Curated Micro-Tasks',
                    desc: 'Browse recommended tasks matched to your specific certified skills.',
                  },
                  {
                    step: '3',
                    title: 'Work Protected by Escrow',
                    desc: 'Never worry about non-payment. Clients must fund escrow before you begin coding.',
                  },
                  {
                    step: '4',
                    title: 'Deliver & Get Paid Instantly',
                    desc: 'Upload deliverables to the workspace repository and receive instant milestone release.',
                  },
                ].map((item) => (
                  <div key={item.step} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'rgba(236, 72, 153, 0.25)',
                        color: '#f472b6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        flexShrink: 0,
                      }}
                    >
                      {item.step}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', margin: '0 0 0.2rem', color: '#fff' }}>{item.title}</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '2rem' }}>
                <Link to="/tasks" className="btn btn-secondary" style={{ width: '100%' }}>
                  <span>Explore Available Tasks</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          KEY PLATFORM PILLARS (BENTO GRID)
          ========================================================================= */}
      <section style={{ padding: '4.5rem 1.5rem' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span
              className="badge"
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#6ee7b7',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontSize: '0.8rem',
                marginBottom: '0.5rem',
              }}
            >
              Enterprise Infrastructure
            </span>
            <h2 style={{ fontSize: '2.2rem', margin: '0.5rem 0' }}>Engineered for Frictionless Delivery</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '620px', margin: '0 auto' }}>
              Every feature is purposefully constructed to eliminate ghosting, non-payment, and mismatched expectations.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {/* Feature 1 */}
            <div className="card card-hover" style={{ padding: '1.75rem' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <Lock size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#fff' }}>Milestone Escrow Vaults</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                Client funds are committed upfront into segregated escrow contracts per milestone. Freelancers work with
                guaranteed compensation upon approved delivery.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card card-hover" style={{ padding: '1.75rem' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: '#818cf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <Award size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#fff' }}>Proctored Skill Badges</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                No self-proclaimed skill claims. Timed, randomized code and architectural assessments verify competence
                and award immutable profile badges.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card card-hover" style={{ padding: '1.75rem' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'rgba(6, 182, 212, 0.15)',
                  color: '#06b6d4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <MessageSquare size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#fff' }}>Per-Task Live Workspaces</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                Dedicated room per task with real-time Socket.io chat, typing alerts, unread counters, and cloud file
                storage repository.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card card-hover" style={{ padding: '1.75rem' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <Scale size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#fff' }}>Binding Dispute Arbitration</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                When disagreements arise, either party can raise a dispute to freeze milestones. Admins review full workspace
                evidence to release, refund, or split escrow.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="card card-hover" style={{ padding: '1.75rem' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'rgba(168, 85, 247, 0.15)',
                  color: '#c084fc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <Sparkles size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#fff' }}>Cosine Similarity Matching</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                Recommendation algorithms compute skill overlap, verified badges, rating, and completion rate to rank
                the top best-fit talent for clients.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="card card-hover" style={{ padding: '1.75rem' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'rgba(236, 72, 153, 0.15)',
                  color: '#ec4899',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <TrendingUp size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#fff' }}>Verified Reputation</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                Two-way client and freelancer ratings, portfolio items, and completed task tallies build lasting platform
                credibility.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          CALL TO ACTION (CTA)
          ========================================================================= */}
      <section style={{ padding: '3rem 1.5rem 5rem' }}>
        <div
          style={{
            maxWidth: '1000px',
            margin: '0 auto',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(236, 72, 153, 0.2) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            padding: '3.5rem 2rem',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', marginBottom: '1rem', color: '#fff' }}>
            Ready to Build or Earn on TaskForge?
          </h2>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '1.05rem',
              maxWidth: '600px',
              margin: '0 auto 2rem',
            }}
          >
            Join thousands of developers, designers, and clients doing high-impact micro-tasks with complete payment security.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg" id="btn-cta-signup">
              <span>Create Your Account</span>
              <ArrowRight size={18} />
            </Link>
            <Link to="/tasks" className="btn btn-secondary btn-lg" id="btn-cta-tasks">
              <span>Explore Marketplace</span>
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FOOTER
          ========================================================================= */}
      <footer
        style={{
          marginTop: 'auto',
          borderTop: '1px solid var(--border-subtle)',
          padding: '2.5rem 1.5rem',
          background: 'rgba(10, 15, 25, 0.8)',
          fontSize: '0.88rem',
          color: 'var(--text-muted)',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: '0.8rem',
              }}
            >
              TF
            </div>
            <span style={{ fontWeight: 700, color: '#fff' }}>TaskForge</span>
            <span>• Micro-Task Freelance Engine</span>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <Link to="/tasks" style={{ color: 'var(--text-muted)' }}>Browse Tasks</Link>
            <Link to="/skill-tests" style={{ color: 'var(--text-muted)' }}>Skill Assessments</Link>
            <Link to="/search" style={{ color: 'var(--text-muted)' }}>Search Talent</Link>
            <Link to="/login" style={{ color: 'var(--text-muted)' }}>Sign In</Link>
          </div>

          <div>
            <span>© {new Date().getFullYear()} TaskForge. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
