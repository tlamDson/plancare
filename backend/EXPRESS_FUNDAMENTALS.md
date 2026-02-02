# Express.js Fundamentals Guide

## 📚 Table of Contents

1. [What is Express.js?](#what-is-expressjs)
2. [Basic Server Setup](#basic-server-setup)
3. [Middleware](#middleware)
4. [Routing](#routing)
5. [Request & Response Objects](#request--response-objects)
6. [Error Handling](#error-handling)
7. [Project Structure](#project-structure)
8. [Common Patterns](#common-patterns)

---

## What is Express.js?

Express.js is a **minimal and flexible Node.js web application framework** that provides a robust set of features for building web and mobile applications.

### Key Features:
- **Routing**: Define how your app responds to client requests
- **Middleware**: Functions that execute during the request-response cycle
- **HTTP Methods**: Support for GET, POST, PUT, DELETE, etc.
- **Template Engines**: Render dynamic HTML pages
- **Static Files**: Serve images, CSS, JavaScript files

---

## Basic Server Setup

### Minimal Express Server

```typescript
import express from "express";

const app = express();
const PORT = 3000;

// Define a route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### What Each Part Does:

| Code | Purpose |
|------|---------|
| `express()` | Creates an Express application instance |
| `app.get()` | Defines a route for GET requests |
| `req` | Request object (contains client data) |
| `res` | Response object (sends data back to client) |
| `app.listen()` | Starts the server on specified port |

---

## Middleware

Middleware functions are functions that have access to the **request object (req)**, the **response object (res)**, and the **next middleware function**.

### Middleware Flow

```
Request → Middleware 1 → Middleware 2 → Route Handler → Response
```

### Types of Middleware

#### 1. Application-Level Middleware
```typescript
// Runs for EVERY request
app.use((req, res, next) => {
  console.log("Time:", Date.now());
  next(); // Pass to next middleware
});
```

#### 2. Router-Level Middleware
```typescript
const router = express.Router();

router.use((req, res, next) => {
  console.log("Router middleware");
  next();
});
```

#### 3. Built-in Middleware
```typescript
// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static("public"));

// Parse raw bodies (for webhooks)
app.use(express.raw({ type: "application/json" }));
```

#### 4. Third-Party Middleware
```typescript
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

app.use(cors());           // Enable CORS
app.use(helmet());         // Security headers
app.use(morgan("dev"));    // Request logging
```

#### 5. Error-Handling Middleware
```typescript
// Must have 4 parameters
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});
```

### Middleware Execution Order

```typescript
// Order MATTERS! Middleware runs in the order it's defined

app.use(express.json());           // 1st - Parse body
app.use(cors());                   // 2nd - Enable CORS
app.use("/api/users", userRoutes); // 3rd - Handle routes
app.use(errorHandler);             // 4th - Handle errors (always last)
```

---

## Routing

### Basic Routes

```typescript
// GET - Retrieve data
app.get("/users", (req, res) => {
  res.json({ users: [] });
});

// POST - Create data
app.post("/users", (req, res) => {
  const newUser = req.body;
  res.status(201).json(newUser);
});

// PUT - Update data (full replacement)
app.put("/users/:id", (req, res) => {
  const { id } = req.params;
  res.json({ message: `Updated user ${id}` });
});

// PATCH - Update data (partial)
app.patch("/users/:id", (req, res) => {
  const { id } = req.params;
  res.json({ message: `Patched user ${id}` });
});

// DELETE - Remove data
app.delete("/users/:id", (req, res) => {
  const { id } = req.params;
  res.json({ message: `Deleted user ${id}` });
});
```

### Route Parameters

```typescript
// Single parameter
app.get("/users/:id", (req, res) => {
  const userId = req.params.id;  // "123"
  res.json({ userId });
});

// Multiple parameters
app.get("/users/:userId/posts/:postId", (req, res) => {
  const { userId, postId } = req.params;
  res.json({ userId, postId });
});

// Optional parameters (use ? in path)
app.get("/users/:id?", (req, res) => {
  if (req.params.id) {
    res.json({ user: req.params.id });
  } else {
    res.json({ users: [] });
  }
});
```

### Query Strings

```typescript
// URL: /search?name=john&age=25
app.get("/search", (req, res) => {
  const { name, age } = req.query;
  res.json({ name, age });  // { name: "john", age: "25" }
});
```

### Express Router (Modular Routes)

```typescript
// routes/users.ts
import express from "express";
const router = express.Router();

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;

// index.ts
import userRoutes from "./routes/users";
app.use("/api/users", userRoutes);
```

### Route Methods

| Method | HTTP Verb | Use Case |
|--------|-----------|----------|
| `app.get()` | GET | Retrieve data |
| `app.post()` | POST | Create new data |
| `app.put()` | PUT | Replace existing data |
| `app.patch()` | PATCH | Update part of data |
| `app.delete()` | DELETE | Remove data |
| `app.all()` | ALL | Match all HTTP methods |
| `app.use()` | ALL | Middleware for all methods |

---

## Request & Response Objects

### Request Object (req)

```typescript
app.post("/users", (req, res) => {
  // Request body (from POST/PUT/PATCH)
  const body = req.body;          // { name: "John", email: "john@example.com" }
  
  // URL parameters
  const params = req.params;      // { id: "123" }
  
  // Query string
  const query = req.query;        // { page: "1", limit: "10" }
  
  // Headers
  const headers = req.headers;    // { "content-type": "application/json" }
  const authHeader = req.headers["authorization"];
  
  // Request method
  const method = req.method;      // "POST"
  
  // Request URL
  const url = req.url;            // "/users?page=1"
  const path = req.path;          // "/users"
  
  // IP address
  const ip = req.ip;              // "127.0.0.1"
  
  // Cookies (requires cookie-parser)
  const cookies = req.cookies;    // { sessionId: "abc123" }
});
```

### Response Object (res)

```typescript
app.get("/example", (req, res) => {
  // Send JSON
  res.json({ message: "Hello" });
  
  // Send plain text
  res.send("Hello World");
  
  // Send with status code
  res.status(201).json({ created: true });
  
  // Send error status
  res.status(404).json({ error: "Not found" });
  
  // Set headers
  res.set("X-Custom-Header", "value");
  res.setHeader("Content-Type", "application/json");
  
  // Redirect
  res.redirect("/new-url");
  res.redirect(301, "/permanent-redirect");
  
  // Send file
  res.sendFile("/path/to/file.pdf");
  
  // Download file
  res.download("/path/to/file.pdf", "custom-name.pdf");
  
  // Render template (requires template engine)
  res.render("index", { title: "Home" });
  
  // Set cookie
  res.cookie("name", "value", { httpOnly: true });
  
  // Clear cookie
  res.clearCookie("name");
  
  // End response without data
  res.end();
});
```

### Common HTTP Status Codes

| Code | Meaning | Use Case |
|------|---------|----------|
| 200 | OK | Successful GET/PUT/PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Not logged in |
| 403 | Forbidden | No permission |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry |
| 500 | Internal Server Error | Server error |

---

## Error Handling

### Try-Catch in Async Routes

```typescript
app.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Async Handler Wrapper

```typescript
// utils/asyncHandler.ts
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Usage
app.get("/users", asyncHandler(async (req, res) => {
  const users = await User.find();
  res.json(users);
}));
```

### Global Error Handler

```typescript
// Must be LAST middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
});
```

### Custom Error Class

```typescript
// utils/AppError.ts
class AppError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Usage
app.get("/users/:id", async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError("User not found", 404));
  }
  res.json(user);
});
```

---

## Project Structure

### Basic Structure

```
backend/
├── src/
│   ├── index.ts           # Entry point, starts server
│   ├── app.ts             # Express app setup (optional)
│   ├── config/
│   │   └── db.ts          # Database connection
│   ├── controllers/
│   │   └── userController.ts
│   ├── middlewares/
│   │   ├── auth.ts
│   │   └── errorHandler.ts
│   ├── models/
│   │   └── User.ts
│   ├── routes/
│   │   └── userRoutes.ts
│   ├── services/
│   │   └── userService.ts
│   ├── types/
│   │   └── express.d.ts
│   └── utils/
│       └── asyncHandler.ts
├── dist/                   # Compiled JavaScript
├── .env                    # Environment variables
├── package.json
└── tsconfig.json
```

### Layer Responsibilities

| Layer | Purpose | Example |
|-------|---------|---------|
| **Routes** | Define endpoints | `router.get("/users", getUsers)` |
| **Controllers** | Handle request/response | Parse input, call service, send response |
| **Services** | Business logic | Create user, validate data |
| **Models** | Database schema | User schema with Mongoose |
| **Middlewares** | Pre-processing | Authentication, logging |
| **Utils** | Helper functions | Error handlers, formatters |

---

## Common Patterns

### 1. Environment Variables

```typescript
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 3000;
const DB_URL = process.env.MONGO_URI;
```

### 2. CORS Setup

```typescript
import cors from "cors";

// Allow all origins
app.use(cors());

// Allow specific origin
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
```

### 3. Body Size Limit

```typescript
app.use(express.json({ limit: "10mb" }));
```

### 4. Request Logging

```typescript
import morgan from "morgan";
app.use(morgan("dev")); // Logs: GET /users 200 5ms
```

### 5. Graceful Shutdown

```typescript
const server = app.listen(PORT);

process.on("SIGTERM", () => {
  server.close(() => {
    console.log("Server closed");
    mongoose.connection.close();
  });
});
```

### 6. Health Check Endpoint

```typescript
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});
```

---

## Quick Reference

### Complete Express App Template

```typescript
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

// Error handler (must be last)
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

// Connect to database and start server
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
```

---

## 📚 Resources

- [Express.js Official Docs](https://expressjs.com/)
- [Express.js API Reference](https://expressjs.com/en/4x/api.html)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [MDN HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)

---

*Created for TravelPlan Project - January 2026*
