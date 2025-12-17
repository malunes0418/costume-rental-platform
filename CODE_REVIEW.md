# Code Review Report
## Costume Rental Platform

**Review Date:** 2025-12-17  
**Reviewer:** GitHub Copilot Code Review Agent

---

## Executive Summary

This review covers a TypeScript/Node.js costume rental platform application. The codebase demonstrates solid structure but contains several **critical security vulnerabilities**, code quality issues, and areas for improvement.

### Severity Breakdown
- 🔴 **Critical Issues:** 4
- 🟠 **High Priority:** 5
- 🟡 **Medium Priority:** 8
- 🔵 **Low Priority/Recommendations:** 7

---

## 🔴 Critical Security Issues

### 1. Hardcoded Default Secrets in Production Code
**File:** `src/config/env.ts`  
**Lines:** 12, 22  
**Severity:** CRITICAL

```typescript
jwtSecret: process.env.JWT_SECRET || "e8439b97eb9a893e0eef9cb933d055d3",
sessionSecret: process.env.SESSION_SECRET || "$%1:=p4BkPil%hn.U"
```

**Issue:** Default secrets are hardcoded in the codebase. If environment variables are not set, these known secrets will be used in production.

**Impact:**
- Attackers can forge JWT tokens
- Session hijacking is possible
- Complete authentication bypass

**Recommendation:**
```typescript
jwtSecret: process.env.JWT_SECRET || (() => { throw new Error("JWT_SECRET must be set") })(),
sessionSecret: process.env.SESSION_SECRET || (() => { throw new Error("SESSION_SECRET must be set") })(),
```

---

### 2. No Input Validation on Authentication Endpoints
**File:** `src/controllers/AuthController.ts`  
**Lines:** 8-14, 17-24  
**Severity:** CRITICAL

**Issue:** Registration and login endpoints accept user input without validation.

**Vulnerabilities:**
- SQL injection (if raw queries used elsewhere)
- NoSQL injection
- Email validation bypass
- Weak password acceptance

**Recommendation:**
Use express-validator (already in dependencies):
```typescript
import { body, validationResult } from 'express-validator';

// In routes
router.post("/register", [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body('name').optional().trim().isLength({ max: 255 })
], (req, res) => controller.register(req, res));
```

---

### 3. Vulnerable Dependency - nodemailer
**Package:** nodemailer@^6.9.0  
**Current Version:** 6.9.0  
**Severity:** MODERATE (CVE-related)

**Vulnerabilities:**
- GHSA-mm7p-fcc7-pg87: Email to unintended domain due to Interpretation Conflict
- GHSA-rcmh-qjqh-p98v: DoS caused by recursive calls in addressparser

**Recommendation:**
```bash
npm install nodemailer@latest
```
Update package.json to:
```json
"nodemailer": "^7.0.11"
```

---

### 4. Insecure File Upload Configuration
**File:** `src/middleware/uploadMiddleware.ts`  
**Lines:** 8-19  
**Severity:** CRITICAL

**Issue:** No file type validation, size limits, or sanitization.

**Vulnerabilities:**
- Arbitrary file upload (including executables)
- Path traversal attacks
- Disk space exhaustion
- Malicious file execution

**Recommendation:**
```typescript
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, env.fileUploadDir);
  },
  filename(req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    // Validate extension
    const allowedExts = ['.jpg', '.jpeg', '.png', '.pdf'];
    if (!allowedExts.includes(ext)) {
      return cb(new Error('Invalid file type'), '');
    }
    cb(null, unique + ext);
  }
});

export const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type'));
    }
    cb(null, true);
  }
});
```

---

## 🟠 High Priority Issues

### 5. Insufficient Token Validation
**File:** `src/middleware/authMiddleware.ts`  
**Lines:** 5-16  
**Severity:** HIGH

**Issue:** JWT validation doesn't check token expiration explicitly and uses weak error handling.

**Problems:**
- Generic error messages leak no information (good) but provide no logging
- Token type not validated (should be Bearer)
- No token revocation check

