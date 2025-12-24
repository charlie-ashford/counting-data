Highcharts.setOptions({
  chart: {
    style: {
      fontFamily: 'Poppins, sans-serif',
    },
  },
  colors: ['#5865F2', '#F25D94', '#FA8231', '#17C671', '#663399', '#FFB720'],
  title: {
    style: {
      fontWeight: '600',
      fontSize: '1.1rem',
    },
  },
  subtitle: {
    style: {
      fontWeight: '400',
      fontSize: '0.9rem',
    },
  },
  xAxis: {
    lineColor: '#cccccc',
    tickColor: '#cccccc',
    labels: {
      style: {
        fontSize: '12px',
      },
    },
  },
  yAxis: {
    lineColor: '#cccccc',
    tickColor: '#cccccc',
    labels: {
      style: {
        fontSize: '12px',
      },
    },
  },
});

var serverData;
var charts = {};

function fetchDataInBackground() {
  var apiUrl = getApiUrl();
  fetch(apiUrl, {
    cache: 'no-store',
  })
    .then(function (response) {
      if (!response.ok) {
        throw new Error('HTTP error! Status: ' + response.status);
      }
      return response.json();
    })
    .then(function (data) {
      serverData = data;
      updateServerInfo();
      createServerOverviewChart();
      createChannelCharts();
      createUserCharts();
      createLeaderboard();
    })
    .catch(function (error) {
      console.error('Data fetch error:', error);
    });
}

function getApiUrl() {
  var urlParams = new URLSearchParams(window.location.search);
  var serverId = urlParams.get('server');
  if (serverId) {
    return 'https://api.communitrics.com/counting/s/' + serverId + '/all';
  }
  return 'https://api.communitrics.com/counting/s/661261766457819156/all';
}

function initializeTabs() {
  var tabs = document.querySelectorAll('.tab');
  var tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var tabId = tab.getAttribute('data-tab');
      tabs.forEach(function (t) {
        t.classList.remove('active');
      });
      tabContents.forEach(function (content) {
        content.classList.remove('active');
      });
      tab.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    });
  });
}

function getThemeColors() {
  const computedStyle = getComputedStyle(document.documentElement);
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  return {
    textColor:
      computedStyle.getPropertyValue('--text-color').trim() ||
      (isDark ? '#f1f5f9' : '#1e293b'),
    textMuted:
      computedStyle.getPropertyValue('--text-muted').trim() ||
      (isDark ? '#94a3b8' : '#64748b'),
    borderColor:
      computedStyle.getPropertyValue('--border-color').trim() ||
      (isDark ? '#334155' : '#e2e8f0'),
    accentColor:
      computedStyle.getPropertyValue('--accent-color').trim() || '#5865f2',
    backgroundColor: 'transparent',
    gridColor: isDark ? '#475569' : '#f1f5f9',
    tooltipBg: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    tooltipBorder: isDark ? '#475569' : '#e2e8f0',
  };
}

function formatDateForAxis(milliseconds) {
  const dt = luxon.DateTime.fromMillis(milliseconds);
  const date = dt.toFormat('MMM dd');
  const time = dt.toFormat('HH:mm');
  return { date, time };
}

function formatDateForTooltip(milliseconds, format) {
  const dt = luxon.DateTime.fromMillis(milliseconds);
  return dt.toFormat(format);
}

