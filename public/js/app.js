let calendar;
let allPackages = [];
let filteredPackages = [];
let currentView = 'calendar';

const API_BASE = window.location.origin;

// Carrier colors for calendar events
const CARRIER_COLORS = {
  'Australia Post': '#DC2626',
  'StarTrack': '#2563EB',
  'Toll': '#059669',
  'Aramex': '#7C3AED',
  'CouriersPlease': '#DB2777',
  'DHL Express': '#FBBF24',
  'FedEx': '#8B5CF6',
  'TNT': '#F97316',
  'Sendle': '#06B6D4',
  'Amazon': '#FF9900',
  'AliExpress': '#E62E04',
  'eBay': '#E53238'
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  showLoading();
  await loadStats();
  await loadCarriers();
  await loadPackages();
  initCalendar();
  hideLoading();
  
  // Set account info
  document.getElementById('account-info').textContent = 'petarceklic@gmail.com';
  
  // Auto-refresh every 30 minutes
  setInterval(loadPackages, 30 * 60 * 1000);
});

function showLoading() {
  document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loading').classList.add('hidden');
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
    .map(pkg => ({
      title: `${pkg.carrier}: ${pkg.item_description || pkg.tracking_number}`,
      start: pkg.estimated_delivery,
      backgroundColor: CARRIER_COLORS[pkg.carrier] || '#6366F1',
      borderColor: CARRIER_COLORS[pkg.carrier] || '#6366F1',
      extendedProps: {
        package: pkg
      }
    }));
  
  calendar.removeAllEvents();
  calendar.addEventSource(events);
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
  
  listContainer.innerHTML = filteredPackages.map(pkg => `
    <div class="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition cursor-pointer" onclick='showPackageDetails(${JSON.stringify(pkg)})'>
      <div class="flex justify-between items-start mb-3">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2">
            <span class="carrier-badge">${pkg.carrier}</span>
            <span class="status-badge status-${pkg.status.toLowerCase().replace(/\s+/g, '-')}">${pkg.status}</span>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-1">
            ${pkg.item_description || 'Package'}
          </h3>
          <p class="text-sm text-gray-500">${pkg.email_subject}</p>
        </div>
        ${pkg.estimated_delivery ? `
          <div class="text-right">
            <div class="text-sm text-gray-500">Expected</div>
            <div class="text-lg font-semibold text-gray-900">${formatDate(pkg.estimated_delivery)}</div>
          </div>
        ` : ''}
      </div>
      <div class="flex items-center justify-between pt-3 border-t">
        <code class="text-sm bg-gray-100 px-2 py-1 rounded">${pkg.tracking_number}</code>
        <a href="${pkg.tracking_url}" target="_blank" onclick="event.stopPropagation()" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
          Track →
        </a>
      </div>
    </div>
  `).join('');
}

function showPackageDetails(pkg) {
  const details = `
📦 ${pkg.item_description || 'Package'}

Carrier: ${pkg.carrier}
Status: ${pkg.status}
Tracking: ${pkg.tracking_number}
${pkg.estimated_delivery ? `Expected: ${formatDate(pkg.estimated_delivery)}` : ''}

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
      pkg.email_subject.toLowerCase().includes(searchQuery);
    
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
      alert(`✅ Scan complete!\n\nScanned: ${data.result.scanned} emails\nFound: ${data.result.found} new packages`);
      await loadPackages();
    } else {
      alert('❌ Scan failed: ' + data.error);
    }
  } catch (error) {
    alert('❌ Error: ' + error.message);
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
