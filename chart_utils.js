export function initChart(ctx) {
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: [], // Rep numbers
            datasets: [{
                label: 'Posture Score (%)',
                data: [],
                borderColor: '#00ff88',
                backgroundColor: 'rgba(0, 255, 136, 0.2)',
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 4,
                fill: true
            }, {
                label: 'Target Depth',
                data: [],
                borderColor: '#FF0088', // Magenta for target
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

export function updateChart(chart, label, dataPoint, targetLineValue = null) {
    chart.data.labels.push(label);
    chart.data.datasets[0].data.push(dataPoint);

    if (targetLineValue !== null) {
        chart.data.datasets[1].data.push(targetLineValue);
    }

    chart.update();
}

export function resetChart(chart) {
    chart.data.labels = [];
    chart.data.datasets[0].data = [];
    chart.data.datasets[1].data = [];
    chart.update();
}
