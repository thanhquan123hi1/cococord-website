/**
 * CoCoCord Admin - New Users Chart JavaScript
 * Handles rendering and updating the New Users Per Day chart
 */

var AdminNewUsersChart = window.AdminNewUsersChart || (function() {
  'use strict';

  // ========================================
  // State
  // ========================================

  let currentRange = 7;
  let chartData = null;
  let isLoading = false;
  let chart = null;

  // ========================================
  // API Endpoints
  // ========================================

  const API = {
    newUsers: '/api/admin/stats/new-users'
  };

  // ========================================
  // Initialization
  // ========================================

  function init() {
    console.log('[AdminNewUsersChart] Initializing...');
    
    setupEventListeners();
    fetchNewUsersData();
    
    console.log('[AdminNewUsersChart] Initialized');
  }

  // ========================================
  // Event Listeners
  // ========================================

  function setupEventListeners() {
    // Range selector dropdown
    const rangeSelector = document.getElementById('new-users-range-selector');
    if (rangeSelector) {
      rangeSelector.addEventListener('change', handleRangeChange);
    }
  }

  function handleRangeChange(e) {
    const newRange = parseInt(e.target.value);
    if (newRange !== currentRange) {
      currentRange = newRange;
      fetchNewUsersData();
    }
  }

  // ========================================
  // API Calls
  // ========================================

  async function fetchNewUsersData() {
    if (isLoading) return;
    isLoading = true;
    showLoading(true);

    try {
      const response = await AdminUtils.api.get(`${API.newUsers}?range=${currentRange}`);
      chartData = response;
      renderChart();
    } catch (error) {
      console.error('[AdminNewUsersChart] Failed to fetch data:', error);
      AdminUtils?.showToast?.('Failed to load new users statistics', 'danger');
      renderFallbackChart();
    } finally {
      isLoading = false;
      showLoading(false);
    }
  }

  // ========================================
  // Chart Rendering
  // ========================================

  function renderChart() {
    if (!chartData || !chartData.data) {
      console.warn('[AdminNewUsersChart] No data to render');
      return;
    }

    const canvas = document.getElementById('new-users-chart');
    if (!canvas) {
      console.error('[AdminNewUsersChart] Canvas element not found');
      return;
    }

    const ctx = canvas.getContext('2d');

    // Destroy existing chart if any
    if (chart) {
      chart.destroy();
    }

    // Prepare data
    const labels = chartData.data.map(d => d.date);
    const values = chartData.data.map(d => d.count);
    const maxValue = Math.max(...values, 1);

    // Chart.js configuration
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'New Users',
          data: values,
          borderColor: '#5865f2',
          backgroundColor: 'rgba(88, 101, 242, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#5865f2',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#5865f2',
          pointHoverBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#5865f2',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              title: function(context) {
                const index = context[0].dataIndex;
                const fullDate = chartData.data[index].fullDate;
                return fullDate || context[0].label;
              },
              label: function(context) {
                const count = context.parsed.y;
                return count === 1 ? '1 new user' : `${count} new users`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#b9bbbe',
              font: {
                size: 11
              }
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: '#b9bbbe',
              font: {
                size: 11
              },
              stepSize: Math.ceil(maxValue / 5),
              callback: function(value) {
                return Number.isInteger(value) ? value : null;
              }
            },
            grid: {
              color: 'rgba(79, 84, 92, 0.2)',
              drawBorder: false
            }
          }
        },
        animation: {
          duration: 750,
          easing: 'easeInOutQuart'
        }
      }
    });

    updateChartSummary();
  }

  function renderFallbackChart() {
    // Render a simple fallback chart with mock data
    const canvas = document.getElementById('new-users-chart');
    if (!canvas) return;

    chartData = {
      range: currentRange,
      data: generateMockData(currentRange)
    };

    renderChart();
  }

  function generateMockData(days) {
    const data = [];
    const labels = days === 7 
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : Array.from({ length: days }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (days - 1 - i));
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

    for (let i = 0; i < days; i++) {
      data.push({
        date: labels[i],
        count: Math.floor(Math.random() * 20),
        fullDate: new Date(Date.now() - (days - 1 - i) * 86400000).toISOString().split('T')[0]
      });
    }

    return data;
  }

  function updateChartSummary() {
    if (!chartData || !chartData.data) return;

    const totalNewUsers = chartData.data.reduce((sum, d) => sum + d.count, 0);
    const avgPerDay = (totalNewUsers / chartData.data.length).toFixed(1);
    
    // Update summary text if elements exist
    const totalElement = document.getElementById('new-users-total');
    const avgElement = document.getElementById('new-users-avg');

    if (totalElement) {
      totalElement.textContent = totalNewUsers;
    }
    if (avgElement) {
      avgElement.textContent = avgPerDay;
    }
  }

  // ========================================
  // Loading State
  // ========================================

  function showLoading(show) {
    const chartContainer = document.querySelector('.new-users-chart-container');
    if (chartContainer) {
      chartContainer.classList.toggle('loading', show);
    }
  }

  // ========================================
  // Public API
  // ========================================

  function refresh() {
    fetchNewUsersData();
  }

  function destroy() {
    if (chart) {
      chart.destroy();
      chart = null;
    }
  }

  return {
    init,
    refresh,
    destroy
  };

})();

// Expose to window
window.AdminNewUsersChart = AdminNewUsersChart;
