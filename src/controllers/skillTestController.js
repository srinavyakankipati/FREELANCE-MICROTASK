const SkillTest = require('../models/SkillTest');
const TestResult = require('../models/TestResult');
const User = require('../models/User');

/**
 * @desc    1. List all available skill tests (without leaking correct answers)
 * @route   GET /api/skill-tests
 * @access  Public / Authenticated (enhanced with user pass status if logged in)
 */
const listSkillTests = async (req, res, next) => {
  try {
    const tests = await SkillTest.find().select('-questions.correctIndex').lean();

    // If user is authenticated, attach their past test status
    let userResults = [];
    if (req.user) {
      userResults = await TestResult.find({ user: req.user._id }).lean();
    }

    const enhancedTests = tests.map((test) => {
      const resultsForTest = userResults.filter(
        (r) => r.skillTest.toString() === test._id.toString()
      );
      const passedResult = resultsForTest.find((r) => r.passed);
      const bestScore = resultsForTest.reduce(
        (max, r) => (r.score > max ? r.score : max),
        0
      );

      return {
        ...test,
        questionCount: test.questions ? test.questions.length : 0,
        hasTaken: resultsForTest.length > 0,
        hasPassed: !!passedResult,
        bestScore: resultsForTest.length > 0 ? bestScore : null,
      };
    });

    res.status(200).json({
      success: true,
      count: enhancedTests.length,
      tests: enhancedTests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    2. Get test questions (HIDE correct answers)
 * @route   GET /api/skill-tests/:id
 * @access  Public / Authenticated
 */
const getTestQuestions = async (req, res, next) => {
  try {
    const test = await SkillTest.findById(req.params.id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Skill test not found',
      });
    }

    // Explicitly hide correctIndex from each question
    const sanitizedQuestions = test.questions.map((q) => ({
      _id: q._id,
      question: q.question,
      options: q.options,
    }));

    res.status(200).json({
      success: true,
      test: {
        _id: test._id,
        skill: test.skill,
        category: test.category,
        description: test.description,
        durationMinutes: test.durationMinutes,
        passingScore: test.passingScore,
        questionCount: sanitizedQuestions.length,
        questions: sanitizedQuestions,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    3. Submit answers (auto-score, add a verified badge to the user if passed)
 * @route   POST /api/skill-tests/:id/submit
 * @access  Private (Authenticated)
 */
const submitTestAnswers = async (req, res, next) => {
  try {
    const { answers, timeTakenSeconds } = req.body;
    // answers can be an array of numbers [0, 2, 1, 3] or array of objects [{ questionId, selectedIndex }]

    const test = await SkillTest.findById(req.params.id);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Skill test not found',
      });
    }

    const totalQuestions = test.questions.length;
    let correctCount = 0;
    const evaluatedAnswers = [];

    test.questions.forEach((q, index) => {
      let userSelectedIndex;

      if (Array.isArray(answers)) {
        if (typeof answers[0] === 'object' && answers[0] !== null) {
          // Object format { questionId, selectedIndex }
          const userAnsObj = answers.find(
            (a) => a.questionId && a.questionId.toString() === q._id.toString()
          );
          userSelectedIndex = userAnsObj ? userAnsObj.selectedIndex : -1;
        } else {
          // Plain index array format
          userSelectedIndex = answers[index] !== undefined ? answers[index] : -1;
        }
      } else if (answers && typeof answers === 'object') {
        // Object dictionary format { [questionId]: selectedIndex }
        userSelectedIndex = answers[q._id] !== undefined ? answers[q._id] : -1;
      }

      const isCorrect = userSelectedIndex === q.correctIndex;
      if (isCorrect) {
        correctCount++;
      }

      evaluatedAnswers.push({
        questionId: q._id,
        selectedIndex: userSelectedIndex,
        isCorrect,
      });
    });

    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= test.passingScore;
    const badgeName = `Verified ${test.skill}`;

    let badgeAwarded = false;

    // If passed, add verified badge to user
    const user = await User.findById(req.user._id);
    if (passed && user) {
      if (!user.badges.includes(badgeName)) {
        user.badges.push(badgeName);
        badgeAwarded = true;
      }

      // Also ensure skill is listed in user skills
      if (!user.skills.includes(test.skill)) {
        user.skills.push(test.skill);
      }

      await user.save();
    }

    // Save test result record
    const testResult = await TestResult.create({
      user: req.user._id,
      skillTest: test._id,
      skillName: test.skill,
      score,
      correctCount,
      totalQuestions,
      passed,
      badgeAwarded,
      answers: evaluatedAnswers,
      timeTakenSeconds: timeTakenSeconds || 0,
    });

    res.status(200).json({
      success: true,
      message: passed
        ? `Congratulations! You passed with ${score}% and earned the "${badgeName}" badge!`
        : `You scored ${score}%. The passing threshold is ${test.passingScore}%. You can retake the test to earn the verified badge.`,
      result: {
        _id: testResult._id,
        skill: test.skill,
        score,
        correctCount,
        totalQuestions,
        passingScore: test.passingScore,
        passed,
        badgeAwarded,
        earnedBadge: passed ? badgeName : null,
        userBadges: user ? user.badges : [],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    4. Get my results and badges
 * @route   GET /api/skill-tests/my-results
 * @access  Private (Authenticated)
 */
const getMyResultsAndBadges = async (req, res, next) => {
  try {
    const [results, user] = await Promise.all([
      TestResult.find({ user: req.user._id })
        .populate('skillTest', 'skill category durationMinutes passingScore')
        .sort({ createdAt: -1 }),
      User.findById(req.user._id).select('name email role skills badges rating'),
    ]);

    const passedCount = results.filter((r) => r.passed).length;
    const verifiedBadges = (user?.badges || []).filter((b) =>
      b.startsWith('Verified')
    );

    res.status(200).json({
      success: true,
      stats: {
        totalAttempts: results.length,
        passedCount,
        verifiedBadgesCount: verifiedBadges.length,
      },
      badges: user?.badges || [],
      skills: user?.skills || [],
      results,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    5. Admin create or update skill test
 * @route   POST /api/skill-tests (Create) & PUT /api/skill-tests/:id (Update)
 * @access  Private (Admin Only)
 */
const createOrUpdateSkillTest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { skill, category, description, durationMinutes, passingScore, questions } =
      req.body;

    if (id) {
      // Update existing test
      const test = await SkillTest.findById(id);
      if (!test) {
        return res.status(404).json({
          success: false,
          message: 'Skill test not found',
        });
      }

      if (skill) test.skill = skill;
      if (category) test.category = category;
      if (description) test.description = description;
      if (durationMinutes) test.durationMinutes = Number(durationMinutes);
      if (passingScore) test.passingScore = Number(passingScore);
      if (questions && Array.isArray(questions)) test.questions = questions;

      await test.save();

      return res.status(200).json({
        success: true,
        message: 'Skill test updated successfully',
        test,
      });
    }

    // Create new test
    const existing = await SkillTest.findOne({ skill });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A skill test for "${skill}" already exists. Use update instead.`,
      });
    }

    const newTest = await SkillTest.create({
      skill,
      category: category || 'General',
      description,
      durationMinutes: durationMinutes ? Number(durationMinutes) : 5,
      passingScore: passingScore ? Number(passingScore) : 70,
      questions,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Skill test created successfully',
      test: newTest,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listSkillTests,
  getTestQuestions,
  submitTestAnswers,
  getMyResultsAndBadges,
  createOrUpdateSkillTest,
};
