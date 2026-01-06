# Deployment Guide

## Current Status

✅ **Auto-deployment setup is complete** - Workflow file and SSH keys are configured
⏳ **GitHub Actions unavailable** - Account locked due to billing issue
✅ **Manual deployment available** - Use the script below

---

## Option 1: Resolve GitHub Billing (Recommended)

To enable automatic deployment on every push:

1. **Go to GitHub Billing Settings**:
   https://github.com/settings/billing

2. **Update payment method** or resolve any billing issues

3. **Once resolved**, GitHub Actions will work automatically:
   - Every push to `main` triggers deployment
   - No manual steps needed
   - Deployment logs visible in GitHub Actions tab

---

## Option 2: Manual Deployment (Use Now)

Until GitHub billing is resolved, use this manual deployment script.

### Quick Deploy

```bash
cd /Users/omardoucoure/Documents/Afrique\ Sports/afriquesports-web
./scripts/deploy.sh
```

**That's it!** The script will:
1. Connect to your server via SSH
2. Pull latest code from GitHub
3. Build the Next.js app
4. Reload PM2 (zero downtime)
5. Verify deployment

### Full Manual Workflow

1. **Make your changes locally**
   ```bash
   # Edit files, make changes
   ```

2. **Commit changes**
   ```bash
   git add .
   git commit -m "Your changes"
   ```

3. **Push to GitHub**
   ```bash
   git push origin main
   ```

4. **Deploy to server**
   ```bash
   ./scripts/deploy.sh
   ```

---

## Option 3: Direct SSH Deployment

If you prefer to deploy directly without the script:

```bash
ssh root@159.223.103.16 "cd /mnt/volume_nyc1_01/nextjs-apps/afriquesports-web && git pull origin main && npm run build && pm2 reload ecosystem.config.js"
```

---

## Troubleshooting

### Script fails with "Permission denied"

Make the script executable:
```bash
chmod +x scripts/deploy.sh
```

### "git pull failed" on server

Server has uncommitted changes:
```bash
ssh root@159.223.103.16 "cd /mnt/volume_nyc1_01/nextjs-apps/afriquesports-web && git status"

# Stash changes if needed:
ssh root@159.223.103.16 "cd /mnt/volume_nyc1_01/nextjs-apps/afriquesports-web && git stash"
```

### Build fails

Clear build cache:
```bash
ssh root@159.223.103.16 "cd /mnt/volume_nyc1_01/nextjs-apps/afriquesports-web && rm -rf .next && npm run build"
```

### Website returns 503

Restart PM2:
```bash
ssh root@159.223.103.16 "pm2 restart afriquesports-web"
```

---

## Deployment Checklist

Before deploying, verify:

- [ ] All changes committed locally
- [ ] Code pushed to GitHub
- [ ] No uncommitted changes on server
- [ ] PM2 is running on server

After deploying, check:

- [ ] Website returns 200 OK: https://www.afriquesports.net
- [ ] PM2 status: `ssh root@159.223.103.16 "pm2 list"`
- [ ] No new restarts: `ssh root@159.223.103.16 "pm2 info afriquesports-web | grep restarts"`

---

## Auto-Deployment (When GitHub Billing Resolved)

Once GitHub billing is fixed:

1. **Test auto-deployment**:
   ```bash
   git add .
   git commit -m "Test auto-deploy"
   git push origin main
   ```

2. **Watch deployment**:
   https://github.com/omardoucoure/afriquesports-web/actions

3. **Deployment takes**: 1-5 minutes
4. **Zero downtime**: PM2 graceful reload

You'll never need to run the manual script again! 🎉

---

## Summary

| Method | Command | Auto? | Speed |
|--------|---------|-------|-------|
| **Auto (GitHub Actions)** | `git push` | ✅ Yes | 1-5 min |
| **Manual Script** | `./scripts/deploy.sh` | ❌ No | 1-3 min |
| **Direct SSH** | `ssh root@... "..."` | ❌ No | 1-2 min |

**Current**: Use Manual Script
**After billing fixed**: GitHub Actions (automatic)

---

_Last updated: 2026-01-06_
