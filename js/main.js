// 国内政策页主逻辑
let currentData = null;
let charts = {};

// 初始化
document.addEventListener('DOMContentLoaded', function() {
  const datePicker = document.getElementById('datePicker');
  const today = new Date().toISOString().split('T')[0];
  datePicker.value = today;
  datePicker.max = today;

  loadData(today);

  datePicker.addEventListener('change', function() {
    loadData(this.value);
  });

  document.getElementById('exportPdf').addEventListener('click', exportToPDF);
});

// 加载数据
async function loadData(date) {
  try {
    showLoading();
    const response = await fetch(`data/domestic/${date}.json?v=${Date.now()}`);
    if (!response.ok) {
      throw new Error('No data available for this date');
    }
    currentData = await response.json();
    renderPage();
  } catch (error) {
    showEmptyState(date);
  }
}

// 显示加载状态
function showLoading() {
  document.getElementById('content').innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
    </div>
  `;
}

// 显示空状态
function showEmptyState(date) {
  document.getElementById('content').innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">📭</div>
      <h3>暂无数据</h3>
      <p>${date} 暂无智慧城市相关政策数据</p>
    </div>
  `;
}

// 渲染页面
function renderPage() {
  if (!currentData) return;

  const content = document.getElementById('content');
  content.innerHTML = `
    ${renderStats()}
    ${renderTimeline()}
    ${renderPolicies()}
    ${renderCharts()}
  `;

  // 初始化图表
  setTimeout(initCharts, 100);
}

// 渲染统计卡片
function renderStats() {
  const policies = currentData.policies || [];
  const nationalCount = policies.filter(p => p.category === '国家级').length;
  const localCount = policies.filter(p => p.category === '地方级').length;

  return `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${policies.length}</div>
        <div class="stat-label">今日政策总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${nationalCount}</div>
        <div class="stat-label">国家级政策</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${localCount}</div>
        <div class="stat-label">地方级政策</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${currentData.statistics.keywords.length}</div>
        <div class="stat-label">关键词数量</div>
      </div>
    </div>
  `;
}

// 渲染时间线
function renderTimeline() {
  const policies = currentData.policies || [];
  const sortedPolicies = [...policies].sort((a, b) => {
    return new Date(a.publishTime) - new Date(b.publishTime);
  });

  return `
    <div class="timeline-section">
      <div class="section-title">📅 今日政策发布时间线</div>
      <div class="timeline">
        ${sortedPolicies.map(policy => `
          <div class="timeline-item">
            <div class="timeline-time">${policy.publishTime}</div>
            <div class="timeline-title">${policy.title}</div>
            <div class="timeline-unit">${policy.publishUnit}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// 渲染政策列表
function renderPolicies() {
  const policies = currentData.policies || [];

  return `
    <div class="policies-section">
      <div class="section-title">📋 政策详细列表</div>
      ${policies.map(policy => `
        <div class="policy-card" id="${policy.id}">
          <div class="policy-header">
            <div class="policy-title">${policy.title}</div>
            <span class="policy-badge badge-${policy.category === '国家级' ? 'national' : 'local'}">
              ${policy.category}
            </span>
          </div>
          <div class="policy-meta">
            <div class="policy-meta-item">
              <span class="policy-meta-label">📍 发布单位：</span>
              <span class="policy-meta-value">${policy.publishUnit}</span>
            </div>
            <div class="policy-meta-item">
              <span class="policy-meta-label">👁️ 监督单位：</span>
              <span class="policy-meta-value">${policy.superviseUnit}</span>
            </div>
            <div class="policy-meta-item">
              <span class="policy-meta-label">🕐 发布时间：</span>
              <span class="policy-meta-value">${policy.publishTime}</span>
            </div>
            <div class="policy-meta-item">
              <span class="policy-meta-label">🌐 数据来源：</span>
              <span class="policy-meta-value">
                <a href="${policy.source}" target="_blank" rel="noopener">${policy.sourceName} ↗</a>
              </span>
            </div>
            <div class="policy-meta-item">
              <span class="policy-meta-label">📍 适用地区：</span>
              <span class="policy-meta-value">${policy.region}</span>
            </div>
          </div>
          <div class="policy-content">
            <div class="policy-content-title">📄 政策要求</div>
            <div class="policy-content-text">${policy.requirements}</div>
          </div>
          <div class="policy-diff">
            <div class="policy-diff-title">🔍 与前政策的区别</div>
            <div class="policy-diff-text">${policy.diffWithPrevious}</div>
          </div>
          <div class="policy-keywords">
            ${policy.keywords.map(kw => `<span class="keyword-tag">${kw}</span>`).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// 渲染图表区域
function renderCharts() {
  return `
    <div class="charts-section">
      <div class="section-title">📊 数据分析与可视化</div>
      <div class="charts-grid">
        <div>
          <div class="chart-title">关键词频率分析</div>
          <div class="chart-container">
            <canvas id="keywordsChart"></canvas>
          </div>
        </div>
        <div>
          <div class="chart-title">热点建设内容</div>
          <div class="chart-container">
            <canvas id="hotTopicsChart"></canvas>
          </div>
        </div>
        <div style="grid-column: 1 / -1;">
          <div class="chart-title">政策发布趋势（2026年）</div>
          <div class="chart-container">
            <canvas id="trendChart"></canvas>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 初始化图表
function initCharts() {
  if (!currentData || !currentData.statistics) return;

  const stats = currentData.statistics;

  // 关键词频率柱状图
  const keywordsCtx = document.getElementById('keywordsChart');
  if (keywordsCtx) {
    if (charts.keywords) charts.keywords.destroy();
    charts.keywords = new Chart(keywordsCtx, {
      type: 'bar',
      data: {
        labels: stats.keywords.map(k => k.word),
        datasets: [{
          label: '出现频次',
          data: stats.keywords.map(k => k.count),
          backgroundColor: 'rgba(26, 115, 232, 0.7)',
          borderColor: 'rgba(26, 115, 232, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  // 热点内容饼图
  const hotTopicsCtx = document.getElementById('hotTopicsChart');
  if (hotTopicsCtx) {
    if (charts.hotTopics) charts.hotTopics.destroy();
    charts.hotTopics = new Chart(hotTopicsCtx, {
      type: 'doughnut',
      data: {
        labels: stats.hotTopics.map(t => t.topic),
        datasets: [{
          data: stats.hotTopics.map(t => t.count),
          backgroundColor: [
            '#1a73e8', '#34a853', '#fbbc04', '#ea4335',
            '#9c27b0', '#00bcd4', '#ff9800', '#4caf50'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right'
          }
        }
      }
    });
  }

  // 趋势折线图
  const trendCtx = document.getElementById('trendChart');
  if (trendCtx) {
    if (charts.trend) charts.trend.destroy();
    charts.trend = new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: stats.trendData.map(t => t.date),
        datasets: [{
          label: '政策发布数量',
          data: stats.trendData.map(t => t.count),
          borderColor: '#1a73e8',
          backgroundColor: 'rgba(26, 115, 232, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }
}

// 导出PDF
function exportToPDF() {
  const element = document.body;
  const opt = {
    margin: [10, 10, 10, 10],
    filename: `智慧城市政策分析报告-国内-${document.getElementById('datePicker').value}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    }
  };

  // 临时隐藏导航栏操作按钮
  const navbarActions = document.querySelector('.navbar-actions');
  if (navbarActions) navbarActions.style.display = 'none';

  html2pdf().set(opt).from(element).save().then(() => {
    if (navbarActions) navbarActions.style.display = '';
  });
}
