// 1. Fix .env loading to ensure it finds the file
require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Import Database Models
const { Student, Candidate, Settings, PendingVote } = require('./models');
const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');

const app = express();

// --- MIDDLEWARE ---
app.use(express.json());
app.use(cors());

// --- ENCRYPTION MIDDLEWARE ---
const encryptData = (data) => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), process.env.ENCRYPTION_KEY).toString();
};

app.use((req, res, next) => {
    const originalJson = res.json;
    res.json = function (data) {
        // Skip encryption for errors or if explicitly skipped
        if (data && data.payload) {
            return originalJson.call(this, data);
        }

        // Encrypt everything else
        try {
            const encrypted = encryptData(data);
            return originalJson.call(this, { payload: encrypted });
        } catch (e) {
            console.error("Encryption Error:", e);
            return originalJson.call(this, data);
        }
    };
    next();
});

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;

        if (user.role === 'student') {
            try {
                const config = await Settings.findById('global_config');
                if (config.maintenance_mode) {
                    return res.status(503).json({ success: false, message: "System is under maintenance." });
                }
                const now = new Date();
                if (now < config.election_start || now > config.election_end) {
                    return res.status(503).json({ success: false, message: "Election is not running." });
                }
            } catch (e) {
                return res.sendStatus(500);
            }
        }
        next();
    });
};

const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.sendStatus(403);
    }
};

// --- DATABASE CONNECTION (Serverless Optimized) ---
let cachedDb = null;
const connectToDatabase = async () => {
    if (cachedDb && mongoose.connection.readyState === 1) {
        return cachedDb;
    }
    console.log('🔄 Connecting to MongoDB...');
    cachedDb = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/diskTest', {
        serverSelectionTimeoutMS: 5000 // Fast timeout for serverless environments
    });
    
    // Safe initialization of Global Settings
    try {
        const exists = await Settings.exists({ _id: 'global_config' });
        if (!exists) {
            await Settings.create({
                _id: 'global_config',
                admin_password: 'admin',
                election_start: new Date(),
                election_end: new Date(Date.now() + 86400000), // +24 hours
                maintenance_mode: false
            });
            console.log('⚙️  Default Settings Created');
        }
    } catch (err) {
        // Gracefully ignore duplicate key errors due to concurrent serverless invocations
        if (err.code !== 11000) {
            console.error('Settings initialization warning:', err.message);
        }
    }
    return cachedDb;
};

// Middleware to guarantee active connection before processing any route
app.use(async (req, res, next) => {
    try {
        await connectToDatabase();
        next();
    } catch (err) {
        console.error('❌ MongoDB Connection Error in middleware:', err.message);
        res.status(500).json({ success: false, message: 'Database connection failed. Please try again.' });
    }
});


