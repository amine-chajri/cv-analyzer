const mongoose = require('mongoose');

const stringArray = () => ({ type: [String], default: [] });

const analysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalFileName: {
      type: String,
      required: true,
      trim: true,
    },
    rawCvText: {
      type: String,
      required: true,
    },
    jobDescription: {
      type: String,
      required: true,
    },

    // --- from analyzeResume ---
    candidateProfile: {
      fullName: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      location: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      github: { type: String, default: '' },
      currentRole: { type: String, default: '' },
      totalYearsExperience: { type: Number, default: 0 },
      professionalSummary: { type: String, default: '' },
    },

    skills: {
      technical: stringArray(),
      toolsAndPlatforms: stringArray(),
      soft: stringArray(),
      languages: stringArray(),
    },

    experience: {
      type: [
        {
          company: { type: String, default: '' },
          jobTitle: { type: String, default: '' },
          startDate: { type: String, default: '' },
          endDate: { type: String, default: '' },
          achievements: stringArray(),
        },
      ],
      default: [],
    },

    education: {
      type: [
        {
          institution: { type: String, default: '' },
          degree: { type: String, default: '' },
          fieldOfStudy: { type: String, default: '' },
          graduationYear: { type: String, default: '' },
        },
      ],
      default: [],
    },

    certifications: {
      type: [
        {
          name: { type: String, default: '' },
          issuer: { type: String, default: '' },
          year: { type: String, default: '' },
        },
      ],
      default: [],
    },

    projects: {
      type: [
        {
          name: { type: String, default: '' },
          description: { type: String, default: '' },
          techStack: stringArray(),
          link: { type: String, default: '' },
        },
      ],
      default: [],
    },

    resumeScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    strengths: stringArray(),
    weaknesses: stringArray(),

    // --- from matchResumeWithJob ---
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    matchingSkills: stringArray(),
    missingSkills: stringArray(),
    experienceCompatibility: {
      compatibility: {
        type: String,
        enum: ['poor', 'fair', 'good', 'excellent'],
        default: 'fair',
      },
      requiredYears: { type: Number, default: 0 },
      candidateYears: { type: Number, default: 0 },
      details: { type: String, default: '' },
    },
    recommendations: stringArray(),

    // Provenance, so a result can be traced back to the model that produced it
    aiModel: { type: String, default: '' },
  },
  { timestamps: true } // provides createdAt and updatedAt
);

module.exports = mongoose.model('Analysis', analysisSchema);
