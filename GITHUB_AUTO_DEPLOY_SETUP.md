# GitHub Auto-Deploy Setup Guide

This guide explains how to set up automatic deployment to your DigitalOcean server whenever you push to the `main` branch on GitHub.

---

## How It Works

1. You push code to GitHub (`git push origin main`)
2. GitHub Actions workflow triggers automatically
3. GitHub connects to your server via SSH
4. Server pulls latest code, builds, and reloads PM2
5. Deployment status is shown in GitHub Actions tab

---

## Setup Instructions

### Step 1: Generate SSH Key for GitHub Actions

On your **local machine**, run:

```bash
# Generate a dedicated SSH key for GitHub Actions (no passphrase)
ssh-keygen -t ed25519 -C "github-actions@afriquesports-web" -f ~/.ssh/github_actions_afriquesports

# This creates two files:
# - ~/.ssh/github_actions_afriquesports (private key - for GitHub)
# - ~/.ssh/github_actions_afriquesports.pub (public key - for server)
```

**Important**: Press Enter when asked for a passphrase (leave it empty).

### Step 2: Add Public Key to Server

Copy the public key to your DigitalOcean server:

```bash
# Copy public key to server
ssh-copy-id -i ~/.ssh/github_actions_afriquesports.pub root@159.223.103.16

# OR manually:
cat ~/.ssh/github_actions_afriquesports.pub | ssh root@159.223.103.16 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

Test the connection:

```bash
ssh -i ~/.ssh/github_actions_afriquesports root@159.223.103.16 "echo 'SSH key works!'"
```

If you see "SSH key works!", proceed to Step 3.

### Step 3: Add Secrets to GitHub Repository

1. **Go to your GitHub repository**:
   https://github.com/omardoucoure/afriquesports-web

2. **Navigate to Settings → Secrets and variables → Actions**

3. **Click "New repository secret" and add these three secrets**:

#### Secret 1: `SERVER_HOST`
```
Name:  SERVER_HOST
Value: 159.223.103.16
```

#### Secret 2: `SERVER_USER`
```
Name:  SERVER_USER
Value: root
```

#### Secret 3: `SERVER_SSH_KEY`

Get the private key:
```bash
cat ~/.ssh/github_actions_afriquesports
```

Copy the **entire output** (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`).

```
Name:  SERVER_SSH_KEY
Value: (paste the entire private key here)
```

**Example of what the private key looks like**:
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
...
(many lines)
...
AAAADmdpdGh1Yi1hY3Rpb25zQGFmcmlxdWVzcG9ydHMtd2ViAQIDBA==
-----END OPENSSH PRIVATE KEY-----
```

### Step 4: Commit and Push the Workflow File

The workflow file is already created at `.github/workflows/deploy.yml`.

Commit and push it:

```bash
cd /Users/omardoucoure/Documents/Afrique\ Sports/afriquesports-web
git add .github/workflows/deploy.yml GITHUB_AUTO_DEPLOY_SETUP.md
git commit -m "Add GitHub Actions auto-deployment workflow

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
git push origin main
```

### Step 5: Verify Deployment

After pushing, the deployment will trigger automatically!

1. **Go to GitHub Actions tab**:
   https://github.com/omardoucoure/afriquesports-web/actions

2. **Click on the latest workflow run**

3. **Watch the deployment in real-time**

You should see:
```
🚀 Starting deployment...
📥 Pulling latest code from GitHub...
🏗️ Building Next.js application...
🔄 Reloading PM2...
✅ Checking application status...
✅ Website is responding correctly (200 OK)
🎉 Deployment completed successfully!
```

---

## Usage

### Normal Workflow

1. Make changes to your code locally
2. Commit changes:
   ```bash
   git add .
   git commit -m "Your commit message"
   ```
3. Push to GitHub:
   ```bash
   git push origin main
   ```
4. **Deployment happens automatically!** ✨
5. Check GitHub Actions tab to see deployment status

### Check Deployment Status

**On GitHub**:
- Go to: https://github.com/omardoucoure/afriquesports-web/actions
- See all deployment runs with success/failure status

**On Server**:
```bash
ssh root@159.223.103.16 "pm2 info afriquesports-web | grep -E 'status|restarts|uptime'"
```

---

## What the Workflow Does

1. **Pulls latest code** from GitHub to server
2. **Checks if dependencies changed** (package.json)
   - If yes: Runs `npm install --production`
   - If no: Skips installation (faster)
3. **Builds the app**: Runs `npm run build`
4. **Reloads PM2**: Graceful restart (zero downtime)
5. **Verifies deployment**:
   - Checks PM2 status
   - Tests website returns 200 OK
6. **Reports success/failure** in GitHub Actions

---

## Deployment Time

- **With dependency changes**: ~3-5 minutes
- **Without dependency changes**: ~1-2 minutes
- **Zero downtime**: PM2 graceful reload keeps site online

---

## Troubleshooting

### Deployment Fails with "Permission denied"

The SSH key is not properly set up.

**Fix**:
```bash
# Re-add public key to server
cat ~/.ssh/github_actions_afriquesports.pub | ssh root@159.223.103.16 "cat >> ~/.ssh/authorized_keys"