// --- DATABASE RETRY HELPER ---
const retryDbOp = async (opFn, maxRetries = 3, delay = 1000) => {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
                console.log(`[DB Retry] Database not connected (state: ${mongoose.connection.readyState}). Reconnecting...`);
                try {
                    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/diskTest');
                } catch (connErr) {
                    console.error("[DB Retry] Reconnection failed:", connErr.message);
                }
            }
            return await opFn();
        } catch (error) {
            lastError = error;
            console.error(`[DB Retry] Operation failed (Attempt ${i + 1}/${maxRetries}):`, error.message);
            const isRetryable = 
                error.name === 'MongoNetworkError' ||
                error.name === 'MongoServerSelectionError' ||
                error.name === 'MongoTimeoutError' ||
                error.name === 'MongooseError' ||
                error.message.includes('connection') ||
                error.message.includes('buffering timed out') ||
                error.message.includes('topology') ||
                error.message.includes('heartbeat');
            
            if (isRetryable && i < maxRetries - 1) {
                console.log(`[DB Retry] Waiting ${delay}ms before retrying...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }
    throw lastError;
};

// ==================================================================
//  1. PUBLIC & STUDENT APIs
// ==================================================================

// [API 1] Check Status (Live/Ended/Maintenance)
app.get('/api/status', async (req, res) => {
    try {
        const config = await Settings.findById('global_config');
        if (!config) return res.status(500).json({ message: "Config missing" });
        res.json(config);
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
});

// [API 2] Student Login
app.post('/auth', async (req, res) => {
    const { studentId } = req.body;
    try {
        const config = await Settings.findById('global_config');
        if (config.maintenance_mode) {
            return res.status(503).json({ success: false, message: "System is under maintenance." });
        }

        if (config.election_start > new Date() || config.election_end < new Date()) {
            return res.status(503).json({ success: false, message: "Election is not running." });
        }

        const student = await Student.findOne({ studentId });
        if (!student) {
            return res.status(404).json({ success: false, message: "Student ID not found." });
        }

        const isVoted = await Student.findOne({ studentId, hasVoted: true });
        if (isVoted) {
            return res.status(404).json({ success: false, message: "You have already voted." });
        }

        // Return success and user data
        const token = jwt.sign({ studentId: student.studentId, role: 'student' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({
            success: true,
            token,
            student: {
                studentId: student.studentId,
                name: student.name,
                hasVoted: student.hasVoted,
                semester: student.semester,
                acceptPledge: student.acceptPledge || false
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Login Error" });
    }
});

// [API 2.5] Accept Pledge
app.post('/api/pledge', authenticateToken, async (req, res) => {
    const { studentId } = req.body;
    try {
        const student = await Student.findOneAndUpdate(
            { studentId },
            { acceptPledge: true },
            { new: true }
        );

        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }

        res.json({ success: true, message: "Pledge accepted" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error updating pledge" });
    }
});

// [API 3] Get Candidates
app.get('/api/candidates', authenticateToken, async (req, res) => {
    try {
        const candidates = await Candidate.find();
        res.json(candidates);
    } catch (err) {
        res.status(500).json({ message: "Error fetching candidates" });
    }
});

// [API 4] Cast Vote (Strict 2-Vote Logic)
app.post('/api/vote', authenticateToken, async (req, res) => {
    const { studentId, votes } = req.body; // Expects votes: ["id1", "id2"]

    // Validation: Must select exactly 2
    if (!votes || votes.length !== 2) {
        return res.status(400).json({ success: false, message: "You must select exactly 2 candidates." });
    }

    try {
        // A. Check Election Status
        const config = await retryDbOp(() => Settings.findById('global_config'));
        const now = new Date();
        if (now < config.election_start || now > config.election_end || config.maintenance_mode) {
            return res.status(400).json({ success: false, message: "Election is closed." });
        }

        // B. Security Check: Has this student already voted?
        const student = await retryDbOp(() => Student.findOne({ studentId }));
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found." });
        }

        // Check if there is an active PendingVote for this student (partial failure recovery)
        const pending = await retryDbOp(() => PendingVote.findOne({ studentId }));

        if (student.hasVoted) {
            if (pending) {
                console.log(`[Recovery] Found incomplete vote for student ${studentId}. Resuming candidate increment...`);
                // Database crashed last time after student was marked hasVoted, but before candidates were incremented.
                // We use the stored votes from the PendingVote record to update candidates.
                await retryDbOp(() => Candidate.updateMany(
                    { _id: { $in: pending.votes } },
                    { $inc: { votes: 1 } }
                ));
                // Delete the pending record
                await retryDbOp(() => PendingVote.deleteOne({ studentId }));
                return res.json({ success: true, message: "Vote recovered and cast successfully!" });
            } else {
                return res.status(400).json({ success: false, message: "You have already voted." });
            }
        } else {
            // Clean up any stale pending record if it somehow exists
            if (pending) {
                await retryDbOp(() => PendingVote.deleteOne({ studentId }));
            }
        }

        // C. Create Recovery Record (PendingVote)
        await retryDbOp(() => PendingVote.create({ studentId, votes }));

        // D. Update Student Status
        await retryDbOp(async () => {
            const s = await Student.findOne({ studentId });
            if (s) {
                s.hasVoted = true;
                await s.save();
            }
        });

        // E. Increment Candidate Vote Counts (Update Many)
        await retryDbOp(() => Candidate.updateMany(
            { _id: { $in: votes } },
            { $inc: { votes: 1 } }
        ));

        // F. Delete Recovery Record upon success
        await retryDbOp(() => PendingVote.deleteOne({ studentId }));

        res.json({ success: true, message: "Vote cast successfully!" });

    } catch (error) {
        console.error("Voting Error:", error.message);
        // Identify database connectivity errors
        const isDbError = 
            error.name === 'MongoNetworkError' ||
            error.name === 'MongoServerSelectionError' ||
            error.name === 'MongoTimeoutError' ||
            error.name === 'MongooseError' ||
            error.message.includes('connection') ||
            error.message.includes('buffering timed out') ||
            error.message.includes('topology');

        if (isDbError) {
            res.status(500).json({ 
                success: false, 
                message: "Database connectivity issue detected. The system will retry automatically.", 
                isDbCrash: true 
            });
        } else {
            res.status(500).json({ success: false, message: "Voting failed. Please try again." });
        }
    }
});


// ==================================================================
//  2. ADMINISTRATOR APIs
// ==================================================================

// [API 5] Admin Login
app.post('/api/auth/admin-login', async (req, res) => {
    const { password } = req.body;
    try {
        const config = await Settings.findById('global_config');
        if (password === config.admin_password) {
            const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.json({ success: true, token });
        } else {
            res.status(401).json({ success: false, message: "Invalid Password" });
        }
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// [API 6] Live Analytics
app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const totalVoters = await Student.countDocuments();
        const currentVotes = await Student.countDocuments({ hasVoted: true });
        const candidates = await Candidate.find().select('name votes');

        res.json({ totalVoters, currentVotes, candidates });
    } catch (err) {
        res.status(500).json({ message: "Error loading analytics" });
    }
});

// [API 7] Voter Turnout (Detailed Semester Breakdown)
app.get('/api/admin/turnout', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Detailed aggregation helper
        const getStats = async (sem) => {
            const total = await Student.countDocuments({ semester: sem });
            const voted = await Student.countDocuments({ semester: sem, hasVoted: true });
            const percentage = total === 0 ? 0 : Math.round((voted / total) * 100);
            return { percentage, voted, total };
        };

        const s2 = await getStats(2);
        const s4 = await getStats(4);

        res.json({ s2, s4 });
    } catch (err) {
        res.status(500).json({ message: "Error loading turnout" });
    }
});

// [API 10] Get Students List (Filtered by Semester)
app.get('/api/admin/students', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { semester, hasVoted } = req.query;
        let query = {};

        if (semester) {
            query.semester = parseInt(semester);
        }
        if (hasVoted !== undefined) {
            query.hasVoted = hasVoted === 'true';
        }

        const students = await Student.find(query).select('name studentId hasVoted semester acceptPledge').sort({ studentId: 1 });
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: "Error fetching student list" });
    }
});

// [API 11] Bulk Import Students (Voters)
app.post('/api/admin/students/bulk', authenticateToken, requireAdmin, async (req, res) => {
    const { students } = req.body;
    if (!students || !Array.isArray(students)) {
        return res.status(400).json({ success: false, message: "Invalid students list." });
    }

    try {
        const ops = students.map(s => {
            const studentIdClean = String(s.studentId || '').trim().toUpperCase();
            return {
                updateOne: {
                    filter: { studentId: studentIdClean },
                    update: {
                        $set: {
                            name: String(s.name || '').trim(),
                            semester: parseInt(s.semester) || 1,
                            hasVoted: false,
                            acceptPledge: false
                        }
                    },
                    upsert: true
                }
            };
        });

        if (ops.length > 0) {
            await Student.bulkWrite(ops);
        }

        res.json({ success: true, message: `Successfully imported ${students.length} students.` });
    } catch (err) {
        console.error("Bulk upload failed:", err);
        res.status(500).json({ success: false, message: "Server error during bulk upload." });
    }
});

// [API 12] Bulk Import Candidates
app.post('/api/admin/candidates/bulk', authenticateToken, requireAdmin, async (req, res) => {
    const { candidates } = req.body;
    if (!candidates || !Array.isArray(candidates)) {
        return res.status(400).json({ success: false, message: "Invalid candidates list." });
    }

    try {
        const ops = candidates.map(c => {
            const studentIdClean = String(c.studentId || '').trim().toUpperCase();
            return {
                updateOne: {
                    filter: { studentId: studentIdClean },
                    update: {
                        $set: {
                            name: String(c.name || '').trim(),
                            photoUrl: String(c.photoUrl || '').trim(),
                            manifesto: String(c.manifesto || '').trim(),
                            videoUrl: String(c.videoUrl || '').trim(),
                            votes: 0
                        }
                    },
                    upsert: true
                }
            };
        });

        if (ops.length > 0) {
            await Candidate.bulkWrite(ops);
        }

        res.json({ success: true, message: `Successfully imported ${candidates.length} candidates.` });
    } catch (err) {
        console.error("Bulk candidates import failed:", err);
        res.status(500).json({ success: false, message: "Server error during candidates bulk import." });
    }
});

// [API 8] Update Settings
app.put('/api/admin/settings', authenticateToken, requireAdmin, async (req, res) => {
    try {
        await Settings.findByIdAndUpdate('global_config', req.body);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// [API 9] System Reset (Danger Zone)
app.post('/api/admin/reset', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Reset all Students 
        await Student.updateMany({}, {
            $set: {
                hasVoted: false,
                acceptPledge: false
            }
        });

        // Reset all Candidate votes to 0
        await Candidate.updateMany({}, { votes: 0 });

        console.log("⚠️ SYSTEM RESET PERFORMED");
        res.json({ success: true, message: "System Reset Complete" });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// [API 13] Factory Reset System (Danger Zone)
app.post('/api/admin/factory-reset', authenticateToken, requireAdmin, async (req, res) => {
    try {
        await Student.deleteMany({});
        await Candidate.deleteMany({});
        console.log("⚠️ GLOBAL DATABASE FACTORY RESET PERFORMED");
        res.json({ success: true, message: "Factory Reset Complete. All student and candidate records have been deleted." });
    } catch (err) {
        console.error("Factory Reset Error:", err);
        res.status(500).json({ success: false, message: "Server error during Factory Reset." });
    }
});

// --- SERVE FRONTEND STATIC ASSETS IN PRODUCTION ---
// Root directory will serve Vite's built package under client/dist
app.use(express.static(path.join(__dirname, 'client/dist')));

// SPA Catch-All: redirects any unrecognized non-API requests back to index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

// --- START SERVER ---
const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}

module.exports = app;
