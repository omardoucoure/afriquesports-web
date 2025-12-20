# WordPress Plugin Installation Guide
## Next.js Cache Revalidation Plugin

✅ **Plugin Created:** `nextjs-cache-revalidation.zip`
📍 **Location:** `/Users/omardoucoure/Documents/Afrique Sports/afriquesports-web/nextjs-cache-revalidation.zip`

---

## Step 1: Get Your Revalidation Secret

Run this command to get your secret:

```bash
cd "/Users/omardoucoure/Documents/Afrique Sports/afriquesports-web"
vercel env pull .env.temp --environment=production
grep REVALIDATE_SECRET .env.temp
rm .env.temp
```

**Copy the secret value** - you'll need it in Step 3.

Or get it from Vercel Dashboard:
1. Go to https://vercel.com/
2. Select `afriquesports-web` project
3. Go to Settings → Environment Variables
4. Find `REVALIDATE_SECRET` and click "View"

---

## Step 2: Upload Plugin to WordPress

### Method A: WordPress Admin Panel (Easiest)

1. Login to WordPress: https://cms.realdemadrid.com/afriquesports/wp-admin

2. Go to **Plugins → Add New**

3. Click **Upload Plugin** button at the top

4. Click **Choose File** and select:
   `/Users/omardoucoure/Documents/Afrique Sports/afriquesports-web/nextjs-cache-revalidation.zip`

5. Click **Install Now**

6. Click **Activate Plugin**

### Method B: FTP/SFTP Upload

1. Connect to your server via FTP client (FileZilla, Cyberduck, etc.)
   - Host: `165.232.149.230`
   - Username: `root`
   - Port: 22 (SFTP)

2. Navigate to: `/wp-content/plugins/`

3. Upload the entire `nextjs-cache-revalidation` folder

4. Go to WordPress admin → Plugins and activate "Next.js Cache Revalidation"

---

## Step 3: Configure the Plugin

1. In WordPress admin, go to **Settings → Next.js Revalidation**

2. Enter the following values:

   **Revalidation URL:**
   ```
   https://www.afriquesports.net/api/revalidate
   ```

   **Revalidation Secret:**
   ```
   [Paste the secret from Step 1]
   ```

3. Click **Save Settings**

4. Click **Test Connection** button

   ✅ You should see: "Connection successful! Cache revalidation is working."

---

## Step 4: Test It!

1. Create or edit a post in WordPress

2. Click **Publish** or **Update**

3. Visit https://www.afriquesports.net

4. The post should appear **immediately** on the homepage!

5. Check the plugin's **Recent Activity** table:
   - Go to Settings → Next.js Revalidation
   - Scroll down to see revalidation history

---

## What This Plugin Does

When you **publish**, **update**, or **delete** a post in WordPress, the plugin automatically:

1. Sends a request to Next.js revalidation API
2. Clears the cache for:
   - Homepage (all languages)
   - Category pages
   - The specific article page
3. Logs the activity for your review
4. Does NOT slow down WordPress (non-blocking requests)

---

## Troubleshooting

### "Connection failed" when testing

**Check:**
1. Secret is correct (no extra spaces or quotes)
2. URL is: `https://www.afriquesports.net/api/revalidate`
3. WordPress can make external HTTP requests (check firewall)

### Posts not appearing immediately

**Check:**
1. Plugin is activated
2. Settings are saved correctly
3. Check Recent Activity log for errors
4. Check WordPress error logs

### View WordPress Error Logs

```bash
ssh root@165.232.149.230
tail -f /var/log/apache2/error.log
# or
tail -f /var/log/nginx/error.log
```

---

## Manual Cache Flush (Backup Method)

If the plugin isn't working, you can manually flush the cache:

```bash
cd "/Users/omardoucoure/Documents/Afrique Sports/afriquesports-web"
vercel env pull .env.temp --environment=production --yes
source .env.temp
curl -X POST https://www.afriquesports.net/api/revalidate \
  -H "Content-Type: application/json" \
  -d "{
    \"secret\": \"$REVALIDATE_SECRET\",
    \"slug\": \"latest-post-slug\",
    \"category\": \"can-2025\",
    \"action\": \"publish\"
  }"
rm .env.temp
```

---

## Support

Need help? The plugin has:
- ✅ Settings page with easy configuration
- ✅ Test connection button
- ✅ Activity logging
- ✅ Clear error messages

If you see errors in Recent Activity, they'll tell you exactly what went wrong.