function getBaseChartOptions(colors, height = 400) {
  return {
    chart: {
      type: 'area',
      zoomType: 'x',
      backgroundColor: colors.backgroundColor,
      animation: {
        duration: 1000,
        easing: 'easeOutQuart',
      },
      resetZoomButton: { theme: { display: 'none' } },
      style: {
        fontFamily:
          'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '13px',
      },
      height: height,
      spacingTop: 24,
      spacingRight: 24,
      spacingBottom: 24,
      spacingLeft: 24,
      borderRadius: 8,
    },
    title: { text: null },
    xAxis: {
      type: 'datetime',
      tickAmount: 6,
      labels: {
        style: {
          color: colors.textMuted,
          fontSize: '11px',
          fontWeight: '500',
        },
        formatter: function () {
          const formatted = formatDateForAxis(this.value);
          return `<span style="color: ${colors.textColor}; font-weight: 600;">${formatted.date}</span><br/><span style="color: ${colors.textMuted};">${formatted.time}</span>`;
        },
        useHTML: true,
      },
      lineColor: colors.borderColor,
      tickColor: colors.borderColor,
      tickWidth: 1,
      lineWidth: 1,
      gridLineColor: colors.gridColor,
      gridLineWidth: 0.5,
      minorGridLineColor: colors.gridColor,
      minorGridLineWidth: 0.25,
    },
    yAxis: {
      title: { text: null },
      labels: {
        style: {
          color: colors.textMuted,
          fontSize: '11px',
          fontWeight: '500',
        },
        formatter: function () {
          return `<span style="color: ${
            colors.textColor
          }; font-weight: 600;">${this.value.toLocaleString()}</span>`;
        },
        useHTML: true,
      },
      gridLineColor: colors.gridColor,
      gridLineWidth: 1,
      minorGridLineColor: colors.gridColor,
      minorGridLineWidth: 0.5,
      tickWidth: 0,
      lineWidth: 0,
      startOnTick: false,
      endOnTick: false,
      maxPadding: 0.05,
      minPadding: 0.05,
    },
    tooltip: {
      backgroundColor: colors.tooltipBg,
      borderColor: colors.tooltipBorder,
      borderWidth: 1,
      borderRadius: 12,
      style: {
        color: colors.textColor,
        fontSize: '13px',
        fontWeight: '400',
      },
      useHTML: true,
      shadow: {
        color: 'rgba(0, 0, 0, 0.1)',
        width: 8,
        offsetX: 0,
        offsetY: 4,
      },
      padding: 16,
      hideDelay: 100,
    },
    plotOptions: {
      area: {
        fillOpacity: 0.2,
        lineWidth: 3,
        marker: {
          enabled: false,
          states: {
            hover: {
              enabled: true,
              radius: 6,
              lineWidth: 2,
              lineColor: '#ffffff',
              fillColor: colors.accentColor,
            },
          },
        },
        states: {
          hover: {
            lineWidth: 4,
            halo: {
              size: 8,
              opacity: 0.25,
            },
          },
        },
        threshold: null,
        animation: {
          duration: 1000,
        },
      },
    },
    credits: { enabled: false },
    exporting: { enabled: false },
    legend: { enabled: false },
    accessibility: {
      enabled: true,
      description: 'Interactive chart showing data over time',
    },
  };
}

function getGradientFill(baseColor) {
  return {
    linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
    stops: [
      [0, baseColor],
      [0.5, Highcharts.color(baseColor).setOpacity(0.3).get()],
      [1, Highcharts.color(baseColor).setOpacity(0.05).get()],
    ],
  };
}

function getServerTooltipFormatter(colors) {
  return function () {
    const fullDate = formatDateForTooltip(this.x, 'EEEE, MMMM dd, yyyy');
    const time = formatDateForTooltip(this.x, 'HH:mm:ss');

    return `
      <div style="text-align: center; min-width: 200px;">
        <div style="font-size: 14px; font-weight: 600; color: ${
          colors.textColor
        }; margin-bottom: 8px;">
          ${fullDate}
        </div>
        <div style="font-size: 12px; color: ${
          colors.textMuted
        }; margin-bottom: 12px;">
          ${time}
        </div>
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
          <div style="width: 12px; height: 12px; background: ${
            colors.accentColor
          }; border-radius: 50%;"></div>
          <span style="color: ${
            colors.accentColor
          }; font-weight: 700; font-size: 16px;">
            ${this.y.toLocaleString()}
          </span>
          <span style="color: ${
            colors.textMuted
          }; font-size: 14px;">total counts</span>
        </div>
      </div>
    `;
  };
}

