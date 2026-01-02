# How to Get PostHog Personal API Key

## Quick Steps

1. **Open PostHog Settings:**
   - Go to: https://us.posthog.com/settings/user-api-keys
   - Log in with your PostHog account

2. **Create New Personal API Key:**
   - Click **"Create new key"**
   - Give it a name: `Afrique Sports Production`
   - Select scope: **✅ Check "Read"** (required for analytics API)
   - Click **"Create key"**

3. **Copy the API Key:**
   - PostHog will show the key value (starts with `phx_`)
   - **IMPORTANT:** Copy it immediately - you won't see it again!
   - Example format: `phx_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

4. **Give me the key value:**
   - Paste it in the chat
   - I'll add it to Vercel environment variables for you

## Why We Need This

The `/api/posthog-stats` endpoint needs a valid PostHog Personal API Key to fetch analytics data. The current key (created 3 days ago) is returning 403 Forbidden errors, indicating it's either:
- Expired
- Revoked
- Missing read permissions

## After I Add It

Once I add the new key to Vercel:
- ✅ The PostHog API will start working immediately
- ✅ Analytics dashboard will show real data
- ✅ No code changes needed

---

**Ready?** Open https://us.posthog.com/settings/user-api-keys and create the key, then send it to me!
