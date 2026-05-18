// Módulo principal del panel. Gestiona el idioma de la página, preferencias de tema y la inicialización de los gráficos.
import { translations } from './translations.js';
import { savePreference, getSavedTheme, truncateLegendText, pastelPalette, formatEuro } from './utils.js';







// ---------------------------------------------------------------------
// 1️⃣ CONFIGURACIÓN ----------------------------------------------------
// Endpoint de API usado para obtener los registros de ventas de los gráficos.
const API_URL = 'https://9nccdykio2.execute-api.eu-north-1.amazonaws.com/prod/sales';

// Idioma actual de la página determinado por los metadatos HTML.
const currentLanguage = document.documentElement.dataset.pageLang || document.documentElement.lang || 'es';

// Objeto de traducción para el idioma activo.
const langConfig = translations[currentLanguage] || translations.es;

// Ruta para la página de idioma alternativo.
const languageSwitchPage = currentLanguage === 'es' ? 'en.html' : 'index.html';

// Instancias de gráficos almacenadas para permitir actualización y limpieza.
const chartInstances = [];

// Metadatos de leyenda compartidos para las etiquetas de los gráficos.
let currentLegendData = {};

// ---------------------------------------------------------------------
// 2️⃣ FETCH DATA -------------------------------------------------------
async function loadData() {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error(`API error ${response.status}`);
  const json = await response.json();
  return json.salesRecords || [];
}

// Aplica el tema seleccionado y guarda la preferencia en localStorage.
const applyTheme = (useDark) => {
  const html = document.documentElement;
  html.setAttribute('data-bs-theme', useDark ? 'dark' : 'light');
  savePreference('dashboardTheme', useDark ? 'dark' : 'light');
  const toggleBtn = document.getElementById('darkModeToggle');
  if (toggleBtn) toggleBtn.textContent = useDark ? '☀️' : '🌙';
};



























// Actualiza todo el texto visible de la página para coincidir con el idioma actual.
const applyPageLanguage = () => {
  document.title = langConfig.title;
  document.documentElement.lang = currentLanguage;
 // document.getElementById('signInBtn').textContent = langConfig.signIn;
  //document.getElementById('signUpBtn').textContent = langConfig.signUp;
  document.getElementById('mainHeading').textContent = langConfig.mainHeading;
  document.getElementById('loadingTitle').textContent = langConfig.loadingTitle;
  document.getElementById('loadingSubtitle').textContent = langConfig.loadingSubtitle;

  const langToggleBtn = document.getElementById('langToggleBtn');
  if (langToggleBtn) {
    langToggleBtn.textContent = langConfig.langToggle;
    langToggleBtn.href = languageSwitchPage;
    langToggleBtn.setAttribute('aria-label', langConfig.langToggleAria);
  }

  const darkToggle = document.getElementById('darkModeToggle');
  if (darkToggle) {
    darkToggle.setAttribute('aria-label', langConfig.darkModeAria);
  }

  const footerText = document.getElementById('footerText');
  if (footerText) {
    footerText.innerHTML = `${langConfig.contact} <a href="mailto:support@mysite.com">support@mysite.com</a> | ${langConfig.phone} +34 969 636 773`;
  }

  const loadBtn = document.getElementById('loadDataBtn');
  if (loadBtn) {
    loadBtn.textContent = langConfig.loadData;
    loadBtn.setAttribute('aria-label', langConfig.loadDataAria || langConfig.loadData);
  }
};

// Destruye todas las instancias de gráficos y limpia el registro de gráficos.
const disposeCharts = () => {
  chartInstances.forEach(({ chart }) => chart.destroy());
  chartInstances.length = 0;
};