**Recommendation:**
```typescript
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const token = header.substring(7); // Remove 'Bearer '
  
  try {
    const decoded = jwt.verify(token, env.jwtSecret, {
      algorithms: ['HS256'] // Explicit algorithm
    }) as any;
    
    if (!decoded.sub || !decoded.role) {
      throw new Error('Invalid token structure');
    }
    
    req.user = { id: decoded.sub, role: decoded.role };
    next();
  } catch (error) {
    // Log error for monitoring (don't expose to client)
    console.error('Auth error:', error);
    res.status(401).json({ message: "Invalid token" });
  }
}
```

---

### 6. Missing Password Complexity Requirements
**File:** `src/services/AuthService.ts`  
**Lines:** 8-17  
**Severity:** HIGH

**Issue:** Passwords are hashed but no complexity requirements enforced.

**Recommendation:**
Add password validation:
```typescript
private validatePassword(password: string): void {
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    throw new Error('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    throw new Error('Password must contain at least one lowercase letter');
  }
  if (!/\d/.test(password)) {
    throw new Error('Password must contain at least one number');
  }
}

async register(email: string, password: string, name?: string) {
  this.validatePassword(password);
  // ... rest of code
}
```

---

### 7. Race Condition in Reservation System
**File:** `src/services/ReservationService.ts`  
**Lines:** 51-87  
**Severity:** HIGH

**Issue:** `addToCart` and `validateAvailability` are not atomic, leading to potential overbooking.

**Scenario:**
1. User A checks availability: 5 items available
2. User B checks availability: 5 items available
3. User A reserves 5 items
4. User B reserves 5 items
5. Result: 10 items reserved when only 5 available

**Recommendation:**
Use database transactions and row-level locking:
```typescript
async addToCart(userId: number, costumeId: number, quantity: number, startDate: Date, endDate: Date) {
  const transaction = await db.sequelize.transaction();
  
  try {
    // Lock the costume row
    const costume = await Costume.findByPk(costumeId, {
      lock: transaction.LOCK.UPDATE,
      transaction
    });
    
    await this.validateAvailability(costumeId, startDate, endDate, quantity);
    
    // ... rest of logic
    
    await transaction.commit();
    return { reservation, item };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
```

---

### 8. Email Injection Vulnerability
**File:** `src/services/NotificationService.ts`  
**Lines:** 15-19, 36-40  
**Severity:** HIGH

**Issue:** User input (email, titles, messages) passed directly to nodemailer without sanitization.

**Impact:**
- Email header injection
- Spam relay
- Phishing attacks

**Recommendation:**
```typescript
private sanitizeEmail(text: string): string {
  // Remove newlines and carriage returns
  return text.replace(/[\r\n]/g, '');
}

async create(userId: number, type: string, title: string, message: string) {
  const notification = await Notification.create({
    user_id: userId,
    type,
    title: this.sanitizeEmail(title),
    message: this.sanitizeEmail(message)
  });
  
  const user = await User.findByPk(userId);
  if (user && user.email) {
    await mailer.sendMail({
      to: this.sanitizeEmail(user.email),
      subject: this.sanitizeEmail(title),
      text: message // Body can have newlines
    });
  }
  return notification;
}
```

---

### 9. Missing Rate Limiting
**Files:** All route files  
**Severity:** HIGH

**Issue:** No rate limiting on any endpoints, especially authentication.

**Impact:**
- Brute force attacks on login
- DoS attacks
- Resource exhaustion

**Recommendation:**
Install and configure express-rate-limit:
```bash
npm install express-rate-limit
```

```typescript
// src/middleware/rateLimitMiddleware.ts
import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many attempts, please try again later'
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

// Apply in routes
router.post("/login", authLimiter, (req, res) => controller.login(req, res));
```

---

## 🟡 Medium Priority Issues

### 10. Inconsistent Error Handling
**Files:** All controllers  
**Severity:** MEDIUM

**Issue:** Error handling is inconsistent. Some places catch and return 400, others might leak stack traces.

