/**
 * Matching Service — Weighted Score Engine
 *
 * Weights:
 *   Skill Overlap         50%
 *   Average Rating        20%
 *   Verified Badges       20%
 *   Completed Task Count  10%
 *
 * Returns a score [0–100] and a human-readable explanation string.
 */

const WEIGHTS = {
  skillOverlap: 0.5,
  rating: 0.2,
  badges: 0.2,
  completedTasks: 0.1,
};

/**
 * Normalise a value in [0, max] to [0, 1]
 */
const norm = (value, max) => Math.min(value / max, 1);

/**
 * Compute Jaccard-like skill overlap between task skills and freelancer skills.
 * Returns a ratio [0, 1].
 */
const skillOverlapRatio = (taskSkills = [], freelancerSkills = []) => {
  if (taskSkills.length === 0) return 1; // task has no requirement → full match
  const taskSet = new Set(taskSkills.map((s) => s.toLowerCase()));
  const matched = freelancerSkills.filter((s) => taskSet.has(s.toLowerCase()));
  return matched.length / taskSet.size;
};

/**
 * Count how many "verified" badges a user holds.
 * A badge is considered "verified" if it is not the default 'Newcomer' badge.
 */
const countVerifiedBadges = (badges = []) => {
  return badges.filter((b) => b && b !== 'Newcomer').length;
};

/**
 * Build a short plain-english explanation for why the freelancer scored as they did.
 */
const buildExplanation = ({ skillScore, ratingScore, badgeScore, taskScore, total }) => {
  const parts = [];

  if (skillScore >= 0.8) parts.push('strong skill alignment');
  else if (skillScore >= 0.5) parts.push('partial skill overlap');
  else parts.push('limited skill overlap');

  if (ratingScore >= 0.8) parts.push('excellent rating');
  else if (ratingScore >= 0.5) parts.push('good rating');
  else parts.push('developing reputation');

  if (badgeScore >= 0.6) parts.push('multiple verified badges');
  else if (badgeScore > 0) parts.push('some verified badges');

  if (taskScore >= 0.6) parts.push('proven delivery history');
  else if (taskScore > 0) parts.push('some completed tasks');

  return `${Math.round(total)}% match — ${parts.join(', ')}.`;
};

/**
 * computeMatchScore
 *
 * @param {Object} task         - Task document (needs .skills[])
 * @param {Object} freelancer   - User document (needs .skills[], .rating, .badges[], .completedTaskCount)
 * @returns {{ score: Number, breakdown: Object, explanation: String }}
 */
const computeMatchScore = (task, freelancer) => {
  const taskSkills = task.skills || [];
  const fSkills    = freelancer.skills || [];
  const fRating    = freelancer.rating ?? 5.0;
  const fBadges    = freelancer.badges || [];
  const fCompleted = freelancer.completedTaskCount ?? 0;

  // --- Individual normalised subscores [0, 1] ---
  const skillScore  = skillOverlapRatio(taskSkills, fSkills);
  const ratingScore = norm(fRating, 5);                         // max possible rating = 5
  const verifiedBadgeCount = countVerifiedBadges(fBadges);
  const badgeScore  = norm(verifiedBadgeCount, 5);              // cap at 5 verified badges for full score
  const taskScore   = norm(fCompleted, 20);                     // cap at 20 completed tasks for full score

  // --- Weighted total [0, 1] ---
  const weightedTotal =
    skillScore  * WEIGHTS.skillOverlap +
    ratingScore * WEIGHTS.rating +
    badgeScore  * WEIGHTS.badges +
    taskScore   * WEIGHTS.completedTasks;

  // Convert to percentage [0, 100]
  const total = weightedTotal * 100;

  const explanation = buildExplanation({ skillScore, ratingScore, badgeScore, taskScore, total });

  return {
    score: Math.round(total * 10) / 10, // one decimal place
    breakdown: {
      skillOverlap: {
        raw: skillScore,
        weighted: Math.round(skillScore * WEIGHTS.skillOverlap * 100 * 10) / 10,
        matchedSkills: fSkills.filter((s) =>
          (taskSkills).map((t) => t.toLowerCase()).includes(s.toLowerCase())
        ),
      },
      rating: {
        raw: fRating,
        weighted: Math.round(ratingScore * WEIGHTS.rating * 100 * 10) / 10,
      },
      verifiedBadges: {
        count: verifiedBadgeCount,
        weighted: Math.round(badgeScore * WEIGHTS.badges * 100 * 10) / 10,
      },
      completedTasks: {
        count: fCompleted,
        weighted: Math.round(taskScore * WEIGHTS.completedTasks * 100 * 10) / 10,
      },
    },
    explanation,
  };
};

module.exports = { computeMatchScore, WEIGHTS };
