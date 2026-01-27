let calendar;
let allPackages = [];
let filteredPackages = [];
let currentView = 'calendar';
let gmailAccounts = [];

const API_BASE = window.location.origin;

// Carrier colors for calendar events - Pink themed!
const CARRIER_COLORS = {
  'Australia Post': '#ec4899',
  'StarTrack': '#f472b6',
  'Toll': '#be185d',
  'Aramex': '#db2777',
  'CouriersPlease': '#fb7185',
  'DHL Express': '#f9a8d4',
  'FedEx': '#fda4af',
  'TNT': '#fb923c',
  'Sendle': '#fbbf24',
  'Amazon': '#ec4899',
  'AliExpress': '#db2777',
  'eBay': '#be185d',
  'Shippit': '#f472b6'
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  showLoading();

  // Initialize calendar FIRST (before loading data)
  initCalendar();

  // Then load data (which will update the calendar)
  await loadAccounts();
  await loadStats();
  await loadCarriers();
  await loadPackages();

  hideLoading();

  // Auto-refresh every 30 minutes
  setInterval(loadPackages, 30 * 60 * 1000);
});

function showLoading() {
  document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loading').classList.add('hidden');
}

async function loadAccounts() {
  try {
    const response = await fetch(`${API_BASE}/api/accounts`);
    const data = await response.json();
    if (data.success) {
      gmailAccounts = data.accounts;
      const accountInfo = document.getElementById('account-info');
      if (gmailAccounts.length > 1) {
        accountInfo.textContent = `Tracking from ${gmailAccounts.length} accounts`;
      } else {
        accountInfo.textContent = `Tracking from ${gmailAccounts[0]}`;
      }
    }
  } catch (error) {
    document.getElementById('account-info').textContent = 'Tracking your deliveries with love';
  }
}

