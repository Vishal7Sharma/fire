// Emergency expenses per scenario (stored as objects)
const emergencyData = {
    1: { 5: 500000, 8: 2500000, 10: 500000, 15: 500000, 16: 2500000, 20: 4500000, 25: 3000000, 28: 10000000 },
    2: { 5: 500000, 8: 2500000, 10: 500000, 15: 500000, 16: 2500000, 20: 4500000, 25: 3000000, 28: 10000000 },
    3: { 5: 500000, 8: 2500000, 10: 500000, 15: 500000, 16: 2500000, 20: 4500000, 25: 3000000, 28: 10000000 }
};

const colors = ['#2E86AB', '#A23B72', '#F18F01'];

function getVal(id) { 
    return parseFloat(document.getElementById(id).value) || 0; 
}

function getStr(id) { 
    return document.getElementById(id).value; 
}

function formatAmount(amount) {
    if (amount >= 10000000) return (amount / 10000000).toFixed(1) + ' Cr';
    if (amount >= 100000) return (amount / 100000).toFixed(1) + ' L';
    return amount.toLocaleString('en-IN');
}

function renderEmergencyList(scenarioId) {
    const list = document.getElementById(`emergencyList${scenarioId}`);
    const data = emergencyData[scenarioId];
    const sortedYears = Object.keys(data).map(Number).sort((a, b) => a - b);
    
    if (sortedYears.length === 0) {
        list.innerHTML = '<div style="color: #666; font-size: 11px; text-align: center;">No emergency expenses added</div>';
        return;
    }
    
    list.innerHTML = sortedYears.map(year => `
        <div class="emergency-item">
            <span class="year-label">Y${year}:</span>
            <span style="flex: 1; color: #4ecdc4;">₹${formatAmount(data[year])}</span>
            <button class="remove-btn" onclick="removeEmergency(${scenarioId}, ${year})">×</button>
        </div>
    `).join('');
}

function addEmergency(scenarioId) {
    const yearInput = document.getElementById(`emergencyYear${scenarioId}`);
    const amountInput = document.getElementById(`emergencyAmount${scenarioId}`);
    const year = parseInt(yearInput.value);
    const amount = parseFloat(amountInput.value);
    
    if (!year || year < 1 || year > 50) {
        alert('Please enter a valid year (1-50)');
        return;
    }
    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    emergencyData[scenarioId][year] = amount;
    yearInput.value = '';
    amountInput.value = '';
    renderEmergencyList(scenarioId);
    calculate();
}

function removeEmergency(scenarioId, year) {
    delete emergencyData[scenarioId][year];
    renderEmergencyList(scenarioId);
    calculate();
}

function calculateScenario(params, emergencyCapital) {
    const { initialCapital, returns, inflation, sip, sipStepUp, sipDuration, swp, swpStepUp, homeLoanEmi, homeLoanTenure, numYears } = params;
    const results = [];
    let capital = initialCapital;
    let sipAmount = sip;
    let swpAmount = swp;

    for (let year = 1; year <= numYears; year++) {
        if (year <= sipDuration) {
            capital += sipAmount;
            sipAmount *= (1 + sipStepUp / 100);
        }
        capital -= swpAmount;
        swpAmount *= (1 + swpStepUp / 100);
        
        if (year <= homeLoanTenure) {
            capital -= homeLoanEmi;
        }

        const emergency = (emergencyCapital[year] || 0) * Math.pow(1 + inflation / 100, year);
        capital -= emergency;
        capital *= (1 + returns / 100);
        
        const realCapital = capital / Math.pow(1 + inflation / 100, year);
        results.push({ year, nominal: capital / 1e7, real: realCapital / 1e7 });
    }
    return results;
}

function calculate() {
    const scenarios = [1, 2, 3].map(i => ({
        name: getStr(`name${i}`),
        numYears: getVal(`numYears${i}`),
        results: calculateScenario({
            initialCapital: getVal(`capital${i}`),
            returns: getVal(`returns${i}`),
            inflation: getVal(`inflation${i}`),
            sip: getVal(`sip${i}`),
            sipStepUp: getVal(`sipStep${i}`),
            sipDuration: getVal(`sipDur${i}`),
            swp: getVal(`swp${i}`),
            swpStepUp: getVal(`swpStep${i}`),
            homeLoanEmi: getVal(`homeLoanEmi${i}`),
            homeLoanTenure: getVal(`homeLoanTenure${i}`),
            numYears: getVal(`numYears${i}`)
        }, emergencyData[i])
    }));

    const maxYears = Math.max(...scenarios.map(s => s.numYears));
    drawChart(scenarios, maxYears);
    drawTable(scenarios, maxYears);
    drawSummary(scenarios);
}

// Store chart data for hover functionality
let chartData = {
    scenarios: [],
    maxYears: 0,
    padding: { left: 60, right: 20, top: 20, bottom: 40 },
    maxVal: 0,
    minVal: 0,
    range: 0
};