function getUserTooltipFormatter(colors, userName, userColor) {
  return function () {
    const dateTime = formatDateForTooltip(this.x, "MMMM dd, yyyy 'at' HH:mm");

    return `
      <div style="text-align: center; min-width: 200px;">
        <div style="font-size: 14px; font-weight: 600; color: ${
          colors.textColor
        }; margin-bottom: 4px;">
          ${userName}
        </div>
        <div style="font-size: 12px; color: ${
          colors.textMuted
        }; margin-bottom: 12px;">
          ${dateTime}
        </div>
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
          <div style="width: 12px; height: 12px; background: ${userColor}; border-radius: 50%;"></div>
          <span style="color: ${userColor}; font-weight: 700; font-size: 16px;">
            ${this.y.toLocaleString()}
          </span>
          <span style="color: ${
            colors.textMuted
          }; font-size: 14px;">counts</span>
        </div>
      </div>
    `;
  };
}

function initializeThemeListener() {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addListener(function () {
    setTimeout(() => {
      Object.values(charts).forEach(chart => {
        if (chart && chart.redraw) {
          const colors = getThemeColors();
          chart.update(
            {
              xAxis: {
                labels: { style: { color: colors.textMuted } },
                lineColor: colors.borderColor,
                tickColor: colors.borderColor,
                gridLineColor: colors.gridColor,
              },
              yAxis: {
                labels: { style: { color: colors.textMuted } },
                gridLineColor: colors.gridColor,
              },
              tooltip: {
                backgroundColor: colors.tooltipBg,
                borderColor: colors.tooltipBorder,
                style: { color: colors.textColor },
              },
            },
            false
          );
          chart.redraw();
        }
      });
    }, 100);
  });
}

document.addEventListener('DOMContentLoaded', function () {
  initializeThemeListener();
  initializeTabs();
  fetchDataInBackground();
});

function updateServerInfo() {
  var serverIcon = document.getElementById('server-icon');
  var serverName = document.getElementById('server-name');
  serverName.textContent = serverData.server_name;
  serverIcon.src = serverData.server_image;

  extractColorFromImage(serverData.server_image, function (color) {
    document.documentElement.style.setProperty('--accent-color', color);
    document.documentElement.style.setProperty('--accent-hover', color);

    Object.keys(charts).forEach(function (chartKey) {
      if (charts[chartKey]) {
        charts[chartKey].update(
          {
            series: [
              {
                color: color,
                fillColor: getGradientFill(color),
              },
            ],
          },
          false
        );
      }
    });

    Object.values(charts).forEach(function (chart) {
      if (chart && chart.redraw) {
        chart.redraw();
      }
    });
  });
}

function extractColorFromImage(imgSrc, callback) {
  var img = new Image();
  img.crossOrigin = 'Anonymous';
  img.src = imgSrc;
  img.onload = function () {
    var colorThief = new ColorThief();
    var palette = colorThief.getPalette(img, 8);
    var vibrant = getMostVibrantColor(palette);
    var color = 'rgba(' + vibrant.join(',') + ', 0.7)';
    callback(color);
  };
  img.onerror = function () {
    callback('rgba(88, 101, 242, 0.7)');
  };
}

function getVibrancy(rgb) {
  var r = rgb[0];
  var g = rgb[1];
  var b = rgb[2];
  var max = Math.max(r, g, b);
  var min = Math.min(r, g, b);
  var saturation = max - min;
  var brightness = 0.299 * r + 0.587 * g + 0.114 * b;
  return saturation * brightness;
}

function getMostVibrantColor(palette) {
  return palette.reduce(function (mostVibrant, color) {
    return getVibrancy(color) > getVibrancy(mostVibrant) ? color : mostVibrant;
  });
}

