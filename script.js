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

document.addEventListener('DOMContentLoaded', function () {
  initializeTabs();
  fetchDataInBackground();
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

function updateServerInfo() {
  var serverIcon = document.getElementById('server-icon');
  var serverName = document.getElementById('server-name');
  serverName.textContent = serverData.server_name;
  serverIcon.src = serverData.server_image;

  extractColorFromImage(serverData.server_image, function (color) {
    document.documentElement.style.setProperty('--accent-color', color);
    document.documentElement.style.setProperty('--accent-hover', color);

    if (charts['server-overview']) {
      charts['server-overview'].update({
        series: [
          {
            color: color,
            fillColor: getGradientFill(color),
          },
        ],
      });
    }

    if (serverData && serverData.channels) {
      serverData.channels.forEach(function (channel) {
        if (charts['channel-' + channel.channel_id]) {
          charts['channel-' + channel.channel_id].update({
            series: [
              {
                color: color,
                fillColor: getGradientFill(color),
              },
            ],
          });
        }
      });
    }
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
    var color = 'rgba(' + vibrant.join(',') + ', 0.6)';
    callback(color);
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

function getGradientFill(baseColor) {
  return {
    linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
    stops: [
      [0, baseColor],
      [1, Highcharts.color(baseColor).setOpacity(0.35).get()],
    ],
  };
}

function createServerOverviewChart() {
  if (!serverData) {
    return;
  }
  var container = document.getElementById('server-overview-chart');
  container.innerHTML = '';
  container.style.height = '500px';

  var resetButton = document.createElement('button');
  resetButton.textContent = 'Reset Zoom';
  resetButton.className = 'reset-zoom-btn';
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
    return new Date(a.timestamp) - new Date(b.timestamp);
  });
  var cumulativeCount = 0;
  var cumulativeData = allCounts.map(function (count) {
    cumulativeCount += 1;
    return [
      new Date(count.timestamp).getTime(),
      cumulativeCount,
      count.channelName,
    ];
  });

  var totalPoints = cumulativeData.length;
  var skipRate = 1;
  if (totalPoints > 2000) {
    skipRate = Math.ceil(totalPoints / 2000);
  }
  var sampledData = cumulativeData.filter(function (_, index) {
    return index % skipRate === 0;
  });

  charts['server-overview'] = Highcharts.chart(container, {
    chart: {
      type: 'area',
      zoomType: 'x',
      backgroundColor: 'transparent',
      height: 500,
      animation: true,
      style: {
        fontFamily: 'Poppins, sans-serif',
      },
      events: {
        selection: function (event) {
          if (event.xAxis) {
            resetButton.style.display = 'inline-block';
          }
        },
      },
    },
    title: { text: null },
    xAxis: {
      type: 'datetime',
      tickAmount: 4,
      labels: {
        style: {
          color: getComputedStyle(document.documentElement).getPropertyValue(
            '--text-color'
          ),
          fontSize: '12px',
        },
        formatter: function () {
          var date = Highcharts.dateFormat('%b %d, %Y', this.value);
          var time = Highcharts.dateFormat('%H:%M', this.value);
          return date + '\n' + time;
        },
      },
      lineColor: getComputedStyle(document.documentElement).getPropertyValue(
        '--border-color'
      ),
      tickColor: getComputedStyle(document.documentElement).getPropertyValue(
        '--border-color'
      ),
    },
    yAxis: {
      title: { text: null },
      tickAmount: 5,
      labels: {
        style: {
          color: getComputedStyle(document.documentElement).getPropertyValue(
            '--text-color'
          ),
          fontSize: '12px',
        },
      },
      gridLineColor: getComputedStyle(
        document.documentElement
      ).getPropertyValue('--border-color'),
    },
    tooltip: {
      backgroundColor: '#333333',
      style: {
        color: '#ffffff',
        fontWeight: 'normal',
        fontSize: '12px',
      },
      formatter: function () {
        return (
          '<b>Date:</b> ' +
          Highcharts.dateFormat('%b %d, %Y, %H:%M', this.x) +
          '<br/><b>Total counts:</b> ' +
          this.y.toLocaleString()
        );
      },
      useHTML: true,
      borderRadius: 8,
      borderWidth: 0,
    },
    series: [
      {
        name: 'Total Counts',
        data: sampledData.map(function (d) {
          return {
            x: d[0],
            y: d[1],
            channel: d[2],
          };
        }),
        color: getComputedStyle(document.documentElement).getPropertyValue(
          '--accent-color'
        ),
        fillColor: getGradientFill(
          getComputedStyle(document.documentElement).getPropertyValue(
            '--accent-color'
          )
        ),
        marker: { enabled: false },
        lineWidth: 3,
      },
    ],
    plotOptions: {
      area: {
        fillOpacity: 0.4,
      },
      series: {
        states: {
          hover: {
            lineWidth: 3,
          },
        },
      },
    },
    credits: { enabled: false },
    exporting: { enabled: false },
    legend: { enabled: false },
  });

  resetButton.addEventListener('click', function () {
    charts['server-overview'].zoomOut();
    resetButton.style.display = 'none';
  });
}

function createChannelCharts() {
  if (!serverData) return;
  var channelChartsGrid = document.getElementById('channel-charts-grid');
  if (serverData.channels.length > 1) {
    channelChartsGrid.classList.add('grid');
  } else {
    channelChartsGrid.classList.remove('grid');
  }
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
      '" class="reset-zoom-btn">Reset Zoom</button>' +
      '</div>' +
      '<div id="channel-' +
      channel.channel_id +
      '-chart" class="chart-container"></div>';
    channelChartsGrid.appendChild(card);

    var container = document.getElementById(
      'channel-' + channel.channel_id + '-chart'
    );
    container.style.height = serverData.channels.length > 1 ? '320px' : '500px';

    var resetButton = document.getElementById(
      'resetZoomChannel-' + channel.channel_id
    );
    var accentColor = getComputedStyle(
      document.documentElement
    ).getPropertyValue('--accent-color');

    var channelCounts = channel.counts.map(function (count) {
      return [new Date(count.timestamp).getTime(), count.count_number];
    });
    channelCounts.sort(function (a, b) {
      return a[0] - b[0];
    });

    var totalPoints = channelCounts.length;
    var skipRate = 1;
    if (totalPoints > 2000) {
      skipRate = Math.ceil(totalPoints / 2000);
    }
    var sampledData = channelCounts.filter(function (_, index) {
      return index % skipRate === 0;
    });

    charts['channel-' + channel.channel_id] = Highcharts.chart(container, {
      chart: {
        type: 'area',
        zoomType: 'x',
        backgroundColor: 'transparent',
        animation: true,
        resetZoomButton: { theme: { display: 'none' } },
        style: { fontFamily: 'Poppins, sans-serif' },
        events: {
          selection: function (event) {
            if (event.xAxis) {
              resetButton.style.display = 'inline-block';
            }
          },
        },
      },
      title: { text: null },
      xAxis: {
        type: 'datetime',
        tickAmount: 4,
        labels: {
          style: {
            color: getComputedStyle(document.documentElement).getPropertyValue(
              '--text-color'
            ),
            fontSize: '12px',
          },
          formatter: function () {
            var date = Highcharts.dateFormat('%b %d, %Y', this.value);
            var time = Highcharts.dateFormat('%H:%M', this.value);
            return date + '\n' + time;
          },
        },
        lineColor: getComputedStyle(document.documentElement).getPropertyValue(
          '--border-color'
        ),
        tickColor: getComputedStyle(document.documentElement).getPropertyValue(
          '--border-color'
        ),
      },
      yAxis: {
        title: { text: null },
        tickAmount: 5,
        labels: {
          style: {
            color: getComputedStyle(document.documentElement).getPropertyValue(
              '--text-color'
            ),
            fontSize: '12px',
          },
        },
        gridLineColor: getComputedStyle(
          document.documentElement
        ).getPropertyValue('--border-color'),
      },
      tooltip: {
        backgroundColor: '#333333',
        style: {
          color: '#ffffff',
          fontSize: '12px',
        },
        formatter: function () {
          return (
            '<b>Date:</b> ' +
            Highcharts.dateFormat('%b %d, %Y, %H:%M', this.x) +
            '<br/><b>Count:</b> ' +
            this.y.toLocaleString()
          );
        },
        useHTML: true,
        borderRadius: 8,
        borderWidth: 0,
      },
      series: [
        {
          name: 'Count',
          data: sampledData,
          color: accentColor,
          fillColor: getGradientFill(accentColor),
          marker: { enabled: false },
          lineWidth: 3,
        },
      ],
      plotOptions: {
        area: {
          fillOpacity: 0.4,
        },
        series: {
          states: {
            hover: {
              lineWidth: 3,
            },
          },
        },
      },
      credits: { enabled: false },
      exporting: { enabled: false },
      legend: { enabled: false },
    });

    resetButton.addEventListener('click', function () {
      charts['channel-' + channel.channel_id].zoomOut();
      resetButton.style.display = 'none';
    });
  });
}

function createUserCharts() {
  if (!serverData) return;
  var userChartsGrid = document.getElementById('user-charts-grid');
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
    return new Date(a.timestamp) - new Date(b.timestamp);
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
    }
    userCounts[count.user_id].counts.push({
      x: new Date(count.timestamp).getTime(),
      y: userCounts[count.user_id].counts.length + 1,
    });
    if (!userTotals[count.user_id]) {
      userTotals[count.user_id] = { id: count.user_id, total: 0 };
    }
    userTotals[count.user_id].total += 1;
  });

  var sortedUsers = Object.values(userTotals).sort(function (a, b) {
    return b.total - a.total;
  });

  if (Object.keys(userCounts).length > 1) {
    userChartsGrid.classList.add('grid');
  } else {
    userChartsGrid.classList.remove('grid');
  }

  sortedUsers.forEach(function (userTotal, index) {
    var user = userCounts[userTotal.id];
    var rank = index + 1;
    var card = document.createElement('div');
    card.className = 'card';
    card.innerHTML =
      '<div class="card-header">' +
      '<div style="display: flex; align-items: center; gap: 12px;">' +
      '<img' +
      ' src="' +
      user.profile_pic +
      '"' +
      ' alt="' +
      user.display_name +
      '\'s Profile Picture"' +
      ' style="' +
      'width: 46px;' +
      'height: 46px;' +
      'border-radius: 10px;' +
      'object-fit: cover;' +
      'box-shadow: var(--card-shadow);' +
      '"' +
      '/>' +
      '<div>' +
      '<h2 class="card-title" style="margin: 0;">' +
      user.display_name +
      ' (@' +
      user.username +
      ')' +
      '</h2>' +
      '<small style="color: var(--text-muted);">' +
      'Leaderboard Rank: #' +
      rank +
      '</small>' +
      '</div>' +
      '</div>' +
      '<button id="resetZoomUser-' +
      user.id +
      '" class="reset-zoom-btn">Reset Zoom</button>' +
      '</div>' +
      '<div id="user-' +
      user.id +
      '-chart" class="chart-container"></div>';

    userChartsGrid.appendChild(card);

    var container = document.getElementById('user-' + user.id + '-chart');
    container.style.height =
      Object.keys(userCounts).length > 1 ? '320px' : '500px';

    var resetButton = document.getElementById('resetZoomUser-' + user.id);
    var profilePic = new Image();
    profilePic.crossOrigin = 'Anonymous';
    profilePic.src = user.profile_pic;

    profilePic.onload = function () {
      var colorThief = new ColorThief();
      var palette = colorThief.getPalette(profilePic, 8);
      var vibrant = getMostVibrantColor(palette);
      var color = 'rgba(' + vibrant.join(',') + ', 0.65)';

      resetButton.style.backgroundColor = color;

      var userData = user.counts;
      var totalPoints = userData.length;
      var skipRate = 1;
      if (totalPoints > 2000) {
        skipRate = Math.ceil(totalPoints / 2000);
      }
      var sampledData = userData.filter(function (_, idx) {
        return idx % skipRate === 0;
      });

      charts['user-' + user.id] = Highcharts.chart(container, {
        chart: {
          type: 'area',
          zoomType: 'x',
          backgroundColor: 'transparent',
          animation: true,
          resetZoomButton: { theme: { display: 'none' } },
          style: {
            fontFamily: 'Poppins, sans-serif',
          },
          events: {
            selection: function (event) {
              if (event.xAxis) {
                resetButton.style.display = 'inline-block';
              }
            },
          },
        },
        title: { text: null },
        xAxis: {
          type: 'datetime',
          tickAmount: 4,
          labels: {
            style: {
              color: getComputedStyle(
                document.documentElement
              ).getPropertyValue('--text-color'),
              fontSize: '12px',
            },
            formatter: function () {
              var date = Highcharts.dateFormat('%b %d, %Y', this.value);
              var time = Highcharts.dateFormat('%H:%M', this.value);
              return date + '\n' + time;
            },
          },
          lineColor: getComputedStyle(
            document.documentElement
          ).getPropertyValue('--border-color'),
          tickColor: getComputedStyle(
            document.documentElement
          ).getPropertyValue('--border-color'),
        },
        yAxis: {
          title: { text: null },
          tickAmount: 5,
          labels: {
            style: {
              color: getComputedStyle(
                document.documentElement
              ).getPropertyValue('--text-color'),
              fontSize: '12px',
            },
          },
          gridLineColor: getComputedStyle(
            document.documentElement
          ).getPropertyValue('--border-color'),
        },
        tooltip: {
          backgroundColor: '#333333',
          style: {
            color: '#ffffff',
            fontSize: '12px',
          },
          formatter: function () {
            return (
              '<b>Date:</b> ' +
              Highcharts.dateFormat('%b %d, %Y, %H:%M', this.x) +
              '<br/><b>Total counts:</b> ' +
              this.y.toLocaleString()
            );
          },
          useHTML: true,
          borderRadius: 8,
          borderWidth: 0,
        },
        series: [
          {
            name: 'Total Counts',
            data: sampledData,
            color: color,
            fillColor: {
              linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
              stops: [
                [0, color],
                [1, Highcharts.color(color).setOpacity(0.35).get()],
              ],
            },
            marker: { enabled: false },
            lineWidth: 3,
          },
        ],
        plotOptions: {
          area: {
            fillOpacity: 0.4,
          },
          series: {
            states: {
              hover: {
                lineWidth: 3,
              },
            },
          },
        },
        credits: { enabled: false },
        exporting: { enabled: false },
        legend: { enabled: false },
      });

      resetButton.addEventListener('click', function () {
        charts['user-' + user.id].zoomOut();
        resetButton.style.display = 'none';
      });
    };
  });
}

function createLeaderboard() {
  if (!serverData) {
    return;
  }
  var leaderboard = document.getElementById('leaderboard-list');
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
      '<img' +
      ' class="leaderboard-avatar"' +
      ' src="' +
      user.profile_pic +
      '"' +
      ' alt="' +
      user.display_name +
      '"' +
      '/>' +
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
    return new Date(a.timestamp) - new Date(b.timestamp);
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