# Test connection
ssh -i ~/.ssh/github_actions_afriquesports root@159.223.103.16 "echo 'Test successful'"
```

### Deployment Fails with "git pull failed"

Git might have local changes conflicting with remote.

**Fix** (on server):
```bash
ssh root@159.223.103.16 "cd /mnt/volume_nyc1_01/nextjs-apps/afriquesports-web && git status"

# If there are uncommitted changes, stash them:
ssh root@159.223.103.16 "cd /mnt/volume_nyc1_01/nextjs-apps/afriquesports-web && git stash"
```

### Build Fails

Check GitHub Actions logs for specific error.

**Common fixes**:
- Node modules issue: SSH into server and run `rm -rf node_modules && npm install`
- Build cache issue: Run `rm -rf .next && npm run build`

### Website Returns 503 After Deployment

PM2 might not have restarted correctly.

**Fix**:
```bash
ssh root@159.223.103.16 "pm2 restart afriquesports-web"
```

### How to Debug Deployment

**View GitHub Actions logs**:
1. Go to https://github.com/omardoucoure/afriquesports-web/actions
2. Click on the failed workflow
3. Click on "Deploy to DigitalOcean" job
4. Expand each step to see detailed logs

**View server logs**:
```bash
ssh root@159.223.103.16 "pm2 logs afriquesports-web --lines 50"
```

---

## Manual Deployment (Fallback)

If GitHub Actions is down or you need to deploy manually:

```bash
ssh root@159.223.103.16 "cd /mnt/volume_nyc1_01/nextjs-apps/afriquesports-web && git pull origin main && npm run build && pm2 reload ecosystem.config.js"
```

---

## Security Notes

1. **SSH Key Security**:
   - The private key is stored as a GitHub Secret (encrypted)
   - Only GitHub Actions can access it
   - The key is dedicated for deployments only

2. **Server Access**:
   - GitHub Actions connects as `root` user
   - Only runs on push to `main` branch
   - All deployment logs are visible in GitHub Actions

3. **Best Practices**:
   - Never commit the private key to your repository
   - Keep GitHub repository private if it contains sensitive config
   - Regularly rotate SSH keys (every 6-12 months)

---

## Advanced Configuration

### Deploy to Specific Branch

Edit `.github/workflows/deploy.yml`:

```yaml
on:
  push:
    branches:
      - main
      - production  # Add more branches
```

### Deploy Only When Specific Files Change

```yaml
on:
  push:
    branches:
      - main
    paths:
      - 'src/**'
      - 'package.json'
      - 'next.config.js'
```

### Add Slack Notifications

Add this step to the workflow:

```yaml
- name: Slack notification
  uses: rtCamp/action-slack-notify@v2
  env:
    SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK }}
    SLACK_MESSAGE: 'Deployment completed!'
```

### Run Tests Before Deployment

Add this step before the deploy step:

```yaml
- name: Run tests
  run: npm test
```

---

## Monitoring Deployments

### GitHub Actions Dashboard

- **Success rate**: Track deployment success/failure
- **Deployment history**: See all past deployments
- **Timing**: Monitor how long deployments take

### Server Monitoring

After each deployment, check:

```bash
# Check PM2 status
ssh root@159.223.103.16 "pm2 list"

# Check restart count (should not increase after successful deploy)
ssh root@159.223.103.16 "pm2 info afriquesports-web | grep restarts"

# Check website
curl -I https://www.afriquesports.net
```

---

## Summary

✅ **Benefits of Auto-Deploy**:
- Push to GitHub → Automatic deployment
- No manual SSH into server needed
- Deployment logs in GitHub Actions
- Zero downtime deployments
- Automatic build and PM2 reload

✅ **Workflow**:
```
Local Changes → Git Push → GitHub Actions → SSH Deploy → Build → PM2 Reload → ✅ Live
```

✅ **Deployment Time**: 1-5 minutes
✅ **Zero Downtime**: Yes (graceful PM2 reload)
✅ **Automatic Rollback**: Manual (via git revert + push)

---

**Setup Status**: ⏳ Pending SSH key configuration

**Next Steps**:
1. Generate SSH key (Step 1)
2. Add public key to server (Step 2)
3. Add secrets to GitHub (Step 3)
4. Push workflow file (Step 4)
5. Test deployment (Step 5)

---

_Created: 2026-01-06_
_Server: 159.223.103.16 (DigitalOcean)_
_Repository: https://github.com/omardoucoure/afriquesports-web_