**Example:**
```typescript
// Current pattern
catch (e: any) {
  res.status(400).json({ message: e.message });
}
```

**Problems:**
- Always returns 400 (should use appropriate status codes)
- Potential information leakage via error messages
- No error logging

**Recommendation:**
Create a centralized error handler:
```typescript
// src/utils/errorHandler.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
  }
}

// In errorMiddleware.ts
export function errorMiddleware(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }
  
  // Log unexpected errors
  console.error('Unexpected error:', err);
  
  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
    
  res.status(500).json({ message });
}
```

---

### 11. Missing CORS Configuration
**File:** `src/app.ts`  
**Severity:** MEDIUM

**Issue:** CORS package is installed but not configured.

**Impact:**
- Either CORS is not enabled (breaking frontend)
- Or it's too permissive (security risk)

**Recommendation:**
```typescript
import cors from 'cors';

app.use(cors({
  origin: env.frontendBaseUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

### 12. SQL Injection Risk in Future Queries
**Files:** Various service files  
**Severity:** MEDIUM

**Issue:** While Sequelize ORM is used (which prevents SQL injection), there's no guarantee future developers won't use raw queries.

**Recommendation:**
Add documentation and linting rules:
```typescript
// If raw queries are needed, always use parameterized queries
const [results] = await sequelize.query(
  'SELECT * FROM users WHERE email = ?',
  {
    replacements: [email],
    type: QueryTypes.SELECT
  }
);
```

---

### 13. No Request Size Limits
**File:** `src/app.ts`  
**Lines:** 9-10  
**Severity:** MEDIUM

**Issue:** No size limits on JSON/URL-encoded payloads.

**Impact:**
- DoS via large payloads
- Memory exhaustion

**Recommendation:**
```typescript
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

---

### 14. Missing Database Connection Error Handling
**File:** `src/server.ts`  
**Lines:** 5-10  
**Severity:** MEDIUM

**Issue:** Database authentication error is logged but server might continue running.

**Recommendation:**
```typescript
async function bootstrap() {
  try {
    await db.sequelize.authenticate();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Unable to connect to database:', error);
    process.exit(1); // Exit on database failure
  }
  
  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
}
```

---

### 15. Weak Random Number Generation
**File:** `src/middleware/uploadMiddleware.ts`  
**Line:** 13  
**Severity:** MEDIUM

**Issue:** Using `Math.random()` for filename generation.

**Impact:**
- Predictable filenames
- Potential file overwrite vulnerabilities

**Recommendation:**
```typescript
import crypto from 'crypto';

filename(req, file, cb) {
  const unique = `${Date.now()}-${crypto.randomBytes(16).toString('hex')}`;
  const ext = path.extname(file.originalname);
  cb(null, unique + ext);
}
```

---

### 16. Missing Helmet Security Headers
**File:** `src/app.ts`  
**Severity:** MEDIUM

**Issue:** No security headers configured.

**Recommendation:**
```bash
npm install helmet
```

```typescript
import helmet from 'helmet';

app.use(helmet());
```

---

### 17. No Logging Infrastructure
**Files:** Throughout codebase  
**Severity:** MEDIUM

**Issue:** Only console.log/console.error used. No structured logging.

**Impact:**
- Difficult to debug production issues
- No audit trail
- No monitoring/alerting

**Recommendation:**
```bash
npm install winston
```

```typescript
// src/config/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

---

## 🔵 Low Priority / Recommendations

### 18. Missing TypeScript Strict Mode Features
**File:** `tsconfig.json`  
**Lines:** 8  
**Severity:** LOW

**Issue:** While `strict: true` is set, additional checks could be enabled.

**Recommendation:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

---

### 19. Missing API Documentation
**Files:** N/A  
**Severity:** LOW

**Issue:** No API documentation (OpenAPI/Swagger).

**Recommendation:**
Install swagger:
```bash
npm install swagger-ui-express swagger-jsdoc
```

---

### 20. No Health Check Endpoint
**Files:** N/A  
**Severity:** LOW

**Issue:** No `/health` or `/ping` endpoint for monitoring.

**Recommendation:**
```typescript
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