function drawChart(scenarios, maxYears) {
    const canvas = document.getElementById('chart');
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width - 40;
    canvas.height = 400;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const allValues = scenarios.flatMap(s => s.results.map(r => r.real));
    const maxVal = Math.max(...allValues) * 1.1;
    const minVal = Math.min(0, Math.min(...allValues) * 1.1);
    const range = maxVal - minVal;

    const padding = { left: 60, right: 20, top: 20, bottom: 40 };
    const chartWidth = canvas.width - padding.left - padding.right;
    const chartHeight = canvas.height - padding.top - padding.bottom;

    // Store for hover
    chartData = { scenarios, maxYears, padding, maxVal, minVal, range, chartWidth, chartHeight, canvas };

    // Grid lines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = padding.top + (chartHeight * i / 5);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(canvas.width - padding.right, y);
        ctx.stroke();
        
        const val = maxVal - (range * i / 5);
        ctx.fillStyle = '#888';
        ctx.font = '11px Segoe UI';
        ctx.textAlign = 'right';
        ctx.fillText(val.toFixed(1), padding.left - 8, y + 4);
    }

    // X-axis labels
    ctx.textAlign = 'center';
    for (let year = 5; year <= maxYears; year += 5) {
        const x = padding.left + (chartWidth * year / maxYears);
        ctx.fillText(`Y${year}`, x, canvas.height - 10);
    }

    // Draw lines
    scenarios.forEach((scenario, si) => {
        ctx.beginPath();
        ctx.strokeStyle = colors[si];
        ctx.lineWidth = 3;
        
        scenario.results.forEach((r, i) => {
            const x = padding.left + (chartWidth * (i + 1) / maxYears);
            const y = padding.top + chartHeight - ((r.real - minVal) / range * chartHeight);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Draw points
        scenario.results.forEach((r, i) => {
            if (i % 3 === 0 || i === scenario.results.length - 1) {
                const x = padding.left + (chartWidth * (i + 1) / maxYears);
                const y = padding.top + chartHeight - ((r.real - minVal) / range * chartHeight);
                ctx.beginPath();
                ctx.fillStyle = colors[si];
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    });

    // Legend
    scenarios.forEach((s, i) => {
        const x = padding.left + 20 + (i * 140);
        ctx.fillStyle = colors[i];
        ctx.fillRect(x, 8, 20, 3);
        ctx.fillStyle = '#fff';
        ctx.font = '12px Segoe UI';
        ctx.textAlign = 'left';
        ctx.fillText(s.name, x + 25, 12);
    });
}

function setupChartHover() {
    const canvas = document.getElementById('chart');
    const tooltip = document.getElementById('chartTooltip');
    
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const { scenarios, maxYears, padding, chartWidth, chartHeight, minVal, range } = chartData;
        if (!scenarios.length) return;
        
        // Find closest year
        const yearFloat = ((mouseX - padding.left) / chartWidth) * maxYears;
        const year = Math.round(yearFloat);
        
        if (year < 1 || year > maxYears || mouseX < padding.left || mouseX > padding.left + chartWidth) {
            tooltip.style.display = 'none';
            return;
        }
        
        // Get values for all scenarios at this year
        let tooltipContent = `<div class="tooltip-year">Year ${year}</div>`;
        let hasData = false;
        
        scenarios.forEach((s, i) => {
            if (year <= s.results.length) {
                const val = s.results[year - 1].real;
                tooltipContent += `<div class="tooltip-row">
                    <span class="tooltip-dot" style="background: ${colors[i]}"></span>
                    <span class="tooltip-name">${s.name}:</span>
                    <span class="tooltip-value" style="color: ${val >= 0 ? '#4ecdc4' : '#ff6b6b'}">₹${val.toFixed(2)} Cr</span>
                </div>`;
                hasData = true;
            }
        });
        
        if (hasData) {
            tooltip.innerHTML = tooltipContent;
            tooltip.style.display = 'block';
            
            // Position tooltip
            let tooltipX = e.clientX + 15;
            let tooltipY = e.clientY - 10;
            
            // Keep tooltip in viewport
            const tooltipRect = tooltip.getBoundingClientRect();
            if (tooltipX + tooltipRect.width > window.innerWidth) {
                tooltipX = e.clientX - tooltipRect.width - 15;
            }
            
            tooltip.style.left = tooltipX + 'px';
            tooltip.style.top = tooltipY + 'px';
        }
    });
    
    canvas.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
    });
}

