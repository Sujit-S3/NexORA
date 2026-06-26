# NexORA v1.0.0 — Rollback Plan

This document describes how to safely roll back NexORA to a previous state in the event of a production incident.

---

## Rollback Decision Criteria

Initiate a rollback IMMEDIATELY if any of the following occur after deployment:

- [ ] Homepage fails to load (HTTP 500 or blank screen)
- [ ] Login / Registration is broken
- [ ] AI Concierge is permanently offline (not a temporary rate limit)
- [ ] Cart or Checkout throws errors
- [ ] Admin dashboard is inaccessible
- [ ] Database connectivity is lost
- [ ] Security incident detected (unauthorized access, data leak)

---

## Pre-Deployment Backup (Required)

Before every production deployment, run:

```bash
cd server
node backup_db.js
```

Verify the backup file is created in `server/backups/` before proceeding.

---

## Step 1 — Rollback Frontend (Vercel)

1. Log in to [Vercel Dashboard](https://vercel.com)
2. Navigate to the NexORA project
3. Go to **Deployments**
4. Find the previous successful deployment
5. Click **...** → **Promote to Production**
6. Verify the rollback by visiting the production URL

**Estimated time:** 2–5 minutes

---

## Step 2 — Rollback Backend (Render)

1. Log in to [Render Dashboard](https://render.com)
2. Navigate to the NexORA backend service
3. Go to **Deploys**
4. Find the previous successful deploy
5. Click **Rollback to this deploy**
6. Verify the API health endpoint:
   ```
   GET https://your-api.onrender.com/api/health
   ```

**Estimated time:** 3–7 minutes

---

## Step 3 — Rollback Database (if schema was changed)

> ⚠️ Only required if a database migration was applied. For v1.0.0 release, no destructive schema changes were made.

1. Stop the backend server on Render (to prevent writes during restore)
2. Log in to [MongoDB Atlas](https://cloud.mongodb.com)
3. Go to **Backup** → **Restore**
4. Select the backup taken before deployment
5. Restore to the existing cluster or a new cluster
6. Update `MONGO_URI` in Render environment variables if restoring to a new cluster
7. Restart the backend server

**Estimated time:** 15–30 minutes

### Manual Restore (from backup_db.js export)

If Atlas automated backup is not available:

```bash
# Decompress the backup
gunzip server/backups/nexora_backup_<timestamp>.json.gz

# Restore using mongoimport (for each collection)
mongoimport --uri "mongodb+srv://..." --db NexORA --collection products --file products.json
```

---

## Step 4 — Verify Rollback

Run the following smoke tests after rollback:

```bash
# 1. API Health
curl https://your-api.onrender.com/api/health

# 2. AI Health
curl https://your-api.onrender.com/api/ai/health

# 3. Products
curl "https://your-api.onrender.com/api/products?limit=3"
```

Then manually verify in browser:
- [ ] Homepage loads
- [ ] Products page loads
- [ ] Login works
- [ ] AI Concierge responds

---

## Step 5 — Communicate

- Notify the team via your communication channel
- Record the incident: timestamp, root cause, rollback time, status
- Create a post-mortem document

---

## Git Rollback (Emergency)

If code needs to be reverted:

```bash
# Revert to the last stable tag
git checkout v1.0.0-rc1

# Or revert a specific commit
git revert <commit-hash>
git push origin main
```

---

## Environment Variables Emergency Reset

If environment variables are compromised:

1. Rotate `JWT_SECRET` and `JWT_REFRESH_SECRET` immediately (all users will be logged out)
2. Rotate `GEMINI_API_KEY`
3. Rotate `CLOUDINARY_API_SECRET`
4. Update all variables in Render and Vercel dashboards
5. Redeploy both frontend and backend

---

_Keep this document updated after every release._
