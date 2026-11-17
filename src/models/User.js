const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Do not return password by default in queries
    },
    role: {
      type: String,
      enum: {
        values: ['freelancer', 'client', 'admin'],
        message: '{VALUE} is not a valid role',
      },
      default: 'freelancer',
    },
    skills: {
      type: [String],
      default: [],
    },
    badges: {
      type: [String],
      default: ['Newcomer'],
    },
    rating: {
      type: Number,
      default: 5.0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot exceed 5'],
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    bio: {
      type: String,
      default: '',
      maxlength: [1000, 'Bio cannot exceed 1000 characters'],
    },
    professionalTitle: {
      type: String,
      default: '',
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    hourlyRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    completedTaskCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    portfolio: [
      {
        title: {
          type: String,
          required: [true, 'Please provide a project title'],
          trim: true,
        },
        description: {
          type: String,
          trim: true,
        },
        projectUrl: {
          type: String,
          trim: true,
        },
        imageUrl: {
          type: String,
          trim: true,
        },
        tags: {
          type: [String],
          default: [],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
userSchema.index(
  { name: 'text', professionalTitle: 'text', bio: 'text', skills: 'text' },
  { weights: { skills: 10, professionalTitle: 5, name: 3, bio: 1 }, name: 'UserTextIndex' }
);

// Hash password before saving if it has been modified
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with hashed password in DB
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Sign JWT and return
userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      role: this.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

module.exports = mongoose.model('User', userSchema);
