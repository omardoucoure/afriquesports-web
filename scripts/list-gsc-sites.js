#!/usr/bin/env node
const { google } = require('googleapis');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '..', 'google-service-account.json');

async function listSites() {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/webmasters'],
  });

  const searchConsole = google.searchconsole({ version: 'v1', auth });

  console.log('Service account email: afrique-sports@appspot.gserviceaccount.com\n');
  console.log('Sites this service account has access to:\n');

  try {
    const response = await searchConsole.sites.list();

    if (response.data.siteEntry && response.data.siteEntry.length > 0) {
      for (const site of response.data.siteEntry) {
        console.log(`  - ${site.siteUrl} (${site.permissionLevel})`);
      }
    } else {
      console.log('  No sites found. The service account needs to be added to GSC.');
      console.log('\n  To add it:');
      console.log('  1. Go to https://search.google.com/search-console');
      console.log('  2. Select www.afriquesports.net');
      console.log('  3. Settings > Users and permissions > Add user');
      console.log('  4. Email: afrique-sports@appspot.gserviceaccount.com');
      console.log('  5. Permission: Owner');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listSites();