function createServerOverviewChart() {
  if (!serverData) return;

  var container = document.getElementById('server-overview-chart');
  container.innerHTML = '';

  var resetButton = document.createElement('button');
  resetButton.textContent = 'Reset Zoom';
  resetButton.className = 'reset-zoom-btn';
  resetButton.style.display = 'none';
  var cardHeader = document.querySelector('#overview .card-header');
  cardHeader.appendChild(resetButton);

  var allCounts = serverData.channels.flatMap(function (channel) {
    return channel.counts.map(function (count) {
      return {
        timestamp: count.timestamp,
        channelName: channel.channel_name,
      };
    });
  });

  allCounts.sort(function (a, b) {
    return (
      luxon.DateTime.fromISO(a.timestamp).toMillis() -
      luxon.DateTime.fromISO(b.timestamp).toMillis()
    );
  });

  var cumulativeCount = 0;
  var cumulativeData = allCounts.map(function (count) {
    cumulativeCount += 1;
    return [
      luxon.DateTime.fromISO(count.timestamp).toMillis(),
      cumulativeCount,
      count.channelName,
    ];
  });

  var totalPoints = cumulativeData.length;
  var skipRate = Math.max(1, Math.ceil(totalPoints / 1500));
  var sampledData = cumulativeData.filter(function (_, index) {
    return index % skipRate === 0 || index === totalPoints - 1;
  });

  var colors = getThemeColors();
  var chartOptions = getBaseChartOptions(colors, 500);

  var serverChartOptions = Object.assign({}, chartOptions, {
    chart: Object.assign({}, chartOptions.chart, {
      events: {
        selection: function (event) {
          if (event.xAxis) {
            resetButton.style.display = 'inline-block';
          }
        },
      },
    }),
    tooltip: Object.assign({}, chartOptions.tooltip, {
      formatter: function () {
        const fullDate = formatDateForTooltip(this.x, 'MMMM dd, yyyy');
        const time = formatDateForTooltip(this.x, 'HH:mm:ss');

        return (
          '<div style="text-align: center;">' +
          '<strong>' +
          fullDate +
          '</strong><br/>' +
          '<span style="font-size: 11px;">' +
          time +
          '</span><br/>' +
          '<span style="color: ' +
          colors.accentColor +
          '; font-weight: 600; font-size: 14px;">' +
          this.y.toLocaleString() +
          '</span> total counts' +
          '</div>'
        );
      },
    }),
    series: [
      {
        name: 'Total Counts',
        data: sampledData.map(function (d) {
          return { x: d[0], y: d[1], channel: d[2] };
        }),
        color: colors.accentColor,
        fillColor: getGradientFill(colors.accentColor),
      },
    ],
  });

  charts['server-overview'] = Highcharts.chart(container, serverChartOptions);

  resetButton.addEventListener('click', function () {
    charts['server-overview'].zoomOut();
    resetButton.style.display = 'none';
  });
}

function createChannelCharts() {
  if (!serverData) return;

  var channelChartsGrid = document.getElementById('channel-charts-grid');
  channelChartsGrid.innerHTML = '';
  channelChartsGrid.classList.toggle('grid', serverData.channels.length > 1);

  var colors = getThemeColors();

  serverData.channels.forEach(function (channel) {
    var card = document.createElement('div');
    card.className = 'card';
    card.innerHTML =
      '<div class="card-header">' +
      '<h2 class="card-title">' +
      channel.channel_name +
      '</h2>' +
      '<button id="resetZoomChannel-' +
      channel.channel_id +
      '" class="reset-zoom-btn" style="display: none;">Reset Zoom</button>' +
      '</div>' +
      '<div id="channel-' +
      channel.channel_id +
      '-chart" class="chart-container"></div>';

    channelChartsGrid.appendChild(card);

    var container = document.getElementById(
      'channel-' + channel.channel_id + '-chart'
    );
    var chartHeight = serverData.channels.length > 1 ? 320 : 500;

    var resetButton = document.getElementById(
      'resetZoomChannel-' + channel.channel_id
    );

    var channelCounts = channel.counts.map(function (count) {
      return [
        luxon.DateTime.fromISO(count.timestamp).toMillis(),
        count.count_number,
      ];
    });

    channelCounts.sort(function (a, b) {
      return a[0] - b[0];
    });

    var totalPoints = channelCounts.length;
    var skipRate = Math.max(1, Math.ceil(totalPoints / 1500));
    var sampledData = channelCounts.filter(function (_, index) {
      return index % skipRate === 0 || index === totalPoints - 1;
    });

    var chartOptions = getBaseChartOptions(colors, chartHeight);
    var channelChartOptions = Object.assign({}, chartOptions, {
      chart: Object.assign({}, chartOptions.chart, {
        events: {
          selection: function (event) {
            if (event.xAxis) {
              resetButton.style.display = 'inline-block';
            }
          },
        },
      }),
      tooltip: Object.assign({}, chartOptions.tooltip, {
        formatter: function () {
          const fullDate = formatDateForTooltip(this.x, 'MMMM dd, yyyy');
          const time = formatDateForTooltip(this.x, 'HH:mm:ss');

          return (
            '<div style="text-align: center;">' +
            '<strong>' +
            fullDate +
            '</strong><br/>' +
            '<span style="font-size: 11px;">' +
            time +
            '</span><br/>' +
            '<span style="color: ' +
            colors.accentColor +
            '; font-weight: 600; font-size: 14px;">' +
            this.y.toLocaleString() +
            '</span>' +
            '</div>'
          );
        },
      }),
      series: [
        {
          name: 'Count',
          data: sampledData,
          color: colors.accentColor,
          fillColor: getGradientFill(colors.accentColor),
        },
      ],
    });

    charts['channel-' + channel.channel_id] = Highcharts.chart(
      container,
      channelChartOptions
    );

    resetButton.addEventListener('click', function () {
      charts['channel-' + channel.channel_id].zoomOut();
      resetButton.style.display = 'none';
    });
  });
}

