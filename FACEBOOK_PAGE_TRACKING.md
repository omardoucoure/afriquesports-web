# Facebook Page Tracking Guide

## 🎯 Track Which of Your 3 Facebook Pages Is Sending Traffic

This guide shows you how to track which of your Facebook pages (Main, CAN 2025, Mercato) is driving traffic to your site.

---

## 📱 Your 3 Facebook Pages

1. **Main Afrique Sports** - General football news
2. **CAN 2025** - CAN tournament coverage
3. **Mercato** - Transfer news

---

## 🔗 Step 1: Generate UTM Links for Each Page

When posting to Facebook, use these special links:

### **For Main Afrique Sports Page**
```
https://www.afriquesports.net/afrique/senegal/article-slug?utm_source=facebook&utm_medium=social&utm_campaign=page_main
```

### **For CAN 2025 Page**
```
https://www.afriquesports.net/afrique/senegal/article-slug?utm_source=facebook&utm_medium=social&utm_campaign=page_can2025
```

### **For Mercato Page**
```
https://www.afriquesports.net/afrique/senegal/article-slug?utm_source=facebook&utm_medium=social&utm_campaign=page_mercato
```

### **Track Specific Posts** (Optional)
Add `utm_content` to track individual post performance:
```
?utm_source=facebook&utm_medium=social&utm_campaign=page_main&utm_content=post_20231215
```

---

## 🛠️ Step 2: Use the Built-in Link Generator

You can generate these links automatically in your code:

```typescript
import { generateFacebookUTMLink } from '@/lib/analytics'

// For Main page
const linkForMainPage = generateFacebookUTMLink(
  'https://www.afriquesports.net/afrique/senegal/article-slug',
  'main',
  '20231215' // optional post ID
)
// Returns: https://www.afriquesports.net/afrique/senegal/article-slug?utm_source=facebook&utm_medium=social&utm_campaign=page_main&utm_content=post_20231215

// For CAN 2025 page
const linkForCANPage = generateFacebookUTMLink(
  'https://www.afriquesports.net/afrique/senegal/article-slug',
  'can2025'
)

// For Mercato page
const linkForMercatoPage = generateFacebookUTMLink(
  'https://www.afriquesports.net/afrique/senegal/article-slug',
  'mercato'
)
```

---

## 📊 Step 3: How the Tracking Works

### **Automatic Tracking**

Every event is **automatically enriched** with Facebook page data:

```javascript
{
  event: 'Article_Click_Card',
  utm_source: 'facebook',
  utm_campaign: 'page_main',
  facebook_page: 'Main Afrique Sports',  // ✅ Identifies which page!
  article_id: '12345',
  // ... other properties
}
```

### **In Your Components**

You can check which Facebook page a user came from:

```typescript
import { getFacebookPageSource, isFromFacebookPage } from '@/lib/analytics'

// Get the Facebook page name
const facebookPage = getFacebookPageSource()
console.log(facebookPage) // "Main Afrique Sports" or "CAN 2025" or "Mercato"

// Check if from specific page
if (isFromFacebookPage('main')) {
  console.log('User came from Main Afrique Sports page!')
}

if (isFromFacebookPage('can2025')) {
  console.log('User came from CAN 2025 page!')
}
```

---

## 📈 Step 4: View the Data

### **In PostHog**

1. Go to **Events** → Filter by any event (e.g., `Article_Click_Card`)
2. Add filter: `facebook_page` = "Main Afrique Sports"
3. Or group by: `utm_campaign` to see all 3 pages

**Query Example:**
```
Events where facebook_page = "Main Afrique Sports"
vs
Events where facebook_page = "CAN 2025"
vs
Events where facebook_page = "Mercato"
```

### **In Google Analytics 4**

1. Go to **Reports** → **Acquisition** → **Traffic Acquisition**
2. Add secondary dimension: **Campaign**
3. You'll see traffic broken down by:
   - `page_main`
   - `page_can2025`
   - `page_mercato`

### **In Vercel Analytics**

UTM parameters are automatically captured in page views.

---

## 📊 Key Metrics to Compare

### **Traffic Volume**
- Which Facebook page sends the most visitors?

### **Engagement Quality**
- Which page has highest scroll depth?
- Which page has longest session duration?
- Which page has most pages per session?

### **Content Performance**
- Which page users share content more?
- Which page drives more article reads?

### **Conversion**
- Which page users are more likely to subscribe?
- Which page drives more return visits?

---

## 🎯 Example Reports

### **Report 1: Traffic by Facebook Page**
```
Main Afrique Sports:    5,234 visitors (45%)
CAN 2025:              3,891 visitors (33%)
Mercato:               2,567 visitors (22%)
```

### **Report 2: Engagement by Page**
```
                    Avg Session Duration    Scroll Depth    Shares
Main:               2m 34s                  67%            123
CAN 2025:           3m 12s                  78%            245 ⭐
Mercato:            1m 56s                  54%            89
```

### **Report 3: Top Articles by Facebook Page**

**From Main Page:**
1. Sadio Mané record - 1,234 views
2. Salah interview - 987 views

**From CAN 2025 Page:**
1. Match preview Senegal vs Egypt - 2,345 views ⭐
2. Live commentary - 1,876 views

**From Mercato Page:**
1. Transfer rumors - 756 views
2. Osimhen news - 543 views

---

## 🚀 Quick Setup Checklist

- [ ] When posting on **Main Afrique Sports**, add `?utm_source=facebook&utm_medium=social&utm_campaign=page_main`
- [ ] When posting on **CAN 2025**, add `?utm_source=facebook&utm_medium=social&utm_campaign=page_can2025`
- [ ] When posting on **Mercato**, add `?utm_source=facebook&utm_medium=social&utm_campaign=page_mercato`
- [ ] Check PostHog/GA4 to see which page is performing best
- [ ] Adjust posting strategy based on data

---

## 💡 Pro Tips

### **1. Use Short Links**
Create bit.ly or short URLs with UTM params embedded:
```
bit.ly/as-mane → https://afriquesports.net/...?utm_campaign=page_main
```

### **2. Test A/B**
Post the same article to all 3 pages with UTM tracking to see which audience engages most.

### **3. Track Post Times**
Add post time to `utm_content`:
```
utm_content=post_morning
utm_content=post_evening
```

### **4. Monitor in Real-Time**
Check PostHog live events to see which Facebook page is currently sending traffic.

### **5. Create Custom Dashboards**
Set up dashboards in PostHog/GA4 to compare:
- Traffic trends by page
- Best performing content per page
- User behavior differences

---

## 📞 Support

If you need help:
1. Check browser console for `[Analytics]` logs
2. Verify UTM parameters are in the URL
3. Check PostHog events for `facebook_page` property

---

## 🎉 That's It!

Now you can track exactly which of your 3 Facebook pages is driving the most engaged traffic! 📊

The system automatically captures and reports on:
- ✅ Which Facebook page users came from
- ✅ How they engage with your content
- ✅ Which page drives the best results

Use this data to optimize your posting strategy for each page! 🚀
