const mongoose = require('mongoose');

// --- 1. Student Model ---
const StudentSchema = new mongoose.Schema({
    studentId: { type: String, required: true, unique: true },
    name: String,
    semester: Number,
    hasVoted: { type: Boolean, default: false },
    acceptPledge: { type: Boolean, default: false }
});
const Student = mongoose.model('Student', StudentSchema);

// --- 2. Candidate Model ---
const CandidateSchema = new mongoose.Schema({
    studentId: String,
    name: String,
    photoUrl: String,
    manifesto: String,
    videoUrl: String,
    votes: { type: Number, default: 0 }
});
const Candidate = mongoose.model('Candidate', CandidateSchema);

// --- 3. Settings Model ---
const SettingSchema = new mongoose.Schema({
    _id: String, // Explicitly allow String IDs (e.g. 'global_config')
    admin_password: { type: String, default: 'admin' },
    election_name: String,
    election_start: Date,
    election_end: Date,
    maintenance_mode: { type: Boolean, default: false }
});
const Settings = mongoose.model('Settings', SettingSchema);

// --- 4. Pending Vote Model (Recovery System) ---
const PendingVoteSchema = new mongoose.Schema({
    studentId: { type: String, required: true, unique: true },
    votes: [String],
    createdAt: { type: Date, default: Date.now, expires: 300 } // automatic TTL of 5 mins
});
const PendingVote = mongoose.model('PendingVote', PendingVoteSchema);

module.exports = { Student, Candidate, Settings, PendingVote };