async function loadStats() {
  try {
    const response = await fetch(`${API_BASE}/api/stats`);
    const data = await response.json();
    if (data.success) {
      document.getElementById('stat-total').textContent = data.stats.total;
      document.getElementById('stat-active').textContent = data.stats.active;
      document.getElementById('stat-delivered').textContent = data.stats.delivered;
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

async function loadCarriers() {
  try {
    const response = await fetch(`${API_BASE}/api/carriers`);
    const data = await response.json();
    if (data.success) {
      const select = document.getElementById('carrier-filter');
      data.carriers.forEach(carrier => {
        const option = document.createElement('option');
        option.value = carrier;
        option.textContent = carrier;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading carriers:', error);
  }
}

async function loadPackages() {
  try {
    const response = await fetch(`${API_BASE}/api/packages`);
    const data = await response.json();
    if (data.success) {
      allPackages = data.packages;
      filteredPackages = allPackages;
      updateDisplay();
    }
  } catch (error) {
    console.error('Error loading packages:', error);
  }
}

function initCalendar() {
  const calendarEl = document.getElementById('calendar');
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek'
    },
    events: [],
    eventClick: function(info) {
      showPackageDetails(info.event.extendedProps.package);
    },
    height: 'auto'
  });
  calendar.render();
}

function updateDisplay() {
  if (currentView === 'calendar') {
    updateCalendar();
  } else {
    updateListView();
  }
  loadStats();
}

function updateCalendar() {
  const events = filteredPackages
    .filter(pkg => pkg.estimated_delivery)
    .map(pkg => {
      const isDelivered = pkg.status === 'Delivered';
      return {
        title: `${pkg.carrier}: ${pkg.item_description || pkg.tracking_number}`,
        start: pkg.estimated_delivery,
        backgroundColor: isDelivered ? '#10b981' : (CARRIER_COLORS[pkg.carrier] || '#6366F1'),
        borderColor: isDelivered ? '#10b981' : (CARRIER_COLORS[pkg.carrier] || '#6366F1'),
        classNames: isDelivered ? ['delivered-event'] : [],
        extendedProps: {
          package: pkg
        }
      };
    });

  calendar.removeAllEvents();
  calendar.addEventSource(events);
}

function getEmailAccountBadge(emailAccount) {
  if (!emailAccount) return '';
  const shortName = emailAccount.split('@')[0];
  return `<span class="email-account-badge">${shortName}</span>`;
}

function updateListView() {
  const listContainer = document.getElementById('packages-list');
  const emptyState = document.getElementById('empty-state');

  if (filteredPackages.length === 0) {
    listContainer.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  listContainer.innerHTML = filteredPackages.map(pkg => {
    const isDelivered = pkg.status === 'Delivered';
    const cardClass = isDelivered ? 'card-delivered' : '';
    const statusClass = pkg.status.toLowerCase().replace(/\s+/g, '-');

    return `
    <div class="card p-6 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 ${cardClass}" onclick='showPackageDetails(${JSON.stringify(pkg).replace(/'/g, "&#39;")})'>
      <div class="flex justify-between items-start mb-3">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-3 flex-wrap">
            <span class="carrier-badge">${pkg.carrier}</span>
            <span class="status-badge status-${statusClass}">${pkg.status}</span>
            ${getEmailAccountBadge(pkg.email_account)}
          </div>
          <h3 class="text-lg font-bold ${isDelivered ? 'text-gray-500' : 'text-pink-900'} mb-2">
            ${pkg.item_description || 'Package'}
          </h3>
          <p class="text-sm ${isDelivered ? 'text-gray-400' : 'text-pink-400'}">${pkg.email_subject}</p>
        </div>
        ${pkg.estimated_delivery ? `
          <div class="text-right ${isDelivered ? 'bg-gradient-to-br from-gray-50 to-gray-100' : 'bg-gradient-to-br from-pink-50 to-rose-50'} px-4 py-3 rounded-2xl">
            <div class="text-xs ${isDelivered ? 'text-gray-400' : 'text-pink-400'} font-medium">${isDelivered ? 'Delivered' : 'Expected'}</div>
            <div class="text-lg font-bold ${isDelivered ? 'text-gray-500' : 'bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent'}">${formatDate(pkg.estimated_delivery)}</div>
            ${pkg.delivered_at ? `<div class="text-xs text-gray-400 mt-1">${formatDate(pkg.delivered_at)}</div>` : ''}
          </div>
        ` : ''}
      </div>
      <div class="flex items-center justify-between pt-4 border-t-2 ${isDelivered ? 'border-gray-100' : 'border-pink-100'}">
        <code class="text-sm ${isDelivered ? 'bg-gray-50 text-gray-500' : 'bg-pink-50 text-pink-700'} px-3 py-1.5 rounded-full font-mono">${pkg.tracking_number}</code>
        <div class="flex gap-2">
          ${!isDelivered ? `
            <button onclick="event.stopPropagation(); markAsDelivered('${pkg.tracking_number}')" class="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:from-emerald-600 hover:to-green-600 transition">
              ✓ Delivered
            </button>
          ` : ''}
          <a href="${pkg.tracking_url}" target="_blank" onclick="event.stopPropagation()" class="${isDelivered ? 'bg-gray-400' : 'bg-gradient-to-r from-pink-500 to-rose-500'} text-white px-4 py-2 rounded-full text-sm font-medium ${isDelivered ? 'hover:bg-gray-500' : 'hover:from-pink-600 hover:to-rose-600'} transition">
            Track →
          </a>
        </div>
      </div>
    </div>
  `;
  }).join('');
}

async function markAsDelivered(trackingNumber) {
  if (!confirm('Mark this package as delivered?')) return;

  showLoading();
  try {
    const response = await fetch(`${API_BASE}/api/packages/${trackingNumber}/delivered`, {
      method: 'POST'
    });
    const data = await response.json();

    if (data.success) {
      await loadPackages();
    } else {
      alert('Failed to mark as delivered: ' + data.error);
    }
  } catch (error) {
    alert('Error: ' + error.message);
  } finally {
    hideLoading();
  }
}

function showPackageDetails(pkg) {
  const isDelivered = pkg.status === 'Delivered';
  const details = `
📦 ${pkg.item_description || 'Package'}

Carrier: ${pkg.carrier}
Status: ${pkg.status}
Tracking: ${pkg.tracking_number}
${pkg.estimated_delivery ? `Expected: ${formatDate(pkg.estimated_delivery)}` : ''}
${pkg.delivered_at ? `Delivered: ${formatDate(pkg.delivered_at)}` : ''}
${pkg.email_account ? `Account: ${pkg.email_account}` : ''}

From: ${pkg.email_subject}
Received: ${pkg.email_date}
  `.trim();

  alert(details);

  if (pkg.tracking_url && confirm('Open tracking page?')) {
    window.open(pkg.tracking_url, '_blank');
  }
}

function toggleView() {
  currentView = currentView === 'calendar' ? 'list' : 'calendar';

  const calendarView = document.getElementById('calendar-view');
  const listView = document.getElementById('list-view');
  const toggleText = document.getElementById('view-toggle-text');

  if (currentView === 'calendar') {
    calendarView.classList.remove('hidden');
    listView.classList.add('hidden');
    toggleText.textContent = '📋 List View';
  } else {
    calendarView.classList.add('hidden');
    listView.classList.remove('hidden');
    toggleText.textContent = '📅 Calendar View';
  }

  updateDisplay();
}

function handleSearch() {
  const query = document.getElementById('search-input').value.toLowerCase();
  applyFilters();
}

function handleFilter() {
  applyFilters();
}

function applyFilters() {
  const searchQuery = document.getElementById('search-input').value.toLowerCase();
  const carrierFilter = document.getElementById('carrier-filter').value;
  const statusFilter = document.getElementById('status-filter').value;

  filteredPackages = allPackages.filter(pkg => {
    const matchesSearch = !searchQuery ||
      pkg.tracking_number.toLowerCase().includes(searchQuery) ||
      (pkg.item_description && pkg.item_description.toLowerCase().includes(searchQuery)) ||
      pkg.email_subject.toLowerCase().includes(searchQuery) ||
      (pkg.email_account && pkg.email_account.toLowerCase().includes(searchQuery));

    const matchesCarrier = !carrierFilter || pkg.carrier === carrierFilter;
    const matchesStatus = !statusFilter || pkg.status === statusFilter;

    return matchesSearch && matchesCarrier && matchesStatus;
  });

  updateDisplay();
}

async function scanNow() {
  if (!confirm('Scan Gmail inbox now? This may take a minute.')) return;

  showLoading();
  try {
    const response = await fetch(`${API_BASE}/api/scan`, { method: 'POST' });
    const data = await response.json();

    if (data.success) {
      const msg = `Scan complete!

Scanned: ${data.result.scanned} emails
Found: ${data.result.found} packages
Delivered: ${data.result.delivered}
Accounts: ${data.result.accounts}`;
      alert(msg);
      await loadPackages();
    } else {
      alert('Scan failed: ' + data.error);
    }
  } catch (error) {
    alert('Error: ' + error.message);
  } finally {
    hideLoading();
  }
}

function formatDate(dateStr) {
  if (!dateStr) return 'Unknown';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}