// Renderiza la tira de leyenda compacta sobre cada gráfico.
const renderChartLabelStrip = (containerId, labels, colors) => {
  const container = document.getElementById(containerId);
  if (!container) return;

  const topLabels = labels.slice(0, 5);
  const moreLabels = labels.length > 5 ? labels.slice(5) : [];

  container.innerHTML = topLabels
    .map((label, index) => {
      const display = truncateLegendText(label, 16);
      return `<span class="chart-pill" title="${label}"><span class="legend-dot" style="background:${colors[index]};"></span>${display}</span>`;
    })
    .join('') +
    (moreLabels.length
      ? `<span class="chart-pill chart-pill-more" title="${moreLabels.join(', ')}">${langConfig.moreCount.replace('{count}', moreLabels.length)}</span>`
      : '');
};

// Vuelve a renderizar todas las tiras de leyenda después de un cambio de idioma o actualización de gráficos.
const renderAllLegendStrips = () => {
  if (!currentLegendData) return;
  renderChartLabelStrip('legendCategory', currentLegendData.category, currentLegendData.categoryColors);
  renderChartLabelStrip('legendHour', currentLegendData.hour, currentLegendData.hourColors);
  renderChartLabelStrip('legendItems', currentLegendData.items, currentLegendData.itemColors);
};

// Construye y renderiza todos los gráficos del panel a partir de los datos obtenidos.
function buildCharts(data) {
  disposeCharts();

  const revenueByCat = data.reduce((acc, rec) => {
    const catObj = rec.revenueByCategory || {};
    Object.entries(catObj).forEach(([cat, val]) => {
      acc[cat] = (acc[cat] || 0) + Number(val);
    });
    return acc;
  }, {});

  const catLabels = Object.keys(revenueByCat);
  const catValues = Object.values(revenueByCat);

  const ordersByHour = data.reduce((acc, rec) => {
    const hourObj = rec.ordersByHour || {};
    Object.entries(hourObj).forEach(([hour, cnt]) => {
      acc[hour] = (acc[hour] || 0) + Number(cnt);
    });
    return acc;
  }, {});
  const hourLabels = Object.keys(ordersByHour).sort((a, b) => a - b);
  const hourValues = hourLabels.map((h) => ordersByHour[h]);

  const itemCounts = data.reduce((acc, rec) => {
    const items = rec.itemsSold || [];
    items.forEach((it) => {
      acc[it.itemId] = (acc[it.itemId] || 0) + Number(it.qty);
    });
    return acc;
  }, {});
  const topItems = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const itemLabels = topItems.map((i) => i[0]);
  const itemValues = topItems.map((i) => i[1]);

  const revenueByDay = data.reduce((acc, rec) => {
    const day = rec.date;
    acc[day] = (acc[day] || 0) + Number(rec.totalRevenue || 0);
    return acc;
  }, {});
  const dayLabels = Object.keys(revenueByDay).sort();
  const dayValues = dayLabels.map((d) => revenueByDay[d]);

  const topCategories = Object.entries(revenueByCat)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topHours = Object.entries(ordersByHour)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const chartTooltip = {
    callbacks: {
      label(ctx) {
        const label = ctx.label || '';
        const value = ctx.parsed ?? ctx.raw;
        const labelType = ctx.dataset.dataLabelType;

        if (labelType === 'revenue') {
          return `${label}: ${formatEuro(value)}`;
        }
        if (labelType === 'qty') {
          return `${label}: ${value} ${langConfig.sold}`;
        }
        if (labelType === 'orders') {
          return `${label}: ${value} ${langConfig.orders}`;
        }
        return `${label}: ${value}`;
      }
    }
  };

  const categoryChart = new Chart(document.getElementById('chartCategoryPie'), {
    type: 'pie',
    data: {
      labels: catLabels,
      datasets: [{
        label: langConfig.revenueCategory,
        dataLabelType: 'revenue',
        data: catValues,
        backgroundColor: pastelPalette(catLabels.length),
        borderColor: '#fff',
        borderWidth: 1
      }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: langConfig.revenueCategory },
        tooltip: chartTooltip
      }
    }
  });
  chartInstances.push({ chart: categoryChart, type: 'category' });

  const categoryColors = pastelPalette(topCategories.length);
  currentLegendData.category = topCategories.map(([label]) => label);
  currentLegendData.categoryColors = categoryColors;
  renderChartLabelStrip('legendCategory', currentLegendData.category, categoryColors);

  const hourChart = new Chart(document.getElementById('chartOrdersHourDoughnut'), {
    type: 'doughnut',
    data: {
      labels: hourLabels,
      datasets: [{
        label: langConfig.ordersByHour,
        dataLabelType: 'orders',
        data: hourValues,
        backgroundColor: pastelPalette(hourLabels.length),
        borderColor: '#fff',
        borderWidth: 1
      }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: langConfig.ordersByHour },
        tooltip: chartTooltip
      }
    }
  });
  chartInstances.push({ chart: hourChart, type: 'hour' });

  const hourColors = pastelPalette(topHours.length);
  currentLegendData.hour = topHours.map(([label]) => `${label}:00`);
  currentLegendData.hourColors = hourColors;
  renderChartLabelStrip('legendHour', currentLegendData.hour, hourColors);

  const itemsChart = new Chart(document.getElementById('chartTopItemsPie'), {
    type: 'pie',
    data: {
      labels: itemLabels,
      datasets: [{
        label: langConfig.topItems,
        dataLabelType: 'qty',
        data: itemValues,
        backgroundColor: pastelPalette(itemLabels.length),
        borderColor: '#fff',
        borderWidth: 1
      }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: langConfig.topItems },
        tooltip: chartTooltip
      }
    }
  });
  chartInstances.push({ chart: itemsChart, type: 'items' });

  const itemColors = pastelPalette(itemLabels.length);
  currentLegendData.items = itemLabels;
  currentLegendData.itemColors = itemColors;
  renderChartLabelStrip('legendItems', currentLegendData.items, itemColors);

  const revenueChart = new Chart(document.getElementById('chartDailyRevenueBar'), {
    type: 'bar',
    data: {
      labels: dayLabels,
      datasets: [{
        label: langConfig.revenueOverTime,
        dataLabelType: 'revenue',
        data: dayValues,
        backgroundColor: pastelPalette(dayLabels.length),
        borderColor: '#333',
        borderWidth: 1
      }]
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: langConfig.revenueOverTime },
        tooltip: chartTooltip,
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
  chartInstances.push({ chart: revenueChart, type: 'revenue' });
}

// Inicializa los controles de la interfaz y el estado de la página al cargar.
const initializeUI = () => {
  applyPageLanguage();
  applyTheme(getSavedTheme());

  const darkToggle = document.getElementById('darkModeToggle');
  darkToggle?.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
    applyTheme(!isDark);
  });
  const loadBtn = document.getElementById('loadDataBtn');
  loadBtn?.addEventListener('click', startLoadAndRender);
};

