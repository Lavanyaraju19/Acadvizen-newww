# Acadvizen Headless CMS - Deployment Guide

**Version:** 1.0  
**Last Updated:** 2026-07-22  
**Target Audience:** DevOps Engineers and System Administrators

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Application Deployment](#application-deployment)
5. [Configuration](#configuration)
6. [Monitoring](#monitoring)
7. [Scaling](#scaling)
8. [Security](#security)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

**Minimum:**
- Node.js 18.x or higher
- 2GB RAM
- 20GB disk space
- 1 CPU core

**Recommended:**
- Node.js 20.x
- 4GB RAM
- 50GB disk space
- 2 CPU cores

### Software Requirements

- **Node.js:** 18.x or higher
- **npm:** 9.x or higher
- **Git:** For version control
- **Supabase Account:** For database and authentication

### Accounts Required

1. **Supabase Account:** https://supabase.com
2. **Vercel Account** (optional): For easy deployment
3. **Domain Name:** For production URL

---

## Environment Setup

### Local Development

1. **Clone the repository:**
```bash
git clone https://github.com/your-repo/acadvizen-cms.git
cd acadvizen-cms
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env.local
```

4. **Configure environment variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

5. **Run development server:**
```bash
npm run dev
```

Access the application at `http://localhost:3000`

### Production Environment

1. **Create production database:**
   - Log in to Supabase
   - Create a new project
   - Note down the project URL and keys

2. **Set up production environment:**
```bash
# On production server
git clone https://github.com/your-repo/acadvizen-cms.git
cd acadvizen-cms
npm install --production
```

3. **Configure production environment:**
```bash
# Create .env.production
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
NODE_ENV=production
```

---

## Database Setup

### Supabase Setup

1. **Create a new project:**
   - Go to https://supabase.com
   - Click "New Project"
   - Enter project name and database password
   - Wait for project to be provisioned

2. **Run migrations:**
```bash
# Apply all migrations in order
psql -h your-project.supabase.co -U postgres -d postgres -f supabase/migrations/20260211_cms.sql
psql -h your-project.supabase.co -U postgres -d postgres -f supabase/migrations/20260313_cms_unification.sql
# ... continue with all migrations
```

3. **Or use Supabase SQL Editor:**
   - Go to SQL Editor in Supabase dashboard
   - Copy and paste migration files
   - Run each migration in order

### Database Backup

1. **Manual backup:**
```bash
pg_dump -h your-project.supabase.co -U postgres -d postgres > backup.sql
```

2. **Automated backup:**
   - Configure in Supabase dashboard
   - Set up daily backups
   - Configure retention period (7-30 days)

---

## Application Deployment

### Vercel Deployment (Recommended)

1. **Connect repository:**
   - Log in to Vercel
   - Click "Add New Project"
   - Import your Git repository

2. **Configure environment variables:**
   - Go to Settings > Environment Variables
   - Add all required environment variables

3. **Deploy:**
   - Vercel automatically deploys on push
   - Access your site at `https://your-project.vercel.app`

4. **Custom domain:**
   - Go to Settings > Domains
   - Add your custom domain
   - Configure DNS records

### Docker Deployment

1. **Build Docker image:**
```bash
docker build -t acadvizen-cms:latest .
```

2. **Run container:**
```bash
docker run -d \
  -p 3000:3000 \
  --env-file .env.production \
  --name acadvizen-cms \
  acadvizen-cms:latest
```

3. **Docker Compose:**
```yaml
version: '3.8'
services:
  cms:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    restart: unless-stopped
```

### Self-Hosted Deployment

1. **Build application:**
```bash
npm run build
```

2. **Start production server:**
```bash
npm start
```

3. **Use PM2 for process management:**
```bash
npm install -g pm2
pm2 start npm --name "acadvizen-cms" -- start
pm2 save
pm2 startup
```

---

## Configuration

### Environment Variables

Required variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

Optional variables:

```env
# Email Configuration (for notifications)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password

# Analytics (optional)
NEXT_PUBLIC_GA_ID=your-google-analytics-id
```

### Next.js Configuration

`next.config.js` optimizations:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig
```

---

## Monitoring

### Application Monitoring

1. **Health Check Endpoint:**
```bash
curl https://your-domain.com/api/health
```

2. **Supabase Monitoring:**
   - Database performance
   - API response times
   - Error rates
   - Storage usage

3. **Application Logs:**
   - Check server logs for errors
   - Monitor console errors in browser
   - Review Supabase logs

### Performance Monitoring

1. **Response Time Monitoring:**
   - Target: < 200ms for API calls
   - Target: < 3s for page loads

2. **Database Performance:**
   - Monitor query times
   - Check for slow queries
   - Optimize indexes

3. **Error Tracking:**
   - Monitor 404 errors
   - Track 500 errors
   - Review error logs

---

## Scaling

### Horizontal Scaling

1. **Load Balancer:**
   - Use Nginx or AWS ALB
   - Distribute traffic across multiple instances

2. **Session Storage:**
   - Use Redis for session storage
   - Configure sticky sessions if needed

### Vertical Scaling

1. **Increase Resources:**
   - More CPU cores
   - More RAM
   - Faster storage (SSD)

2. **Database Scaling:**
   - Upgrade Supabase plan
   - Add read replicas
   - Use connection pooling

### Caching Strategy

1. **Application Cache:**
   - Next.js built-in caching
   - CDN for static assets

2. **Database Cache:**
   - Supabase query cache
   - Implement Redis for frequently accessed data

---

## Security

### Authentication Security

1. **Strong Passwords:**
   - Enforce minimum 12 characters
   - Require special characters
   - Implement password rotation

2. **Session Management:**
   - Use HTTP-only cookies
   - Set appropriate session timeout
   - Implement session revocation

3. **Two-Factor Authentication:**
   - Enable 2FA for admin accounts
   - Use Supabase Auth 2FA

### API Security

1. **Rate Limiting:**
   - Implement rate limiting on API endpoints
   - Prevent abuse and DDoS attacks

2. **CORS Configuration:**
   - Restrict CORS to trusted domains
   - Disable CORS for public APIs

3. **Input Validation:**
   - Validate all user inputs
   - Sanitize data before database insertion

### Database Security

1. **Row-Level Security:**
   - Enable RLS on all tables
   - Implement proper policies
   - Regularly review policies

2. **Encryption:**
   - Encrypt sensitive data at rest
   - Use TLS for data in transit
   - Manage encryption keys properly

3. **Backup Security:**
   - Encrypt backups
   - Store backups securely
   - Test restore procedures

---

## Troubleshooting

### Common Deployment Issues

#### Build Fails

**Problem:** Build process fails

**Solutions:**
1. Check Node.js version (must be 18.x+)
2. Clear node_modules and reinstall
3. Check for missing environment variables
4. Review build logs for specific errors

#### Database Connection Errors

**Problem:** Cannot connect to Supabase

**Solutions:**
1. Verify Supabase URL and keys
2. Check network connectivity
3. Verify RLS policies
4. Check database status in Supabase dashboard

#### Authentication Issues

**Problem:** Users cannot log in

**Solutions:**
1. Verify Supabase Auth configuration
2. Check email confirmation settings
3. Review session cookie configuration
4. Check RLS policies on profiles table

#### Performance Issues

**Problem:** Site is slow

**Solutions:**
1. Check database query performance
2. Review caching strategy
3. Optimize images
4. Check CDN configuration

### Emergency Procedures

#### Database Recovery

1. **Restore from backup:**
```bash
psql -h your-project.supabase.co -U postgres -d postgres < backup.sql
```

2. **Point-in-time recovery:**
   - Use Supabase's point-in-time recovery
   - Select recovery point
   - Initiate recovery

#### Rollback Deployment

1. **Revert to previous commit:**
```bash
git revert HEAD
git push
```

2. **Or rollback to specific commit:**
```bash
git checkout <commit-hash>
git push -f origin main
```

---

## Maintenance

### Regular Maintenance Tasks

**Daily:**
- Monitor error logs
- Check backup status
- Review performance metrics

**Weekly:**
- Review security logs
- Check for updates
- Monitor storage usage

**Monthly:**
- Test backup restore
- Review RLS policies
- Audit user access
- Performance review

### Update Procedure

1. **Test updates in staging:**
   - Deploy to staging environment
   - Run full test suite
   - Verify all functionality

2. **Backup before update:**
   - Create database backup
   - Backup application files
   - Document current version

3. **Deploy update:**
   - Deploy to production
   - Monitor for errors
   - Have rollback plan ready

4. **Post-update verification:**
   - Test all critical functionality
   - Monitor performance
   - Review logs for errors

---

## Conclusion

This deployment guide provides comprehensive instructions for deploying the Acadvizen Headless CMS to production. Follow the procedures carefully and ensure proper monitoring and maintenance for optimal performance.

**Last Updated:** 2026-07-22  
**Version:** 1.0
