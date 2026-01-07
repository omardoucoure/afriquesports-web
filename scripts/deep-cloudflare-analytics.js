#!/usr/bin/env node

/**
 * Deep Cloudflare Analytics Check
 * Comprehensive analysis of all Cloudflare metrics
 */

require('dotenv').config({ path: '.env.local' });

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID) {
  console.error('❌ Missing Cloudflare credentials');
  process.exit(1);
}

const HOURS = 24; // Last 24 hours

async function fetchAPI(endpoint) {
  const response = await fetch(endpoint, {
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${JSON.stringify(data)}`);
  }

  return data;
}

async function getAnalyticsDashboard() {
  console.log('\n📊 COMPREHENSIVE CLOUDFLARE ANALYTICS');
  console.log('='.repeat(70));
  console.log(`Zone ID: ${CLOUDFLARE_ZONE_ID}`);
  console.log(`Period: Last ${HOURS} hours`);
  console.log('='.repeat(70));

  const now = new Date();
  const since = new Date(now.getTime() - HOURS * 60 * 60 * 1000);

  try {
    // 1. DASHBOARD ANALYTICS
    console.log('\n\n📈 SECTION 1: TRAFFIC OVERVIEW\n');

    const dashUrl = `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/analytics/dashboard?since=${since.toISOString()}&until=${now.toISOString()}&continuous=true`;
    const dashboard = await fetchAPI(dashUrl);

    if (dashboard.success && dashboard.result) {
      const totals = dashboard.result.totals;
      const timeseries = dashboard.result.timeseries || [];

      // Traffic totals
      if (totals.requests) {
        const all = totals.requests.all || 0;
        const cached = totals.requests.cached || 0;
        const uncached = totals.requests.uncached || 0;
        const ssl = totals.requests.ssl?.encrypted || 0;
        const unssl = totals.requests.ssl?.unencrypted || 0;

        console.log('Total Requests:');
        console.log(`  All:              ${all.toLocaleString()}`);
        console.log(`  Cached:           ${cached.toLocaleString()} (${((cached/all)*100).toFixed(1)}%)`);
        console.log(`  Uncached:         ${uncached.toLocaleString()} (${((uncached/all)*100).toFixed(1)}%)`);
        console.log(`  SSL/HTTPS:        ${ssl.toLocaleString()} (${((ssl/all)*100).toFixed(1)}%)`);
        console.log(`  Non-SSL:          ${unssl.toLocaleString()} (${((unssl/all)*100).toFixed(1)}%)`);

        // Rate calculations
        const reqPerHour = (all / HOURS).toFixed(0);
        const reqPerMin = (reqPerHour / 60).toFixed(0);
        const reqPerSec = (reqPerMin / 60).toFixed(2);

        console.log('\nTraffic Rate:');
        console.log(`  Per Hour:         ${Number(reqPerHour).toLocaleString()}`);
        console.log(`  Per Minute:       ${Number(reqPerMin).toLocaleString()}`);
        console.log(`  Per Second:       ${reqPerSec}`);

        // Cache performance
        const cacheHitRatio = ((cached / all) * 100).toFixed(2);
        console.log('\nCache Performance:');
        console.log(`  Hit Ratio:        ${cacheHitRatio}%`);

        if (cacheHitRatio >= 85) {
          console.log(`  Status:           ✅ EXCELLENT (Target: 85%+)`);
        } else if (cacheHitRatio >= 70) {
          console.log(`  Status:           ⚠️  GOOD (Target: 85%+, Acceptable: 70%+)`);
        } else if (cacheHitRatio >= 50) {
          console.log(`  Status:           ⚠️  MODERATE (Needs improvement)`);
        } else {
          console.log(`  Status:           ❌ LOW (Critical - needs immediate attention)`);
        }

        // Content types
        if (totals.requests.content_type) {
          console.log('\nContent Types:');
          const ct = totals.requests.content_type;
          Object.entries(ct).forEach(([type, count]) => {
            if (count > 0) {
              const percent = ((count / all) * 100).toFixed(1);
              console.log(`  ${type.padEnd(20)}: ${count.toLocaleString().padStart(12)} (${percent}%)`);
            }
          });
        }

        // HTTP methods
        if (totals.requests.http_status) {
          console.log('\nHTTP Status Codes:');
          const statuses = totals.requests.http_status;

          // Group by category
          let status2xx = 0, status3xx = 0, status4xx = 0, status5xx = 0;

          Object.entries(statuses).forEach(([code, count]) => {
            const codeNum = parseInt(code);
            if (codeNum >= 200 && codeNum < 300) status2xx += count;
            else if (codeNum >= 300 && codeNum < 400) status3xx += count;
            else if (codeNum >= 400 && codeNum < 500) status4xx += count;
            else if (codeNum >= 500 && codeNum < 600) status5xx += count;
          });

          console.log(`  2xx Success:      ${status2xx.toLocaleString()} (${((status2xx/all)*100).toFixed(1)}%)`);
          console.log(`  3xx Redirect:     ${status3xx.toLocaleString()} (${((status3xx/all)*100).toFixed(1)}%)`);
          console.log(`  4xx Client Error: ${status4xx.toLocaleString()} (${((status4xx/all)*100).toFixed(1)}%)`);
          console.log(`  5xx Server Error: ${status5xx.toLocaleString()} (${((status5xx/all)*100).toFixed(1)}%)`);

          // Check for issues
          const errorRate = ((status5xx / all) * 100).toFixed(2);
          if (status5xx > 0) {
            console.log(`\n  ⚠️  Server Errors Detected!`);
            console.log(`     Error Rate: ${errorRate}%`);
            if (errorRate > 1) {
              console.log(`     Status: ❌ CRITICAL - High error rate (>${errorRate}%)`);
            } else if (errorRate > 0.1) {
              console.log(`     Status: ⚠️  WARNING - Elevated error rate (>${errorRate}%)`);
            } else {
              console.log(`     Status: ✅ Acceptable - Low error rate (<0.1%)`);
            }
          }
        }
      }

      // Bandwidth
      if (totals.bandwidth) {
        const all = totals.bandwidth.all || 0;
        const cached = totals.bandwidth.cached || 0;
        const uncached = totals.bandwidth.uncached || 0;
        const ssl = totals.bandwidth.ssl?.encrypted || 0;

        console.log('\nBandwidth:');
        console.log(`  Total:            ${(all / 1024 / 1024 / 1024).toFixed(2)} GB`);
        console.log(`  Cached:           ${(cached / 1024 / 1024 / 1024).toFixed(2)} GB (${((cached/all)*100).toFixed(1)}%)`);
        console.log(`  Uncached:         ${(uncached / 1024 / 1024 / 1024).toFixed(2)} GB (${((uncached/all)*100).toFixed(1)}%)`);
        console.log(`  SSL/HTTPS:        ${(ssl / 1024 / 1024 / 1024).toFixed(2)} GB (${((ssl/all)*100).toFixed(1)}%)`);

        // Bandwidth saved by caching
        const savedGB = (cached / 1024 / 1024 / 1024).toFixed(2);
        const savingsPercent = ((cached / all) * 100).toFixed(1);
        console.log(`\n  💰 Bandwidth Saved: ${savedGB} GB (${savingsPercent}%)`);
      }

      // Threats
      if (totals.threats) {
        const allThreats = totals.threats.all || 0;
        const threatTypes = totals.threats.type || {};

        console.log('\nSecurity Threats:');
        console.log(`  Total Blocked:    ${allThreats.toLocaleString()}`);

        if (allThreats > 0) {
          console.log('\n  Threat Breakdown:');
          Object.entries(threatTypes).forEach(([type, count]) => {
            if (count > 0) {
              console.log(`    ${type.padEnd(20)}: ${count.toLocaleString()}`);
            }
          });

          const threatRate = ((allThreats / totals.requests.all) * 100).toFixed(2);
          console.log(`\n  Threat Rate:      ${threatRate}% of all requests`);

          if (threatRate > 5) {
            console.log(`  Status:           ❌ HIGH - Under attack or heavy bot traffic`);
          } else if (threatRate > 1) {
            console.log(`  Status:           ⚠️  ELEVATED - Monitor closely`);
          } else {
            console.log(`  Status:           ✅ NORMAL - Low threat level`);
          }
        } else {
          console.log(`  Status:           ✅ No threats detected`);
        }
      }

      // Peak traffic analysis
      if (timeseries && timeseries.length > 0) {
        console.log('\n\n📊 SECTION 2: TRAFFIC PATTERNS\n');

        // Find peaks
        const peaks = timeseries
          .map(t => ({
            time: new Date(t.since),
            requests: t.requests.all,
            cached: t.requests.cached,
            uncached: t.requests.uncached
          }))
          .sort((a, b) => b.requests - a.requests);

        console.log('Top 10 Peak Traffic Periods:');
        peaks.slice(0, 10).forEach((peak, i) => {
          const time = peak.time.toLocaleString('fr-FR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          const cacheRate = ((peak.cached / peak.requests) * 100).toFixed(0);
          console.log(`  ${(i + 1).toString().padStart(2)}. ${time}: ${peak.requests.toLocaleString().padStart(8)} requests (${cacheRate}% cached)`);
        });

        // Find valleys (lowest traffic)
        const valleys = [...timeseries]
          .map(t => ({
            time: new Date(t.since),
            requests: t.requests.all
          }))
          .sort((a, b) => a.requests - b.requests);

        console.log('\nLowest Traffic Periods (Good for maintenance):');
        valleys.slice(0, 5).forEach((valley, i) => {
          const time = valley.time.toLocaleString('fr-FR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          console.log(`  ${(i + 1).toString().padStart(2)}. ${time}: ${valley.requests.toLocaleString().padStart(8)} requests`);
        });

        // Calculate standard deviation for traffic consistency
        const avgRequests = timeseries.reduce((sum, t) => sum + t.requests.all, 0) / timeseries.length;
        const variance = timeseries.reduce((sum, t) => sum + Math.pow(t.requests.all - avgRequests, 2), 0) / timeseries.length;
        const stdDev = Math.sqrt(variance);
        const coefficientOfVariation = (stdDev / avgRequests * 100).toFixed(1);

        console.log('\nTraffic Consistency:');
        console.log(`  Average:          ${avgRequests.toFixed(0)} requests per interval`);
        console.log(`  Std Deviation:    ${stdDev.toFixed(0)}`);
        console.log(`  Variability:      ${coefficientOfVariation}%`);

        if (coefficientOfVariation < 30) {
          console.log(`  Pattern:          ✅ Consistent traffic (low variability)`);
        } else if (coefficientOfVariation < 60) {
          console.log(`  Pattern:          ⚠️  Moderate variability (expected for news site)`);
        } else {
          console.log(`  Pattern:          ❌ High variability (check for traffic spikes)`);
        }
      }
    }

    // 2. ZONE SETTINGS CHECK
    console.log('\n\n⚙️  SECTION 3: ZONE CONFIGURATION\n');

    const settingsUrl = `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/settings`;
    const settings = await fetchAPI(settingsUrl);

    if (settings.success) {
      const settingsMap = Object.fromEntries(
        settings.result.map(s => [s.id, s.value])
      );

      const checks = {
        'Always Use HTTPS': settingsMap.always_use_https === 'on',
        'Auto Minify JS': settingsMap.minify?.js === true,
        'Auto Minify CSS': settingsMap.minify?.css === true,
        'Brotli Compression': settingsMap.brotli === 'on',
        'HTTP/2': settingsMap.http2 === 'on',
        'HTTP/3 (QUIC)': settingsMap.http3 === 'on',
        'Early Hints': settingsMap.early_hints === 'on',
        'WebP': settingsMap.webp === 'on',
        'Polish (Image Optimization)': settingsMap.polish === 'lossy' || settingsMap.polish === 'lossless',
        'Security Level': settingsMap.security_level === 'medium' || settingsMap.security_level === 'high',
        'Browser Cache TTL': settingsMap.browser_cache_ttl >= 14400, // 4 hours
        'Rocket Loader': settingsMap.rocket_loader === 'off', // Should be OFF for Next.js
      };

      console.log('Performance & Security Settings:');
      Object.entries(checks).forEach(([name, isGood]) => {
        const status = isGood ? '✅' : '⚠️ ';
        console.log(`  ${status} ${name}`);
      });

      // Count optimizations
      const enabled = Object.values(checks).filter(v => v).length;
      const total = Object.keys(checks).length;
      const score = ((enabled / total) * 100).toFixed(0);

      console.log(`\nOptimization Score: ${score}% (${enabled}/${total})`);

      if (score >= 90) {
        console.log('Status: ✅ EXCELLENT configuration');
      } else if (score >= 75) {
        console.log('Status: ✅ GOOD configuration (minor improvements possible)');
      } else {
        console.log('Status: ⚠️  NEEDS IMPROVEMENT - Review settings');
      }
    }

    // 3. DNS ANALYTICS
    console.log('\n\n🌐 SECTION 4: DNS ANALYTICS\n');

    const dnsUrl = `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_analytics/report?since=${since.toISOString()}&until=${now.toISOString()}&metrics=queryCount,uncachedCount&dimensions=queryType`;

    try {
      const dns = await fetchAPI(dnsUrl);

      if (dns.success && dns.result?.data) {
        const data = dns.result.data;
        const totalQueries = data.reduce((sum, d) => sum + (d.metrics[0] || 0), 0);

        console.log('DNS Queries:');
        console.log(`  Total:            ${totalQueries.toLocaleString()}`);
        console.log(`\n  Query Types:`);

        data.forEach(item => {
          const type = item.dimensions[0];
          const count = item.metrics[0];
          const percent = ((count / totalQueries) * 100).toFixed(1);
          console.log(`    ${type.padEnd(10)}: ${count.toLocaleString().padStart(12)} (${percent}%)`);
        });

        console.log(`\n  Status:           ✅ DNS resolution healthy`);
      }
    } catch (error) {
      console.log('  Status:           ⚠️  DNS analytics not available (may require higher plan)');
    }

    // 4. FINAL RECOMMENDATIONS
    console.log('\n\n💡 SECTION 5: RECOMMENDATIONS & INSIGHTS\n');

    const recommendations = [];
    const warnings = [];
    const criticalIssues = [];

    // Analyze collected data
    if (dashboard.result?.totals) {
      const t = dashboard.result.totals;

      // Cache hit ratio
      if (t.requests) {
        const cacheRatio = (t.requests.cached / t.requests.all) * 100;
        if (cacheRatio < 50) {
          criticalIssues.push('Cache hit ratio is very low (<50%) - check cache rules');
        } else if (cacheRatio < 70) {
          warnings.push('Cache hit ratio could be improved (current: ' + cacheRatio.toFixed(1) + '%, target: 85%+)');
        } else if (cacheRatio < 85) {
          recommendations.push('Cache hit ratio is good but can be optimized further (current: ' + cacheRatio.toFixed(1) + '%, target: 85%+)');
        }
      }

      // SSL usage
      if (t.requests?.ssl) {
        const sslRatio = (t.requests.ssl.encrypted / t.requests.all) * 100;
        if (sslRatio < 95) {
          warnings.push('Some requests are not using HTTPS (' + (100-sslRatio).toFixed(1) + '%) - enable "Always Use HTTPS"');
        }
      }

      // Error rate
      if (t.requests?.http_status) {
        let errors5xx = 0;
        Object.entries(t.requests.http_status).forEach(([code, count]) => {
          if (parseInt(code) >= 500) errors5xx += count;
        });
        const errorRate = (errors5xx / t.requests.all) * 100;
        if (errorRate > 1) {
          criticalIssues.push('High server error rate (' + errorRate.toFixed(2) + '%) - check origin server health');
        } else if (errorRate > 0.1) {
          warnings.push('Elevated server error rate (' + errorRate.toFixed(2) + '%) - monitor origin server');
        }
      }

      // Threat level
      if (t.threats?.all) {
        const threatRate = (t.threats.all / t.requests.all) * 100;
        if (threatRate > 5) {
          criticalIssues.push('Very high threat rate (' + threatRate.toFixed(1) + '%) - enable additional security features');
        } else if (threatRate > 1) {
          warnings.push('Elevated threat rate (' + threatRate.toFixed(1) + '%) - monitor security events');
        }
      }
    }

    // Display
    if (criticalIssues.length > 0) {
      console.log('🔴 CRITICAL ISSUES:');
      criticalIssues.forEach((issue, i) => {
        console.log(`  ${i + 1}. ${issue}`);
      });
      console.log('');
    }

    if (warnings.length > 0) {
      console.log('⚠️  WARNINGS:');
      warnings.forEach((warning, i) => {
        console.log(`  ${i + 1}. ${warning}`);
      });
      console.log('');
    }

    if (recommendations.length > 0) {
      console.log('💡 RECOMMENDATIONS:');
      recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
      console.log('');
    }

    if (criticalIssues.length === 0 && warnings.length === 0) {
      console.log('✅ All metrics are within normal ranges!');
      console.log('   Your Cloudflare configuration is optimal.');
      console.log('');
    }

    // Overall health score
    let healthScore = 100;
    healthScore -= criticalIssues.length * 20;
    healthScore -= warnings.length * 5;

    console.log('\n' + '='.repeat(70));
    console.log('OVERALL HEALTH SCORE: ' + healthScore + '/100');

    if (healthScore >= 90) {
      console.log('Status: ✅ EXCELLENT - System performing optimally');
    } else if (healthScore >= 75) {
      console.log('Status: ✅ GOOD - Minor optimizations recommended');
    } else if (healthScore >= 60) {
      console.log('Status: ⚠️  FAIR - Several issues need attention');
    } else {
      console.log('Status: ❌ POOR - Critical issues require immediate action');
    }
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ Error fetching analytics:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
  }
}

// Run
getAnalyticsDashboard();
