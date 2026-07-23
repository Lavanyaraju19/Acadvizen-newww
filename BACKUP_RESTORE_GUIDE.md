# Acadvizen Headless CMS - Backup & Restore Guide

**Version:** 1.0  
**Last Updated:** 2026-07-22  
**Target Audience:** System Administrators

---

## Table of Contents

1. [Backup Strategy](#backup-strategy)
2. [Automated Backups](#automated-backups)
3. [Manual Backups](#manual-backups)
4. [Restore Procedures](#restore-procedures)
5. [Disaster Recovery](#disaster-recovery)
6. [Backup Testing](#backup-testing)

---

## Backup Strategy

### Backup Types

1. **Database Backups**
   - Full database dumps
   - Incremental backups
   - Transaction logs

2. **Application Backups**
   - Source code repository
   - Configuration files
   - Static assets

3. **Media Backups**
   - Supabase Storage backups
   - Image assets
   - File uploads

### Backup Schedule

**Daily:**
- Database full backup (3 AM UTC)
- Transaction log backup (every 6 hours)

**Weekly:**
- Full application backup
- Media storage backup

**Monthly:**
- Archive old backups
- Test restore procedures

### Retention Policy

- Daily backups: Retain for 7 days
- Weekly backups: Retain for 4 weeks
- Monthly backups: Retain for 12 months

---

## Automated Backups

### Supabase Automated Backups

1. **Enable in Supabase Dashboard:**
   - Go to Settings > Database
   - Enable "Automatic Backups"
   - Set backup schedule
   - Configure retention period

2. **Configure Backup Window:**
   - Set backup time during low traffic
   - Recommended: 2 AM - 4 AM UTC
   - Duration: 1-2 hours

### Custom Backup Scripts

```bash
#!/bin/bash
# backup-database.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="acadvizen_cms_${DATE}.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Run backup
pg_dump -h $SUPABASE_URL -U postgres -d postgres > $BACKUP_DIR/$BACKUP_FILE

# Compress backup
gzip $BACKUP_DIR/$BACKUP_FILE

# Upload to backup storage
aws s3 cp $BACKUP_DIR/${BACKUP_FILE}.gz s3://backup-bucket/

# Clean up old backups (keep last 7 days)
find $BACKUP_DIR -name "acadvizen_cms_*.sql.gz" -mtime +7 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

### Cron Job Scheduling

```bash
# Add to crontab
0 3 * * * /path/to/backup-database.sh
```

---

## Manual Backups

### Database Backup

**Using pg_dump:**
```bash
pg_dump -h your-project.supabase.co -U postgres -d postgres > backup.sql
```

**Using Supabase CLI:**
```bash
supabase db dump -f backup.sql
```

### Application Backup

**Backup source code:**
```bash
git archive --format=tar.gz --output=app-backup.tar.gz HEAD
```

**Backup configuration:**
```bash
tar -czf config-backup.tar.gz .env.production .env.local
```

### Media Backup

**Using Supabase Storage CLI:**
```bash
supabase storage download --bucket-id <bucket-id> --recursive media-backup/
```

---

## Restore Procedures

### Database Restore

**From SQL dump:**
```bash
psql -h your-project.supabase.co -U postgres -d postgres < backup.sql
```

**Using Supabase CLI:**
```bash
supabase db restore backup.sql
```

**Point-in-Time Recovery:**
1. Go to Supabase Dashboard
2. Select Database > Backups
3. Choose recovery point
4. Initiate recovery

### Application Restore

**Restore from Git:**
```bash
git checkout <commit-hash>
npm install
npm run build
npm start
```

**Restore configuration:**
```bash
tar -xzf config-backup.tar.gz
```

### Media Restore

**Using Supabase Storage CLI:**
```bash
supabase storage upload --bucket-id <bucket-id> --recursive media-backup/
```

---

## Disaster Recovery

### Disaster Scenarios

#### Database Corruption

**Recovery Steps:**
1. Identify last known good backup
2. Stop application traffic
3. Restore database from backup
4. Verify data integrity
5. Restart application
6. Monitor for errors

#### Data Loss

**Recovery Steps:**
1. Assess extent of data loss
2. Determine point of failure
3. Restore from most recent backup
4. Manually recreate lost data if needed
5. Implement measures to prevent recurrence

#### Server Failure

**Recovery Steps:**
1. Provision new server
2. Install dependencies
3. Restore application files
4. Restore database
5. Update DNS records
6. Test functionality

### Recovery Plan

**Preparation:**
1. Document all procedures
2. Test restore procedures regularly
3. Maintain off-site backups
4. Have contact information ready
5. Define roles and responsibilities

**Execution:**
1. Assess impact and scope
2. Notify stakeholders
3. Execute recovery procedures
4. Verify system integrity
5. Document the incident
6. Conduct post-mortem

---

## Backup Testing

### Test Restore Procedure

**Monthly Test:**
1. Take test backup
2. Restore to staging environment
3. Verify data integrity
4. Test application functionality
5. Document results

**Test Checklist:**
- [ ] Backup completes successfully
- [ ] Backup file is valid
- [ ] Restore completes successfully
- [ ] Data integrity verified
- [ ] Application functions correctly
- [ ] No data corruption
- [ ] Performance acceptable

### Backup Verification

**Daily Checks:**
- Backup job completed successfully
- Backup file size is reasonable
- No error messages in logs

**Weekly Checks:**
- Test restore of latest backup
- Verify backup retention policy
- Check storage capacity

**Monthly Checks:**
- Full disaster recovery test
- Review backup strategy
- Update procedures as needed

---

## Backup Security

### Encryption

1. **Encrypt Backups:**
```bash
gpg --encrypt --recipient admin@example.com backup.sql > backup.sql.gpg
```

2. **Store Securely:**
   - Use encrypted storage (S3 with SSE)
   - Limit access to backup files
   - Rotate encryption keys

### Access Control

1. **Restrict Access:**
   - Only admin users can access backups
   - Use IAM roles for cloud storage
   - Audit backup access logs

2. **Key Management:**
   - Store encryption keys securely
   - Rotate keys regularly
   - Never commit keys to repository

---

## Monitoring

### Backup Monitoring

**Metrics to Monitor:**
- Backup job success/failure
- Backup file size
- Backup duration
- Storage usage
- Restore success rate

**Alerts:**
- Backup job failed
- Backup file size unusual
- Storage capacity warning
- Restore failed

### Logging

**Backup Logs:**
```bash
# Log backup operations
echo "$(date): Backup started" >> /var/log/cms-backup.log
echo "$(date): Backup completed" >> /var/log/cms-backup.log
```

**Log Retention:**
- Keep logs for 90 days
- Archive old logs
- Regularly review logs

---

## Conclusion

This backup and restore guide provides comprehensive procedures for protecting Acadvizen Headless CMS data. Regular testing and monitoring ensure that backups are reliable and recovery procedures are effective.

**Last Updated:** 2026-07-22  
**Version:** 1.0