// Function to start loading data when the user clicks the button.
async function startLoadAndRender() {
  const btn = document.getElementById('loadDataBtn');
  const spinner = document.getElementById('loaderSpinner');
  if (btn) btn.disabled = true;
  if (spinner) spinner.classList.remove('d-none');

  try {
    const rawData = await loadData();
    if (spinner) spinner.classList.add('d-none');

    if (!rawData.length) {
      document.getElementById('loadingScreen').classList.remove('d-none');
      document.getElementById('loadingScreen').innerHTML =
        `<div class="alert alert-warning w-100 text-center">${langConfig.loadingTitle}</div>`;
      if (btn) btn.disabled = false;
      return;
    }

    document.getElementById('loadingScreen').classList.add('d-none');
    document.getElementById('appContent').classList.remove('d-none');

    buildCharts(rawData);
  } catch (err) {
    console.error(err);
    if (spinner) spinner.classList.add('d-none');
    if (btn) btn.disabled = false;
    const screen = document.getElementById('loadingScreen');
    screen.classList.remove('d-none');
    screen.innerHTML =
      `<div class="alert alert-danger w-100 text-center">Failed to load data: ${err.message}</div>`;
  }
}

// Inicialización sin auto-carga: el usuario debe pulsar el botón para cargar datos.
initializeUI();