function createUserCharts() {
  if (!serverData) return;

  var userChartsGrid = document.getElementById('user-charts-grid');
  userChartsGrid.innerHTML = '';

  var userCounts = {};
  var userTotals = {};

  var allCounts = serverData.channels.flatMap(function (channel) {
    return channel.counts.map(function (count) {
      return {
        channelName: channel.channel_name,
        user_id: count.user_id,
        username: count.username,
        display_name: count.display_name,
        profile_pic: count.profile_pic,
        timestamp: count.timestamp,
      };
    });
  });

  allCounts.sort(function (a, b) {
    return (
      luxon.DateTime.fromISO(a.timestamp).toMillis() -
      luxon.DateTime.fromISO(b.timestamp).toMillis()
    );
  });

  allCounts.forEach(function (count) {
    if (!userCounts[count.user_id]) {
      userCounts[count.user_id] = {
        id: count.user_id,
        username: count.username,
        display_name: count.display_name,
        profile_pic: count.profile_pic,
        counts: [],
      };
      userTotals[count.user_id] = { id: count.user_id, total: 0 };
    }

    userTotals[count.user_id].total += 1;
    userCounts[count.user_id].counts.push({
      x: luxon.DateTime.fromISO(count.timestamp).toMillis(),
      y: userTotals[count.user_id].total,
    });
  });

  var sortedUsers = Object.values(userTotals).sort(function (a, b) {
    return b.total - a.total;
  });

  userChartsGrid.classList.toggle('grid', Object.keys(userCounts).length > 1);

  var colors = getThemeColors();

  sortedUsers.forEach(function (userTotal, index) {
    var user = userCounts[userTotal.id];
    var rank = index + 1;

    var card = document.createElement('div');
    card.className = 'card';
    card.innerHTML =
      '<div class="card-header">' +
      '<div style="display: flex; align-items: center; gap: 12px;">' +
      '<img src="' +
      user.profile_pic +
      '" alt="' +
      user.display_name +
      '\'s Profile Picture" ' +
      'style="width: 46px; height: 46px; border-radius: 10px; object-fit: cover; box-shadow: var(--card-shadow);" />' +
      '<div>' +
      '<h2 class="card-title" style="margin: 0;">' +
      user.display_name +
      ' (@' +
      user.username +
      ')</h2>' +
      '<small style="color: var(--text-muted);">Leaderboard Rank: #' +
      rank +
      '</small>' +
      '</div>' +
      '</div>' +
      '<button id="resetZoomUser-' +
      user.id +
      '" class="reset-zoom-btn" style="display: none;">Reset Zoom</button>' +
      '</div>' +
      '<div id="user-' +
      user.id +
      '-chart" class="chart-container"></div>';

    userChartsGrid.appendChild(card);

    var container = document.getElementById('user-' + user.id + '-chart');
    var chartHeight = Object.keys(userCounts).length > 1 ? 320 : 500;

    var resetButton = document.getElementById('resetZoomUser-' + user.id);

    var profilePic = new Image();
    profilePic.crossOrigin = 'Anonymous';
    profilePic.src = user.profile_pic;

    profilePic.onload = function () {
      var colorThief = new ColorThief();
      var palette = colorThief.getPalette(profilePic, 8);
      var vibrant = getMostVibrantColor(palette);
      var userColor = 'rgba(' + vibrant.join(',') + ', 0.7)';

      var userData = user.counts;
      var totalPoints = userData.length;
      var skipRate = Math.max(1, Math.ceil(totalPoints / 1500));
      var sampledData = userData.filter(function (_, idx) {
        return idx % skipRate === 0 || idx === totalPoints - 1;
      });

      var chartOptions = getBaseChartOptions(colors, chartHeight);
      var userChartOptions = Object.assign({}, chartOptions, {
        chart: Object.assign({}, chartOptions.chart, {
          events: {
            selection: function (event) {
              if (event.xAxis) {
                resetButton.style.display = 'inline-block';
              }
            },
          },
        }),
        tooltip: Object.assign({}, chartOptions.tooltip, {
          formatter: function () {
            const dateTime = formatDateForTooltip(
              this.x,
              "MMMM dd, yyyy 'at' HH:mm"
            );

            return (
              '<div style="text-align: center;">' +
              '<strong>' +
              user.display_name +
              '</strong><br/>' +
              '<span style="font-size: 11px;">' +
              dateTime +
              '</span><br/>' +
              '<span style="color: ' +
              userColor +
              '; font-weight: 600; font-size: 14px;">' +
              this.y.toLocaleString() +
              '</span> total counts' +
              '</div>'
            );
          },
        }),
        series: [
          {
            name: 'Total Counts',
            data: sampledData,
            color: userColor,
            fillColor: getGradientFill(userColor),
          },
        ],
      });

      charts['user-' + user.id] = Highcharts.chart(container, userChartOptions);

      resetButton.addEventListener('click', function () {
        charts['user-' + user.id].zoomOut();
        resetButton.style.display = 'none';
      });
    };

    profilePic.onerror = function () {
      var fallbackColor = colors.accentColor;

      var userData = user.counts;
      var totalPoints = userData.length;
      var skipRate = Math.max(1, Math.ceil(totalPoints / 1500));
      var sampledData = userData.filter(function (_, idx) {
        return idx % skipRate === 0 || idx === totalPoints - 1;
      });

      var chartOptions = getBaseChartOptions(colors, chartHeight);
      var userChartOptions = Object.assign({}, chartOptions, {
        series: [
          {
            name: 'Total Counts',
            data: sampledData,
            color: fallbackColor,
            fillColor: getGradientFill(fallbackColor),
          },
        ],
      });

      charts['user-' + user.id] = Highcharts.chart(container, userChartOptions);
    };
  });
}

