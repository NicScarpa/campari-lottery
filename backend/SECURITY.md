# Security Configuration Guide

## JWT Secret Management

### Development
The `.env` file contains a randomly generated JWT secret for development. This file is **NOT committed to git** (see `.gitignore`).

### Production (Railway or other platforms)

**IMPORTANT:** Never use the development JWT secret in production!

1. Generate a new strong random secret:
   ```bash
   openssl rand -base64 32
   ```

2. Set it as an environment variable in your production platform:

   **Railway:**
   - Go to your project settings
   - Navigate to "Variables" tab
   - Add: `JWT_SECRET=<your-generated-secret>`

   **Heroku:**
   ```bash
   heroku config:set JWT_SECRET=<your-generated-secret>
   ```

   **Vercel/Netlify:**
   - Project Settings → Environment Variables
   - Add `JWT_SECRET` with your generated value

### Security Best Practices

1. **Rotate secrets regularly**: Change JWT_SECRET every 3-6 months
2. **Never commit secrets**: Ensure `.env` is in `.gitignore`
3. **Use different secrets per environment**: Dev, staging, and production should have different secrets
4. **Audit access**: Limit who can view environment variables in production

### What happens if JWT_SECRET is compromised?

If your JWT secret is exposed:
1. Immediately rotate the secret in production
2. All existing user sessions will be invalidated
3. Users will need to log in again
4. Review access logs for suspicious activity

### Server Validation

The server includes automatic validation that prevents startup if:
- `JWT_SECRET` is not set
- `JWT_SECRET` uses a known weak default value

This prevents accidental deployment with insecure configuration.
