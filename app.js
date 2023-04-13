// app.js

let chartInstance;


const events = JSON.parse(localStorage.getItem('events')) || [  {name: '50 free', times: ['1.00.00']},
  {name: '100 free', times: []},
  {name: '200 free', times: []},
  {name: '400 free', times: []},
  {name: '800 free', times: []},
  {name: '1500 free', times: []},
  {name: '50 back', times: []},
  {name: '100 back', times: []},
  {name: '200 back', times: []},
  {name: '50 breast', times: []},
  {name: '100 breast', times: []},
  {name: '200 breast', times: []},
  {name: '50 fly', times: []},
  {name: '100 fly', times: []},
  {name: '200 fly', times: []},
  {name: '100 IM', times: []},
  {name: '200 IM', times: []},
  {name: '400 IM', times: []},
];

function storeEvents() {
  localStorage.setItem('events', JSON.stringify(events));
}

function renderTable() {
  const table = document.getElementById('timeTable');
  table.innerHTML = '';

  const headerRow = document.createElement('tr');
  headerRow.innerHTML = '<th>Event</th><th colspan="2">Times</th>';
  table.appendChild(headerRow);

  events.forEach((event, eventIndex) => {
    const row = document.createElement('tr');
    const timeCells = event.times
      .map(
        (time, timeIndex) => `
      <td>${time} <input type="checkbox" data-event="${eventIndex}" data-time="${timeIndex}" /></td>
    `
      )
      .join('');
    row.innerHTML = `
      <td>${event.name}</td>
      <td>${timeCells}</td>
      <td><button class="delete-time" data-event="${eventIndex}">Delete</button></td>
    `;
    table.appendChild(row);
  });

  // Add click event listener for delete buttons
  document.querySelectorAll('.delete-time').forEach(button => {
    button.addEventListener('click', handleDeleteEvent);
  });
}


function plotGraph() {
  const labels = events[0].times.map((_, index) => `Entry ${index + 1}`);
  const data = {
    labels: labels,
    datasets: events.map(event => ({
      label: event.name,
      data: event.times.map(time => {
        const [minutes, seconds, milliseconds] = time.split('.').map(Number);
        return (minutes * 60 + seconds) * 100 + milliseconds;
      }),
      fill: false,
      borderColor: '#' + Math.floor(Math.random() * 16777215).toString(16),
      tension: 0.1,
    })),
  };

  const config = {
    type: 'line',
    data: data,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Swimming Time Progress',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              const minutes = Math.floor(value / 6000);
              const seconds = Math.floor((value % 6000) / 100);
              const milliseconds = value % 100;
              return `${minutes}.${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
            },
          },
        },
      },
    },
  };

  const ctx = document.getElementById('chartCanvas').getContext('2d');
  if (chartInstance) {
    chartInstance.destroy();
  }
  chartInstance = new Chart(ctx, config);
}

function handleDeleteEvent(event) {
  const eventIndex = parseInt(event.target.dataset.event, 10);
  events[eventIndex].times = [];

  storeEvents();
  renderTable();
  plotGraph();
}

function handleFormSubmit(event) {
  event.preventDefault();

  const eventName = document.getElementById('eventName').value;
  const eventTime = document.getElementById('eventTime').value;

  const eventData = events.find(event => event.name === eventName);
  eventData.times.push(eventTime);

  storeEvents();
  renderTable();
  plotGraph();
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, {type: 'array'});
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, {header: 1});

    // Process JSON data and update events array
    for (let i = 1; i < json.length; i++) {
      const eventName = json[i][0];
      const eventTime = json[i][1];

      if (!eventName || !eventTime) {
        continue;
      }

      const eventData = events.find(event => event.name === eventName);
      if (eventData) {
        eventData.times.push(eventTime);
      } else {
        events.push({name: eventName, times: [eventTime]});
      }
    }

    storeEvents();
    renderTable();
    plotGraph();
  };

  reader.readAsArrayBuffer(file);
}

function handleDeleteData() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    if (checkbox.checked) {
      const eventIndex = parseInt(checkbox.dataset.event, 10);
      const timeIndex = parseInt(checkbox.dataset.time, 10);
      events[eventIndex].times.splice(timeIndex, 1);
    }
  });

  storeEvents();
  renderTable();
  plotGraph();
}

document.getElementById('eventForm').addEventListener('submit', handleFormSubmit);
document.getElementById('uploadExcel').addEventListener('change', handleFileUpload);
document.getElementById('deleteData').addEventListener('click', handleDeleteData);

renderTable();
plotGraph();