function createLeaderboard() {
  if (!serverData) return;

  var leaderboard = document.getElementById('leaderboard-list');
  leaderboard.innerHTML = '';

  var userTotals = {};

  serverData.channels.forEach(function (channel) {
    channel.counts.forEach(function (count) {
      if (!userTotals[count.user_id]) {
        userTotals[count.user_id] = {
          username: count.username,
          display_name: count.display_name,
          profile_pic: count.profile_pic,
          total: 0,
        };
      }
      userTotals[count.user_id].total += 1;
    });
  });

  var sortedUsers = Object.values(userTotals).sort(function (a, b) {
    return b.total - a.total;
  });

  sortedUsers.forEach(function (user, index) {
    var li = document.createElement('li');
    li.className = 'leaderboard-item';
    li.innerHTML =
      '<span class="leaderboard-rank">#' +
      (index + 1) +
      '</span>' +
      '<img class="leaderboard-avatar" src="' +
      user.profile_pic +
      '" alt="' +
      user.display_name +
      '" />' +
      '<div class="leaderboard-info">' +
      '<span class="leaderboard-name">' +
      user.display_name +
      '</span>' +
      ' <span class="leaderboard-username">@' +
      user.username +
      '</span>' +
      '</div>' +
      '<span class="leaderboard-score">' +
      user.total.toLocaleString() +
      '</span>';
    leaderboard.appendChild(li);
  });
}