function drawTable(scenarios, maxYears) {
    const table = document.getElementById('resultsTable');
    let html = `<thead><tr><th>Year</th>${scenarios.map((s, i) => `<th class="s${i+1}-color">${s.name}</th>`).join('')}</tr></thead><tbody>`;
    
    for (let y = 0; y < maxYears; y++) {
        html += `<tr><td>${y + 1}</td>`;
        scenarios.forEach(s => {
            if (y < s.results.length) {
                const val = s.results[y].real;
                const color = val < 0 ? '#ff6b6b' : '#4ecdc4';
                html += `<td style="color: ${color}">₹${val.toFixed(2)} Cr</td>`;
            } else {
                html += `<td style="color: #666">—</td>`;
            }
        });
        html += '</tr>';
    }
    html += '</tbody>';
    table.innerHTML = html;
}

function drawSummary(scenarios) {
    const finals = scenarios.map(s => ({ name: s.name, value: s.results[s.results.length - 1].real }));
    const sorted = [...finals].sort((a, b) => b.value - a.value);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    const diff = best.value - worst.value;

    document.getElementById('summary').innerHTML = `
        <div class="summary-card">
            <div class="label">🏆 Best Scenario</div>
            <div class="value" style="color: #4ecdc4">${best.name}</div>
            <div class="sub">₹${best.value.toFixed(2)} Cr</div>
        </div>
        <div class="summary-card">
            <div class="label">📉 Lowest Scenario</div>
            <div class="value" style="color: #ff6b6b">${worst.name}</div>
            <div class="sub">₹${worst.value.toFixed(2)} Cr</div>
        </div>
        <div class="summary-card">
            <div class="label">📊 Difference</div>
            <div class="value" style="color: #F18F01">₹${diff.toFixed(2)} Cr</div>
            <div class="sub">${((diff / Math.abs(worst.value)) * 100).toFixed(1)}% more</div>
        </div>
    `;
}

function drawBarChart(scenarios) {
    const canvas = document.getElementById('barChart');
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width - 40;
    canvas.height = 300;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const finals = scenarios.map((s, i) => ({
        name: s.name,
        value: s.results[s.results.length - 1].real,
        color: colors[i]
    }));

    const maxVal = Math.max(...finals.map(f => Math.abs(f.value))) * 1.2;
    const padding = { left: 20, right: 20, top: 40, bottom: 60 };
    const chartWidth = canvas.width - padding.left - padding.right;
    const chartHeight = canvas.height - padding.top - padding.bottom;
    const barWidth = chartWidth / scenarios.length - 30;
    const gap = 30;

    // Title
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('Final Corpus (₹ Crores)', canvas.width / 2, 20);

    // Draw bars
    finals.forEach((f, i) => {
        const x = padding.left + (i * (barWidth + gap)) + gap / 2;
        const barHeight = (Math.abs(f.value) / maxVal) * chartHeight;
        const y = f.value >= 0 ? padding.top + chartHeight - barHeight : padding.top + chartHeight;

        // Bar
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [6, 6, 0, 0]);
        ctx.fill();

        // Value label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Segoe UI';
        ctx.textAlign = 'center';
        const valueY = f.value >= 0 ? y - 10 : y + barHeight + 20;
        ctx.fillText(`₹${f.value.toFixed(1)} Cr`, x + barWidth / 2, valueY);

        // Scenario name
        ctx.fillStyle = f.color;
        ctx.font = '12px Segoe UI';
        ctx.fillText(f.name, x + barWidth / 2, canvas.height - 15);
    });

    // Zero line
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + chartHeight);
    ctx.lineTo(canvas.width - padding.right, padding.top + chartHeight);
    ctx.stroke();
}

function drawMilestones(scenarios) {
    const milestones = [5, 10, 20, 50]; // Crore milestones
    const container = document.getElementById('milestones');
    
    let html = '';
    
    milestones.forEach(milestone => {
        const scenarioYears = scenarios.map((s, i) => {
            const yearIndex = s.results.findIndex(r => r.real >= milestone);
            return {
                name: s.name,
                year: yearIndex >= 0 ? yearIndex + 1 : null,
                color: colors[i]
            };
        });

        const maxYear = Math.max(...scenarioYears.filter(s => s.year).map(s => s.year), 1);
        
        html += `
            <div class="milestone-row">
                <div class="milestone-label">₹${milestone} Cr</div>
                <div class="milestone-bars">
                    ${scenarioYears.map(s => {
                        if (s.year) {
                            const width = (s.year / maxYear) * 100;
                            return `
                                <div class="milestone-bar">
                                    <div class="milestone-bar-fill" style="background: ${s.color}; width: ${width}%"></div>
                                    <span class="milestone-bar-text">${s.name}: Year ${s.year}</span>
                                </div>
                            `;
                        } else {
                            return `
                                <div class="milestone-bar">
                                    <div class="milestone-bar-fill" style="background: #333; width: 100%"></div>
                                    <span class="milestone-bar-text never">${s.name}: Not reached</span>
                                </div>
                            `;
                        }
                    }).join('')}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Initial calculation on page load
document.addEventListener('DOMContentLoaded', function() {
    [1, 2, 3].forEach(i => renderEmergencyList(i));
    calculate();
    setupChartHover();
    window.addEventListener('resize', calculate);
});