---

### 21. Missing Environment Validation
**File:** `src/config/env.ts`  
**Severity:** LOW

**Issue:** No validation that required environment variables are set.

**Recommendation:**
```typescript
function validateEnv() {
  const required = ['JWT_SECRET', 'SESSION_SECRET', 'DB_HOST', 'DB_NAME'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

validateEnv();
```

---

### 22. Code Duplication in Controllers
**Files:** Multiple controller files  
**Severity:** LOW

**Issue:** Similar try-catch patterns repeated.

**Recommendation:**
Use a wrapper function:
```typescript
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Usage
router.post("/register", asyncHandler(controller.register));
```

---

### 23. Missing Unit Tests
**Files:** N/A  
**Severity:** LOW

**Issue:** No test files found.

**Recommendation:**
Add Jest:
```bash
npm install --save-dev jest @types/jest ts-jest
```

---

### 24. No Database Indexes Defined
**Files:** Model files  
**Severity:** LOW

**Issue:** No indexes defined on frequently queried columns.

**Recommendation:**
Add indexes to models:
```typescript
User.init({
  email: { 
    type: DataTypes.STRING(255), 
    allowNull: false, 
    unique: true,
    // Index is automatic for unique
  }
}, {
  indexes: [
    { fields: ['role'] },
    { fields: ['created_at'] }
  ]
});
```

---

## Code Quality Observations

### Positive Aspects ✅
1. **Good Project Structure**: Clear separation of concerns (models, controllers, services, routes)
2. **TypeScript Usage**: Strong typing helps prevent errors
3. **ORM Usage**: Sequelize prevents basic SQL injection
4. **Password Hashing**: bcrypt properly used for password storage
5. **JWT Implementation**: Token-based auth is appropriate for the use case
6. **Modular Design**: Code is well-organized and maintainable

### Areas for Improvement ⚠️
1. **Security First**: Critical vulnerabilities must be addressed before production
2. **Input Validation**: Add comprehensive validation to all user inputs
3. **Error Handling**: Implement consistent, production-grade error handling
4. **Testing**: Add unit and integration tests
5. **Documentation**: Add API documentation and inline comments for complex logic
6. **Monitoring**: Add logging, metrics, and health checks

---

## Recommended Action Plan

### Phase 1: Critical Security Fixes (Do Immediately)
1. ✅ Remove hardcoded secrets
2. ✅ Add input validation to all endpoints
3. ✅ Update nodemailer to latest version
4. ✅ Add file upload validation
5. ✅ Fix race condition in reservation system

### Phase 2: High Priority (Before Production)
1. Enhance token validation
2. Add password complexity requirements
3. Implement email sanitization
4. Add rate limiting
5. Add CORS configuration

### Phase 3: Medium Priority (Production Hardening)
1. Implement centralized error handling
2. Add security headers (Helmet)
3. Add request size limits
4. Improve database error handling
5. Add structured logging
6. Use cryptographically secure random generation

### Phase 4: Long Term Improvements
1. Add comprehensive test suite
2. Add API documentation
3. Add monitoring and alerting
4. Optimize database with indexes
5. Add health check endpoints
6. Enable additional TypeScript strict checks

---

## Security Summary

**Overall Security Score: 4/10** ⚠️

The application has a solid foundation but contains several critical security vulnerabilities that **MUST** be addressed before deployment to production. The most critical issues are:

1. Hardcoded secrets in source code
2. Missing input validation
3. Insecure file upload
4. Race conditions in booking system
5. Missing rate limiting

With the recommended fixes implemented, the security score could improve to **8/10**.

---

## Conclusion

This codebase shows good architectural decisions and clean code structure. However, it requires significant security hardening before it can be safely deployed to production. The critical issues identified are common in early-stage projects but must be addressed to prevent security breaches.

**Recommendation:** Do NOT deploy to production until at least Phase 1 and Phase 2 items are completed.

---

**End of Code Review Report**
