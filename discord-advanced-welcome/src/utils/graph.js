import dayjs from 'dayjs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getJoinData } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tempDir = path.join(__dirname, '../../temp');

let chartAvailable = null;
let ChartJSNodeCanvas = null;

async function ensureTempDir() {
  try {
    await fs.access(tempDir);
  } catch {
    await fs.mkdir(tempDir, { recursive: true });
  }
}

async function checkChart() {
  if (chartAvailable === null) {
    try {
      const chartModule = await import('chartjs-node-canvas');
      ChartJSNodeCanvas = chartModule.ChartJSNodeCanvas;
      chartAvailable = true;
    } catch (error) {
      console.warn('ChartJS module could not be loaded. Graph feature disabled.');
      console.warn('Graphs will be shown in table format.');
      chartAvailable = false;
    }
  }
  return chartAvailable;
}

export async function createJoinGraph(days) {
  const isAvailable = await checkChart();
  
  if (!isAvailable) {
    return null;
  }

  await ensureTempDir();
  const data = await getJoinData(days);

  const filledDates = [];
  const filledCounts = [];
  const startDate = dayjs().subtract(days - 1, 'day');
  
  if (data.length === 0) {
    for (let i = 0; i < days; i++) {
      filledDates.push(startDate.add(i, 'day').format('MM/DD'));
      filledCounts.push(0);
    }
  } else {
    const dataMap = new Map(data.map(row => [row.date, row.count]));
    
    for (let i = 0; i < days; i++) {
      const currentDate = startDate.add(i, 'day').format('YYYY-MM-DD');
      filledDates.push(startDate.add(i, 'day').format('MM/DD'));
      filledCounts.push(dataMap.get(currentDate) || 0);
    }
  }

  return await generateChart(filledDates, filledCounts, days);
}

async function generateChart(labels, data, days) {
  if (!ChartJSNodeCanvas) {
    const chartModule = await import('chartjs-node-canvas');
    ChartJSNodeCanvas = chartModule.ChartJSNodeCanvas;
  }
  
  const width = 1200;
  const height = 600;

  const chartJSNodeCanvas = new ChartJSNodeCanvas({
    width,
    height,
    backgroundColor: '#0d1117'
  });

  const configuration = {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Daily Joins',
        data: data,
        borderColor: '#1f6feb',
        backgroundColor: 'rgba(31, 111, 235, 0.1)',
        pointBackgroundColor: '#58a6ff',
        pointBorderColor: '#58a6ff',
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 3,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: false,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: '#ffffff',
            font: {
              size: 16,
              family: 'Arial'
            }
          }
        },
        title: {
          display: true,
          text: `Daily Joins - Last ${days} Days`,
          color: '#ffffff',
          font: {
            size: 24,
            family: 'Arial',
            weight: 'bold'
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#8b949e',
            font: {
              size: 12,
              family: 'Arial'
            }
          },
          grid: {
            color: 'rgba(139, 148, 158, 0.2)'
          }
        },
        y: {
          ticks: {
            color: '#8b949e',
            font: {
              size: 12,
              family: 'Arial'
            },
            beginAtZero: true,
            stepSize: 1
          },
          grid: {
            color: 'rgba(139, 148, 158, 0.2)'
          }
        }
      }
    }
  };

  const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
  
  const filename = `graph-${Date.now()}.png`;
  const filepath = path.join(tempDir, filename);
  await fs.writeFile(filepath, imageBuffer);

  return filepath;
}

export async function deleteGraphFile(filepath) {
  try {
    await fs.unlink(filepath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Error deleting graph file:', error);
    }
  }
}

