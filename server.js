// Import required modules
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
const multer = require("multer");
const admin = require("firebase-admin");
const fs = require("fs");

// Replace with the correct path to your Firebase service account key file
const serviceAccount = require("./path-to-your-service-account-key (2).json");

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://super-mall-1f4d7-default-rtdb.firebaseio.com/",
});
const db = admin.database();

console.log("Firebase initialized:", admin.apps.length > 0);

// Initialize Express app
const app = express();
const PORT = 3000;

// Middleware
const cors = require("cors");
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); // Serve static files from the 'public' folder
app.use(
    session({
        secret: "supermall-secret",
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 30 * 60 * 1000 }, // 30 minutes
    })
);

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, "public\ uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error("Only JPEG, PNG, and GIF files are allowed"));
        }
        cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

// Middleware for role-based access control
function requireRole(role) {
    return (req, res, next) => {
        if (!req.session.user || req.session.user.role !== role) {
            return res.status(403).json({ error: "Access denied" });
        }
        next();
    };
}

// Signup Route
app.post("/signup", (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const usersRef = db.ref("users");
    usersRef.orderByChild("email").equalTo(email).once("value", (snapshot) => {
        if (snapshot.exists()) {
            return res.status(400).json({ error: "User already exists" });
        }

        const newUserRef = usersRef.push();
        newUserRef.set({ email, password, role }, (error) => {
            if (error) {
                console.error("Error saving user:", error);
                return res.status(500).json({ error: "Failed to register user" });
            }
            res.json({ message: "Signup successful" });
        });
    });
});

// Login Route
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    const usersRef = db.ref("users");
    usersRef.orderByChild("email").equalTo(email).once("value", (snapshot) => {
        if (!snapshot.exists()) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const userData = Object.values(snapshot.val())[0];
        if (userData.password !== password) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        req.session.user = userData;
        res.json({ message: "Login successful", role: userData.role });
    });
});

// Logout Route
app.post("/logout", (req, res) => {
    req.session.destroy();
    res.json({ message: "Logout successful" });
});

// Dashboard Route (Role-Based)
app.get("/dashboard", (req, res) => {
    if (!req.session.user) {
        return res.status(403).send("Access denied");
    }

    if (req.session.user.role === "seller") {
        res.sendFile(path.join(__dirname, "public", "sellerdashboard.html"));
    } else if (req.session.user.role === "buyer") {
        res.sendFile(path.join(__dirname, "public", "buyer.html"));
    } else {
        res.status(403).send("Access denied");
    }
});
// Add Shop Route (Sellers Only)
app.post("/add-shop", requireRole("seller"), (req, res) => {
    const { name, floor, category } = req.body;

    // Validate input
    if (!name || !floor || !category) {
        return res.status(400).json({ error: "All fields are required" });
    }

    // Add shop to Firebase
    const shopRef = db.ref("shops").push();
    shopRef.set({
        seller: req.session.user.email, // Assuming the seller's email is stored in the session
        name,
        floor,
        category,
    }, (error) => {
        if (error) {
            console.error("Error adding shop:", error.message);
            return res.status(500).json({ error: "Failed to add shop." });
        }
        res.json({ message: "Shop added successfully" });
    });
});
// Add Product (Sellers Only)
app.post("/add-product", requireRole("seller"), upload.single("image"), (req, res) => {
    const { name, price, category } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || !price || !category || !image) {
        return res.status(400).json({ error: "All fields are required" });
    }

    if (isNaN(price) || price <= 0) {
        return res.status(400).json({ error: "Price must be a positive number" });
    }

    const productRef = db.ref("products").push();
    productRef.set({
        seller: req.session.user.email,
        name,
        price,
        category,
        image,
    });

    res.json({ message: "Product added successfully" });
});

// Add Shop Route (Sellers Only)
app.post("/add-shop", requireRole("seller"), (req, res) => {
    const { name, floor, category } = req.body;

    if (!name || !floor || !category) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const shopRef = db.ref("shops").push();
    shopRef.set({
        seller: req.session.user.email,
        name,
        floor,
        category,
    });

    res.json({ message: "Shop added successfully" });
});

// Get Shops Route
app.get("/shops", requireRole("seller"), (req, res) => {
    db.ref("shops")
        .orderByChild("seller")
        .equalTo(req.session.user.email)
        .once("value")
        .then((snapshot) => {
            const shops = [];
            snapshot.forEach((childSnapshot) => {
                const shop = childSnapshot.val();
                shop.id = childSnapshot.key;
                shops.push(shop);
            });
            res.json(shops);
        })
        .catch((error) => {
            console.error("Error fetching shops:", error.message);
            res.status(500).json({ error: "An unexpected error occurred while fetching shops." });
        });
});

// Default Route for 404
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});