document.getElementById('exportCsvBtn').addEventListener('click', function () {
  var zip = new JSZip();
  if (!serverData) {
    fetchData().then(function (data) {
      if (data) {
        serverData = data;
        doExport(zip);
      }
    });
  } else {
    doExport(zip);
  }
});

function fetchData() {
  var apiUrl = getApiUrl();
  return fetch(apiUrl)
    .then(function (response) {
      if (!response.ok) {
        throw new Error('HTTP error! Status: ' + response.status);
      }
      return response.json();
    })
    .catch(function (error) {
      console.error('Data fetch error:', error);
      return null;
    });
}

function doExport(zip) {
  var mainDataFolder = zip.folder('main_data');
  var serverDataCsv = generateServerDataCsv(serverData);
  mainDataFolder.file('server_data.csv', serverDataCsv);

  serverData.channels.forEach(function (channel) {
    var channelCsv = generateChannelDataCsv(channel);
    mainDataFolder.file('channel_' + channel.channel_name + '.csv', channelCsv);
  });

  var leaderboardCsv = generateLeaderboardCsv(serverData);
  mainDataFolder.file('leaderboard.csv', leaderboardCsv);

  var userDataFolder = zip.folder('user_data');
  var userCounts = aggregateUserCounts(serverData);
  userCounts.forEach(function (u) {
    var userCsv = generateUserDataCsv(u);
    userDataFolder.file(u.username + '.csv', userCsv);
  });

  zip.generateAsync({ type: 'blob' }).then(function (content) {
    saveAs(content, 'data_export.zip');
  });
}

function generateServerDataCsv(data) {
  var allCounts = data.channels.flatMap(function (channel) {
    return channel.counts.map(function (count) {
      return {
        timestamp: count.timestamp,
        channelName: channel.channel_name,
      };
    });
  });

  allCounts.sort(function (a, b) {
    return (
      luxon.DateTime.fromISO(a.timestamp).toMillis() -
      luxon.DateTime.fromISO(b.timestamp).toMillis()
    );
  });

  var cumulativeCount = 0;
  var cumulativeData = allCounts.map(function (count) {
    cumulativeCount += 1;
    return [count.timestamp, cumulativeCount];
  });

  var csvRows = [['Timestamp', 'Total Count']].concat(cumulativeData);
  return csvRows
    .map(function (row) {
      return row.join(',');
    })
    .join('\n');
}

function generateChannelDataCsv(channel) {
  var csvRows = [['Timestamp', 'Count']].concat(
    channel.counts.map(function (count) {
      return [count.timestamp, count.count_number];
    })
  );
  return csvRows
    .map(function (row) {
      return row.join(',');
    })
    .join('\n');
}

function generateLeaderboardCsv(data) {
  var userTotals = {};
  data.channels.forEach(function (channel) {
    channel.counts.forEach(function (count) {
      if (!userTotals[count.user_id]) {
        userTotals[count.user_id] = {
          username: count.username,
          display_name: count.display_name,
          profile_pic: count.profile_pic,
          total: 0,
        };
      }
      userTotals[count.user_id].total += 1;
    });
  });

  var sortedUsers = Object.values(userTotals).sort(function (a, b) {
    return b.total - a.total;
  });

  var csvRows = [['Rank', 'Username', 'Display Name', 'Total Counts']];
  sortedUsers.forEach(function (user, index) {
    csvRows.push([index + 1, user.username, user.display_name, user.total]);
  });

  return csvRows
    .map(function (row) {
      return row.join(',');
    })
    .join('\n');
}

function aggregateUserCounts(data) {
  var userCounts = {};
  data.channels.forEach(function (channel) {
    channel.counts.forEach(function (count) {
      if (!userCounts[count.user_id]) {
        userCounts[count.user_id] = {
          username: count.username,
          counts: [],
        };
      }
      userCounts[count.user_id].counts.push(count);
    });
  });
  return Object.values(userCounts);
}

function generateUserDataCsv(user) {
  var csvRows = [['Timestamp', 'Count']];
  csvRows = csvRows.concat(
    user.counts.map(function (count) {
      return [count.timestamp, count.count_number];
    })
  );
  return csvRows
    .map(function (row) {
      return row.join(',');
    })
    .join('\n');
}
