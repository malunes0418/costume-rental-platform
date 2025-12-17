# Deployment Guide
## Costume Rental Platform - Post Security Review

---

## ⚠️ CRITICAL: Before Deployment

The application **WILL NOT START** without the following environment variables set:

### Required Environment Variables

```bash
# Generate strong secrets using:
# openssl rand -base64 32

JWT_SECRET=<your_generated_secret_here>
SESSION_SECRET=<your_generated_secret_here>
```

**Why this is important:**
- Hardcoded secrets were removed for security
- Application now enforces secret configuration at startup
- Without these, the application will exit with an error

---

## Environment Setup

### 1. Copy the sample environment file

```bash
cp .env.sample .env
```

### 2. Generate Strong Secrets

```bash
# Generate JWT_SECRET
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env

# Generate SESSION_SECRET
echo "SESSION_SECRET=$(openssl rand -base64 32)" >> .env
```

### 3. Configure Database

Update these values in `.env`:

```bash
DB_HOST=your_database_host
DB_PORT=3306
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=costume_rental
```

### 4. Configure Frontend URL

```bash
FRONTEND_BASE_URL=https://your-frontend-domain.com
```

This is used for CORS configuration. The backend will only accept requests from this origin.

### 5. Configure Email (Optional)

If using email notifications:

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_app_password
```

### 6. Configure OAuth (Optional)

If using Google OAuth:

```bash
OAUTH_GOOGLE_CLIENT_ID=your_google_client_id
OAUTH_GOOGLE_CLIENT_SECRET=your_google_client_secret
OAUTH_GOOGLE_CALLBACK_URL=https://your-api-domain.com/api/auth/google/callback
```

---

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Database Migrations

```bash
npm run migrate
```

### 3. Build the Application

```bash
npm run build
```

---

## Running the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

---

## Security Features Enabled

✅ **Rate Limiting**
- Authentication endpoints: 5 requests per 15 minutes
- General API: 100 requests per 15 minutes
- Admin endpoints: 50 requests per 15 minutes

✅ **File Upload Security**
- Allowed types: JPEG, PNG, GIF, PDF only
- Maximum size: 5MB
- Secure random filenames

✅ **Input Validation**
- Email format validation
- Password complexity requirements:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number

✅ **CORS Protection**
- Only accepts requests from configured frontend URL
- Credentials support enabled
- Restricted HTTP methods

✅ **Request Size Limits**
- JSON payloads: 10MB maximum
- URL-encoded payloads: 10MB maximum

✅ **JWT Token Security**
- HS256 algorithm enforced
- Proper Bearer token validation
- Token structure verification

---

## Monitoring

### Health Check Endpoint

```bash
GET /health
```

Returns:
```json
{
  "status": "ok",
  "timestamp": "2025-12-17T15:00:00.000Z",
  "uptime": 3600
}
```

Use this endpoint for:
- Load balancer health checks
- Monitoring systems
- Container orchestration (Docker, Kubernetes)

---

## Testing the Deployment

### 1. Verify Environment Variables

The application will fail to start if JWT_SECRET or SESSION_SECRET are missing:

```bash
npm start
```

Expected output if successful:
```
Database connected successfully
Server running on port 3000
```

### 2. Test Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{"status":"ok","timestamp":"...","uptime":...}
```

### 3. Test Rate Limiting

Try making multiple login attempts:

```bash
# This should be blocked after 5 attempts
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done
```

After 5 attempts, you should see:
```json
{"message":"Too many authentication attempts, please try again later"}
```

### 4. Test File Upload Validation

Try uploading an invalid file type:

```bash
curl -X POST http://localhost:3000/api/payments/proof \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "proof=@malicious.exe"
```

Expected response:
```json
{"message":"Invalid file type. Allowed extensions: .jpg, .jpeg, .png, .gif, .pdf"}
```

---

## Common Issues

### Issue: Application won't start

**Error:** `Environment variable JWT_SECRET is required but not set`

**Solution:** Set the JWT_SECRET and SESSION_SECRET in your .env file

### Issue: CORS errors in browser

**Error:** Browser console shows CORS policy errors

**Solution:** Ensure FRONTEND_BASE_URL in .env matches your frontend URL exactly

### Issue: Database connection fails

**Error:** `Unable to connect to database`

**Solution:** 
1. Verify database is running
2. Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD in .env
3. Ensure database exists (DB_NAME)
4. Run migrations: `npm run migrate`

### Issue: Rate limiting too strict/loose

**Solution:** Adjust values in `src/middleware/rateLimitMiddleware.ts`:
- `AUTH_MAX_REQUESTS` - for login/register
- `API_MAX_REQUESTS` - for general API
- `ADMIN_MAX_REQUESTS` - for admin operations

---

## Production Checklist

Before deploying to production:

- [ ] Set strong JWT_SECRET (generated with openssl)
- [ ] Set strong SESSION_SECRET (generated with openssl)
- [ ] Configure production database credentials
- [ ] Set correct FRONTEND_BASE_URL
- [ ] Configure email settings (if using notifications)
- [ ] Configure OAuth settings (if using Google login)
- [ ] Test rate limiting is working
- [ ] Test file upload validation is working
- [ ] Test CORS is properly configured
- [ ] Set up monitoring for /health endpoint
- [ ] Configure logging to external service
- [ ] Set up SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Set up automated backups
- [ ] Document incident response procedures

---

## Security Best Practices

### 1. Secrets Management

**Never commit secrets to version control**

Use environment variables or a secrets management service:
- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault
- Google Cloud Secret Manager

### 2. Database Security

- Use strong, unique database passwords
- Restrict database access to application servers only
- Enable SSL/TLS for database connections
- Regular backups with encryption

### 3. Logging and Monitoring

Set up monitoring for:
- Failed authentication attempts
- Rate limit violations
- File upload rejections
- Unusual traffic patterns
- Error rates

### 4. Regular Updates

Keep dependencies updated:

```bash
npm audit
npm update
```

Review security advisories regularly.

### 5. Incident Response

Have a plan for:
- Suspected security breach
- DDoS attack
- Data leak
- Service outage

---

## Support and Maintenance

### Regular Maintenance Tasks

**Weekly:**
- Check logs for errors and warnings
- Review rate limiting metrics
- Monitor disk space (uploads directory)

**Monthly:**
- Update dependencies with security patches
- Review and rotate secrets
- Backup database
- Review user accounts for suspicious activity

**Quarterly:**
- Full security audit
- Performance review
- Capacity planning
- Disaster recovery test

---

## Additional Resources

- **CODE_REVIEW.md** - Complete security review findings
- **SECURITY_FIXES_APPLIED.md** - Detailed list of all security improvements
- **.env.sample** - Template for environment variables

---

**End of Deployment Guide**
