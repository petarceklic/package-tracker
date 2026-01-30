const { execSync } = require('child_process');
const { queries } = require('./db-supabase');
require('dotenv').config();

// Gmail accounts to scan
const GMAIL_ACCOUNTS = [
  process.env.GOG_ACCOUNT || 'petarceklic@gmail.com',
  'eceklic@gmail.com'
];

// Keywords that indicate a package was ALREADY delivered (strict matching)
// Must avoid false positives like "out for delivery", "delivery estimate", etc.
const DELIVERY_PHRASES = [
  'has been delivered',
  'was delivered',
  'successfully delivered',
  'package delivered',
  'your package has arrived',
  'delivery complete',
  'parcel delivered',
  'order delivered',
  'your order has been delivered',
  'your parcel has been delivered',
  'item delivered',
  'signed for by',
];

// Same CARRIERS config as before
const CARRIERS = {
  'Australia Post': {
    domains: ['auspost.com.au', 'australiapost.com.au'],
    patterns: [
      /tracking\s*(?:number|#|id)?[:\s]+([A-Z0-9]{13,})/i,
      /shipment\s*(?:id|number)[:\s]+([A-Z0-9]{13,})/i,
      /([A-Z]{2}\d{9}AU)/,
    ],
    trackingUrl: 'https://auspost.com.au/mypost/track/#/details/'
  },
  'StarTrack': {
    domains: ['startrack.com.au'],
    patterns: [
      /(?:consignment|tracking).*?([A-Z0-9]{10,20})/i,
      /(?:reference|shipment).*?(\d{10,})/i
    ],
    trackingUrl: 'https://startrack.com.au/track-trace/#/'
  },
  'Toll': {
    domains: ['toll.com.au', 'tollgroup.com'],
    patterns: [
      /consignment\s*(?:number|#)?[:\s]+([A-Z0-9]{10,})/i,
      /tracking.*?(\d{10,})/i
    ],
    trackingUrl: 'https://www.toll.com.au/track-n-trace?id='
  },
  'Aramex': {
    domains: ['aramex.com', 'shippit.com'],
    patterns: [
      /Tracking\s*number:\s*([A-Z]{2}\d+)/i,
      /(?:waybill|awb|tracking).*?([A-Z]{2}\d{10,})/i,
      /(?:waybill|awb|tracking).*?(\d{11,})/i
    ],
    trackingUrl: 'https://www.aramex.com/au/track/results?mode=0&ShipmentNumber='
  },
  'Shippit': {
    domains: ['shippit.com'],
    patterns: [
      /app\.shippit\.com\/tracking\/([a-z0-9]+)/i,
      /Tracking\s*number:\s*([A-Z0-9]+)/i
    ],
    trackingUrl: 'https://app.shippit.com/tracking/'
  },
  'CouriersPlease': {
    domains: ['couriersplease.com.au'],
    patterns: [
      /(?:consignment|tracking).*?([A-Z0-9]{10,})/i
    ],
    trackingUrl: 'https://www.couriersplease.com.au/tools-track-trace-item/'
  },
  'DHL Express': {
    domains: ['dhl.com', 'dhl.com.au'],
    patterns: [
      /(?:waybill|tracking).*?(\d{10,11})/i,
      /([A-Z0-9]{10})/
    ],
    trackingUrl: 'https://www.dhl.com/au-en/home/tracking/tracking-express.html?submit=1&tracking-id='
  },
  'FedEx': {
    domains: ['fedex.com'],
    patterns: [
      /(?:tracking|shipment).*?(\d{12,14})/i
    ],
    trackingUrl: 'https://www.fedex.com/fedextrack/?trknbr='
  },
  'TNT': {
    domains: ['tnt.com'],
    patterns: [
      /consignment.*?(\d{9,})/i,
      /(?:tracking|reference).*?([A-Z0-9]{9,})/i
    ],
    trackingUrl: 'https://www.tnt.com/express/en_au/site/shipping-tools/tracking.html?searchType=con&cons='
  },
  'Sendle': {
    domains: ['sendle.com'],
    patterns: [
      /(?:reference|tracking).*?([A-Z0-9]{20,})/i
    ],
    trackingUrl: 'https://track.sendle.com/tracking?ref='
  },
  'Amazon': {
    domains: ['amazon.com', 'amazon.com.au', 'shipment-tracking@amazon'],
    patterns: [
      /Order\s*#\s*(\d{3}-\d{7}-\d{7})/i,
      /orderIdP(\d-\d{7}-\d{7})/i,
      /TBA\d{12}/,
      /1Z[A-Z0-9]{16}/,
      /tracking\s*(?:id|number)[:\s]+([A-Z0-9]{10,})/i
    ],
    trackingUrl: 'https://www.amazon.com.au/progress-tracker/package/'
  },
  'AliExpress': {
    domains: ['aliexpress.com'],
    patterns: [
      /tracking\s*(?:number|code)[:\s]+([A-Z]{2}\d{9}[A-Z]{2})/i,
      /([A-Z]{2}\d{9}[A-Z]{2})/
    ],
    trackingUrl: 'https://track.aliexpress.com/logisticsdetail.htm?tradeId='
  },
  'eBay': {
    domains: ['ebay.com', 'ebay.com.au'],
    patterns: [
      /tracking\s*(?:number|#)?[:\s]+([A-Z0-9]{10,})/i,
      /shipment.*?([A-Z0-9]{10,})/i,
      /item\s*#(\d{12})/i
    ],
    trackingUrl: 'https://www.ebay.com.au/sh/track?tn='
  }
};

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MONTH_NAMES = 'Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec';

function parseDate(dateStr) {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  } catch (e) {
    return null;
  }
}

function toDateStr(d) {
  return d.toISOString().split('T')[0];
}

// Resolve a day name ("Friday") to a date relative to the email sent date.
// Looks forward up to 7 days from emailDate.
function resolveDayName(dayName, emailDate) {
  const targetDay = DAY_NAMES.indexOf(dayName.toLowerCase());
  if (targetDay === -1) return null;
  const d = new Date(emailDate);
  for (let i = 0; i <= 7; i++) {
    const check = new Date(d);
    check.setDate(d.getDate() + i);
    if (check.getDay() === targetDay) {
      return toDateStr(check);
    }
  }
  return null;
}

// Extract a delivery date from the email body, using the email's sent date
// to resolve relative references like "today", "Friday", etc.
function extractDeliveryDate(combinedText, emailDate) {
  // --- Priority 1: "Arriving today" / "Delivered today" ---
  if (/arriving\s+today/i.test(combinedText) || /delivered\s+today/i.test(combinedText)) {
    return toDateStr(emailDate);
  }

  // --- Priority 2: "Arriving [DayName]" e.g. "Arriving Friday" ---
  const dayMatch = combinedText.match(/arriving\s+(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i);
  if (dayMatch) {
    const resolved = resolveDayName(dayMatch[1], emailDate);
    if (resolved) return resolved;
  }

  // --- Priority 3: "Arriving [Month Day]" e.g. "Arriving Jan 30", "Arriving January 30" ---
  const arrMonthDay = combinedText.match(new RegExp(
    `arriving\\s+(?:\\w+,\\s*)?(${MONTH_NAMES})\\w*\\s+(\\d{1,2})`, 'i'
  ));
  if (arrMonthDay) {
    const parsed = parseDate(`${arrMonthDay[1]} ${arrMonthDay[2]}, ${emailDate.getFullYear()}`);
    if (parsed) return parsed;
  }

  // --- Priority 4: "Arriving [Day Month]" e.g. "Arriving 30 January" ---
  const arrDayMonth = combinedText.match(new RegExp(
    `arriving\\s+(?:\\w+,\\s*)?(\\d{1,2})\\s+(${MONTH_NAMES})\\w*`, 'i'
  ));
  if (arrDayMonth) {
    const parsed = parseDate(`${arrDayMonth[2]} ${arrDayMonth[1]}, ${emailDate.getFullYear()}`);
    if (parsed) return parsed;
  }

  // --- Priority 5: "delivery by/expected/estimated [Month Day]" ---
  const deliveryMonthDay = combinedText.match(new RegExp(
    `(?:estimated\\s+)?(?:delivery|expected|arrives?)\\s+(?:by\\s+)?(?:\\w+,\\s*)?(${MONTH_NAMES})\\w*\\s+(\\d{1,2})`, 'i'
  ));
  if (deliveryMonthDay) {
    const parsed = parseDate(`${deliveryMonthDay[1]} ${deliveryMonthDay[2]}, ${emailDate.getFullYear()}`);
    if (parsed) return parsed;
  }

  // --- Priority 6: "delivery by/expected [Day Month]" ---
  const deliveryDayMonth = combinedText.match(new RegExp(
    `(?:estimated\\s+)?(?:delivery|expected|arrives?)\\s+(?:by\\s+)?(?:\\w+,\\s*)?(\\d{1,2})\\s+(${MONTH_NAMES})\\w*`, 'i'
  ));
  if (deliveryDayMonth) {
    const parsed = parseDate(`${deliveryDayMonth[2]} ${deliveryDayMonth[1]}, ${emailDate.getFullYear()}`);
    if (parsed) return parsed;
  }

  // --- Priority 7: Explicit numeric dates near delivery keywords ---
  const numericDate = combinedText.match(/(?:estimated\s+)?(?:delivery|expected|arrives?)\s+(?:by\s+)?.*?(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i);
  if (numericDate) {
    const parsed = parseDate(numericDate[1]);
    if (parsed) return parsed;
  }

  // --- Priority 8: "by/before [Day Month]" ---
  const byDate = combinedText.match(new RegExp(
    `(?:by|before)\\s+(?:\\w+,\\s*)?(${MONTH_NAMES})\\w*\\s+(\\d{1,2})`, 'i'
  ));
  if (byDate) {
    const parsed = parseDate(`${byDate[1]} ${byDate[2]}, ${emailDate.getFullYear()}`);
    if (parsed) return parsed;
  }

  const byDateRev = combinedText.match(new RegExp(
    `(?:by|before)\\s+(?:\\w+,\\s*)?(\\d{1,2})\\s+(${MONTH_NAMES})\\w*`, 'i'
  ));
  if (byDateRev) {
    const parsed = parseDate(`${byDateRev[2]} ${byDateRev[1]}, ${emailDate.getFullYear()}`);
    if (parsed) return parsed;
  }

  return null;
}

function checkIfDelivered(emailBody, emailSubject) {
  const combinedText = (emailSubject + ' ' + emailBody).toLowerCase();
  for (const phrase of DELIVERY_PHRASES) {
    if (combinedText.includes(phrase.toLowerCase())) {
      return true;
    }
  }
  return false;
}

const OUT_FOR_DELIVERY_PHRASES = [
  'out for delivery',
  'out for  ',   // Amazon sometimes truncates
  'on its way to you',
  'arriving today',
  'will be delivered today',
];

function checkIfOutForDelivery(emailBody, emailSubject) {
  const combinedText = (emailSubject + ' ' + emailBody).toLowerCase();
  for (const phrase of OUT_FOR_DELIVERY_PHRASES) {
    if (combinedText.includes(phrase)) {
      return true;
    }
  }
  return false;
}

function isDeliveryDatePassed(estimatedDelivery) {
  if (!estimatedDelivery) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deliveryDate = new Date(estimatedDelivery);
  return deliveryDate < today;
}

function extractTrackingInfo(emailBody, emailSubject, fromEmail, emailSentDate) {
  let detectedCarrier = null;
  let trackingNumber = null;
  let estimatedDelivery = null;

  for (const [carrier, config] of Object.entries(CARRIERS)) {
    const isFromCarrier = config.domains.some(domain =>
      fromEmail.toLowerCase().includes(domain)
    );

    if (isFromCarrier || emailSubject.toLowerCase().includes(carrier.toLowerCase())) {
      detectedCarrier = carrier;
      const combinedText = emailSubject + '\n' + emailBody;

      for (const pattern of config.patterns) {
        const match = combinedText.match(pattern);
        if (match) {
          trackingNumber = match[1] || match[0];
          // Validate tracking number isn't a common false positive
          if (trackingNumber.length >= 8 &&
              !['tracking', 'shipment', 'delivery', 'notification'].includes(trackingNumber.toLowerCase())) {
            break;
          }
        }
      }

      // Extract delivery date from email content, using sent date for relative references
      estimatedDelivery = extractDeliveryDate(combinedText, emailSentDate);

      if (trackingNumber) break;
    }
  }

  // Check if the email indicates delivery
  const isDelivered = checkIfDelivered(emailBody, emailSubject);

  return {
    carrier: detectedCarrier,
    trackingNumber,
    estimatedDelivery,
    trackingUrl: detectedCarrier ? CARRIERS[detectedCarrier].trackingUrl + trackingNumber : null,
    isDelivered
  };
}

async function scanGmailAccount(account) {
  console.log(`\n📧 Scanning ${account}...`);

  const daysBack = process.env.SCAN_DAYS_BACK || 90;
  const searchQuery = `newer_than:${daysBack}d (tracking OR delivery OR shipped OR shipment OR delivered)`;

  let result;
  try {
    result = execSync(
      `/opt/homebrew/bin/gog gmail search '${searchQuery}' --max 50 --json --account ${account}`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );
  } catch (error) {
    console.error(`❌ Error scanning ${account}:`, error.message);
    return { scanned: 0, found: 0, delivered: 0 };
  }

  const data = JSON.parse(result);
  const threads = data.threads || [];

  console.log(`📬 Found ${threads.length} potential shipping emails in ${account}`);

  let packagesFound = 0;
  let deliveredCount = 0;
  let processed = 0;

  for (const thread of threads) {
    processed++;
    console.log(`Processing ${processed}/${threads.length}...`);

    try {
      // Use thread data directly (faster than fetching full body)
      const subject = thread.subject || '';
      const from = thread.from || '';
      const date = thread.date || '';

      // Only fetch body for promising threads
      let body = '';
      for (const [carrier, config] of Object.entries(CARRIERS)) {
        const isFromCarrier = config.domains.some(domain =>
          from.toLowerCase().includes(domain)
        );

        if (isFromCarrier || subject.toLowerCase().includes(carrier.toLowerCase())) {
          // This looks promising, fetch full body
          try {
            body = execSync(
              `/opt/homebrew/bin/gog gmail get ${thread.id} --format full --account ${account}`,
              { encoding: 'utf-8', maxBuffer: 5 * 1024 * 1024, timeout: 10000 }
            );
          } catch (e) {
            body = thread.snippet || '';
          }
          break;
        }
      }

      // Parse email sent date once, used for date extraction and status
      const emailDate = date ? new Date(date) : new Date();
      const emailDateStr = emailDate.toISOString().split('T')[0];

      const info = extractTrackingInfo(body || thread.snippet || '', subject, from, emailDate);

      if (info.carrier && info.trackingNumber) {
        let itemDesc = subject
          .replace(/tracking|shipment|delivery|notification|confirmation|delivered/gi, '')
          .replace(/[^\w\s-]/g, '')
          .trim();

        if (itemDesc.length > 100) {
          itemDesc = itemDesc.substring(0, 100) + '...';
        }

        if (!itemDesc) {
          itemDesc = `Package from ${info.carrier}`;
        }

        // Determine status from email content

        let status = 'In Transit';
        let deliveredAt = null;
        let estimatedDelivery = info.estimatedDelivery;

        if (info.isDelivered) {
          status = 'Delivered';
          deliveredAt = emailDate.toISOString();
          deliveredCount++;
        } else if (checkIfOutForDelivery(body || thread.snippet || '', subject)) {
          status = 'Out for Delivery';
          // "Arriving today" means the day the email was sent, not today
          if (!estimatedDelivery) {
            estimatedDelivery = emailDateStr;
          }
        }

        try {
          await queries.insertPackage(
            info.trackingNumber,
            info.carrier,
            status,
            estimatedDelivery,
            itemDesc,
            subject,
            date,
            info.trackingUrl,
            account,
            deliveredAt
          );

          packagesFound++;
          console.log(`✅ ${info.carrier}: ${info.trackingNumber} [${status}] ${estimatedDelivery ? `(${estimatedDelivery})` : ''} from ${account}`);
        } catch (dbError) {
          console.error('DB error:', dbError.message);
        }
      }
    } catch (error) {
      continue;
    }
  }

  console.log(`\n📊 ${account}: Found ${packagesFound} packages (${deliveredCount} delivered)`);
  return { scanned: threads.length, found: packagesFound, delivered: deliveredCount };
}

async function updateDeliveryStatuses() {
  console.log('🔄 Checking for past-due packages to auto-mark as delivered...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const packages = await queries.getAllPackages();
    let autoDelivered = 0;

    for (const pkg of packages) {
      if (pkg.status === 'Delivered' || pkg.status === 'Cancelled') continue;
      if (!pkg.estimated_delivery) continue;

      const deliveryDate = new Date(pkg.estimated_delivery);
      deliveryDate.setHours(0, 0, 0, 0);

      // If estimated delivery is in the past and package is Out for Delivery,
      // it was almost certainly delivered — mark it as such
      if (deliveryDate < today && pkg.status === 'Out for Delivery') {
        await queries.updatePackageStatus('Delivered', pkg.tracking_number);
        console.log(`📬 Auto-delivered: ${pkg.tracking_number} (was Out for Delivery, due ${pkg.estimated_delivery})`);
        autoDelivered++;
      }
    }

    console.log(`📬 Auto-marked ${autoDelivered} past-due packages as delivered`);
    return autoDelivered;
  } catch (error) {
    console.error('Error updating delivery statuses:', error.message);
    return 0;
  }
}

async function scanGmailFast() {
  console.log('📧 Starting multi-account Gmail scan...');
  console.log(`📋 Accounts to scan: ${GMAIL_ACCOUNTS.join(', ')}`);

  let totalScanned = 0;
  let totalFound = 0;
  let totalDelivered = 0;

  for (const account of GMAIL_ACCOUNTS) {
    const result = await scanGmailAccount(account);
    totalScanned += result.scanned;
    totalFound += result.found;
    totalDelivered += result.delivered;
  }

  // Also check and update existing packages based on delivery dates
  const autoDelivered = await updateDeliveryStatuses();

  console.log(`\n🎉 Scan complete!`);
  console.log(`📬 Scanned: ${totalScanned} emails from ${GMAIL_ACCOUNTS.length} accounts`);
  console.log(`📦 Found: ${totalFound} packages`);
  console.log(`✅ Delivered: ${totalDelivered} (from emails) + ${autoDelivered} (auto-detected)`);

  return {
    scanned: totalScanned,
    found: totalFound,
    delivered: totalDelivered + autoDelivered,
    accounts: GMAIL_ACCOUNTS.length
  };
}

if (require.main === module) {
  scanGmailFast().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { scanGmailFast, updateDeliveryStatuses, GMAIL_ACCOUNTS };
