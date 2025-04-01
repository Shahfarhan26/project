require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const db = require('./database');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('../public'));

// File upload config
const upload = multer({
  dest: 'uploads/licenses/',
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});
// Generate JWT token
function generateToken(user) {
    return jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET || 'your_secret_key',
        { expiresIn: '7d' }
    );
}
// ===== Routes ===== //

// Auth Routes
app.post('/api/auth/register', upload.single('license_image'), async (req, res) => {
  /* Registration logic from earlier */
});

app.post('/api/auth/login', async (req, res) => {
  /* Login logic from earlier */
});

app.get('/api/auth/verify', authenticate, async (req, res) => {
  /* Verification endpoint from earlier */
});
app.post('/api/auth/register', upload.single('license_image'), async (req, res) => {
    try {
        const { full_name, username, email, password, license_number } = req.body;
        
        // Check if user exists
        const [existing] = await db.query(
            'SELECT * FROM users WHERE username = ? OR email = ?', 
            [username, email]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Save license image
        const licenseImage = req.file ? 
            `/licenses/${req.file.filename}${path.extname(req.file.originalname)}` : 
            null;
        
        // Create user
        const [result] = await db.query(
            `INSERT INTO users 
            (full_name, username, email, password, license_number, license_image) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [full_name, username, email, hashedPassword, license_number, licenseImage]
        );
        
        // Create verification request
        await db.query(
            `INSERT INTO verification_requests (user_id) VALUES (?)`,
            [result.insertId]
        );
        
        res.status(201).json({ message: 'Registration successful' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Find user
        const [users] = await db.query(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, username]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const user = users[0];
        
        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Generate token
        const token = generateToken(user);
        
        res.json({
            token,
            license_verified: user.license_verified,
            role: user.role
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Protected Routes
app.get('/api/products', authenticate, checkLicenseVerified, async (req, res) => {
    try {
        const [products] = await db.query('SELECT * FROM products');
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ===== Middleware ===== //

function authenticate(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}

function checkLicenseVerified(req, res, next) {
    // In a real app, you would query the database for current verification status
    if (!req.user.license_verified) {
        return res.status(403).json({ message: 'License not verified' });
    }
    next();
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));