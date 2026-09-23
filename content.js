/**
 * 42 Intra Logtime Hours Calculator - content.js
 * Version: 1.4
 */

// ==========================================
// CORE DATA STATE FOR CUSTOM SELECTIONS
// ==========================================
let selectionStartIndex = null;
let selectionEndIndex = null;
let isDragging = false;

// Global buffer tying physical DOM order to their calculated hour values
window.calendarTimeline = [];

/**
 * Injects high-performance, flat CSS rules for clean visibility and smooth micro-animations.
 * Scopes tooltip overrides strictly to the logtime grid matrix to prevent breaking global page menus.
 */
function injectHoverStyles() {
    if (document.getElementById('logtime-hover-styles')) return;

    const style = document.createElement('style');
    style.id = 'logtime-hover-styles';
    style.textContent = `
        table.table-fixed tbody td div[data-chrono-index],
        #user-locations g[data-toggle="tooltip"] rect {
            cursor: pointer;
        }

        /* System default dragging cursor fallback securely isolated from root tracking fields */
        body.logtime-dragging-state table.table-fixed tbody td div[data-chrono-index],
        body.logtime-dragging-state #user-locations g[data-toggle="tooltip"] rect,
        body.logtime-dragging-state {
            cursor: move;
        }

        /* Hover states */
        table.table-fixed tbody td div[data-chrono-index]:not(.tooltip):not([role="tooltip"]):hover {
            box-shadow: inset 0 0 0 2px #008082 !important;
            border-radius: 2px !important;
        }
        #user-locations g[data-toggle="tooltip"]:hover rect {
            stroke: #008082 !important;
            stroke-width: 2px !important;
        }

        /* V3 Selection Highlights - Scale contraction handles geometric variance without background masks */
        div.logtime-selected-node {
            box-shadow: inset 0 0 0 2px #00babc !important;
            transform: scale(0.85);
            border-radius: 2px !important;
            transition: transform 0.05s ease-in-out;
        }

        /* V2 SVG Drag & Text Protections */
        #user-locations g[data-toggle="tooltip"] rect,
        #user-locations g[data-toggle="tooltip"] text,
        #user-locations, #user-locations * {
            user-select: none !important;
            -webkit-user-select: none !important;
        }
        
        #user-locations g[data-toggle="tooltip"] text {
            pointer-events: none !important;
        }

        /* Scoped pointer-events isolation exclusively to selectors inside logtime grids */
        table.table-fixed .tooltip, 
        table.table-fixed .tooltip *, 
        table.table-fixed [role="tooltip"], 
        table.table-fixed .radix-popper, 
        table.table-fixed [data-radix-popper-content-wrapper],
        #user-locations .tooltip,
        #user-locations [role="tooltip"] {
            box-shadow: none !important;
            outline: none !important;
            border: none !important;
            filter: none !important;
            pointer-events: none !important;
        }

        /* Top-to-bottom drop entry configuration matching native tooltips */
        .logtime-dropdown-animated {
            position: absolute;
            right: 0;
            top: 20px;
            width: 220px;
            background-color: #1e1e24;
            border: 1px solid #3a3a42;
            border-radius: 6px;
            padding: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            opacity: 0;
            transform: scaleY(0.9) translateY(-2px);
            transform-origin: top center;
            transition: opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: none;
        }

        .logtime-dropdown-visible {
            opacity: 1;
            transform: scaleY(1) translateY(0);
            pointer-events: auto;
        }
    `;
    document.head.appendChild(style);
}

function parseMonthToIndex(monthStr) {
    const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
    return months[monthStr.toLowerCase().substring(0, 3)] ?? 0;
}

/**
 * Injects a minimalist, layout-safe status indicator dot inside the targeted container.
 */
function injectOnPageIndicator(targetContainer, isV2Layout = false) {
    if (document.getElementById('intra-logtime-indicator')) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'intra-logtime-indicator';
    
    if (isV2Layout) {
        wrapper.style.cssText = `
            position: absolute;
            top: -34px;
            right: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            z-index: 9999;
            transform: scale(0.9);
            transform-origin: top right;
        `;
    } else {
        wrapper.style.cssText = `
            position: relative;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            z-index: 9999;
            margin-left: auto;
            display: flex;
            align-items: center;
        `;
    }

    const badge = document.createElement('div');
    badge.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        cursor: pointer;
        user-select: none;
        -webkit-user-select: none;
        background-color: rgba(0, 186, 188, 0.05);
        border: 1px solid rgba(0, 186, 188, 0.15);
    `;
    badge.innerHTML = `<div style="width: 6px; height: 6px; background-color: #00babc; border-radius: 50%; box-shadow: 0 0 6px #00babc;"></div>`;

    const dropdown = document.createElement('div');
    dropdown.className = 'logtime-dropdown-animated';
    
    if (isV2Layout) {
        dropdown.style.transformOrigin = 'top right';
        dropdown.style.top = '22px';
    }

    dropdown.innerHTML = `
        <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: bold; color: #00babc; text-align: left;">Extension Ready:</p>
        <ul style="margin: 0; padding-left: 14px; font-size: 10px; color: #a0a0ab; line-height: 1.4; text-align: left; list-style-type: disc;">
            <li><strong style="color: #fff;">Click & drag</strong> across calendar squares to sum custom date ranges.</li>
        </ul>
    `;

    badge.addEventListener('mouseenter', () => dropdown.classList.add('logtime-dropdown-visible'));
    wrapper.addEventListener('mouseleave', () => dropdown.classList.remove('logtime-dropdown-visible'));

    wrapper.appendChild(badge);
    wrapper.appendChild(dropdown);
    targetContainer.appendChild(wrapper);
}

function updateSelectionUI() {
    let container = document.getElementById('logtime-range-badge');
    if (!container) {
        container = document.createElement('div');
        container.id = 'logtime-range-badge';
        container.style.position = 'fixed';
        container.style.bottom = '24px';
        container.style.right = '24px';
        container.style.backgroundColor = '#1e1e24';
        container.style.border = '1px solid #3a3a42';
        container.style.borderTop = '3px solid #00babc';
        container.style.borderRadius = '8px';
        container.style.padding = '12px 16px';
        container.style.color = '#ffffff';
        container.style.boxShadow = '0 10px 25px rgba(0,0,0,0.4)';
        container.style.fontFamily = 'monospace';
        container.style.zIndex = '99999';
        container.style.display = 'none';
        document.body.appendChild(container);
    }

    if (selectionStartIndex === null) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    
    const startIdx = Math.min(selectionStartIndex, selectionEndIndex);
    const endIdx = Math.max(selectionStartIndex, selectionEndIndex);

    let rangeMinutes = 0;
    for (let i = startIdx; i <= endIdx; i++) {
        if (window.calendarTimeline[i]) {
            rangeMinutes += window.calendarTimeline[i].mins;
        }
    }

    const startNode = window.calendarTimeline[startIdx];
    const endNode = window.calendarTimeline[endIdx];

    const startStr = startNode ? startNode.dateStr : "Unknown";
    const endStr = endNode ? endNode.dateStr : "Unknown";

    const hours = Math.floor(rangeMinutes / 60);
    const minutes = Math.round(rangeMinutes % 60);

    container.innerHTML = `
        <div style="color: #a0a0ab; font-weight: bold; margin-bottom: 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">Custom Selection</div>
        <div style="font-size: 11px; opacity: 0.9; margin-bottom: 2px;">Start: <span style="color: #fff">${startStr}</span></div>
        <div style="font-size: 11px; opacity: 0.9; margin-bottom: 12px;">End: &nbsp;<span style="color: #fff">${endStr}</span></div>
        <div style="font-size: 20px; font-weight: bold; color: #00babc;">~${hours}h ${minutes}m</div>
        <div style="font-size: 9px; opacity: 0.4; margin-top: 8px; text-align: right;">Click grid to clear</div>
    `;
}

function refreshVisualHighlights() {
    const startIdx = selectionStartIndex !== null ? Math.min(selectionStartIndex, selectionEndIndex) : -1;
    const endIdx = selectionStartIndex !== null ? Math.max(selectionStartIndex, selectionEndIndex) : -1;

    document.querySelectorAll('[data-chrono-index]').forEach(el => {
        const idx = parseInt(el.dataset.chronoIndex, 10);
        const isSelected = (startIdx !== -1 && idx >= startIdx && idx <= endIdx);

        if (el.tagName.toLowerCase() === 'rect') {
            if (isSelected) {
                if (!el.dataset.geometryAdjusted) {
                    const origX = parseFloat(el.getAttribute('x') || '0');
                    const origY = parseFloat(el.getAttribute('y') || '0');
                    const origW = parseFloat(el.getAttribute('width') || '0');
                    const origH = parseFloat(el.getAttribute('height') || '0');

                    el.dataset.origX = origX;
                    el.dataset.origY = origY;
                    el.dataset.origW = origW;
                    el.dataset.origH = origH;
                    el.dataset.geometryAdjusted = "true";

                    el.setAttribute('x', origX + 1);
                    el.setAttribute('y', origY + 1);
                    el.setAttribute('width', origW - 2);
                    el.setAttribute('height', origH - 2);
                }
                el.setAttribute('stroke', '#00babc');
                el.setAttribute('stroke-width', '2');
            } else {
                if (el.dataset.geometryAdjusted) {
                    el.setAttribute('x', el.dataset.origX);
                    el.setAttribute('y', el.dataset.origY);
                    el.setAttribute('width', el.dataset.origW);
                    el.setAttribute('height', el.dataset.origH);
                    delete el.dataset.geometryAdjusted;
                }
                el.removeAttribute('stroke');
                el.removeAttribute('stroke-width');
            }
        } else {
            if (isSelected) {
                el.classList.add('logtime-selected-node');
            } else {
                el.classList.remove('logtime-selected-node');
            }
        }
    });
}

function calculateLogtime() {
    const V3_MAX_MINUTES = 1441.0; 
    
    injectHoverStyles();

    // ==========================================
    // DATA HYDRATION SAFETY CHECK
    // ==========================================
    const v3Tables = document.querySelectorAll('table.table-fixed');
    const v2Svg = document.getElementById('user-locations');

    if (v3Tables.length > 0) {
        let hasColoredNode = false;
        for (let table of v3Tables) {
            const divs = table.querySelectorAll('tbody td div');
            for (let div of divs) {
                const bg = div.style.backgroundColor;
                if (bg && bg !== 'none' && bg !== 'rgba(0, 186, 188, 0)' && bg !== 'rgba(0, 0, 0, 0)') {
                    hasColoredNode = true;
                    break;
                }
            }
            if (hasColoredNode) break;
        }
        if (!hasColoredNode) return; // Silent execution gate block
    } else if (v2Svg) {
        const targetGroup = v2Svg.querySelector('g[data-toggle="tooltip"]');
        if (targetGroup) {
            const rect = targetGroup.querySelector('rect');
            let textValue = targetGroup.getAttribute('data-original-title') || (rect ? rect.getAttribute('title') : '') || '';
            const titleNode = targetGroup.querySelector('title');
            if (titleNode) textValue += ' ' + titleNode.textContent;
            
            if (!textValue || (!textValue.includes('h') && !textValue.match(/\d{4}-\d{2}-\d{2}/))) return; // Silent execution gate block
        } else {
            return;
        }
    }

    let globalChronoIndex = 0;
    const nextTimeline = [];

    // ==========================================
    // LAYER A: INTRA V3 CONTROLLER (Tables)
    // ==========================================
    if (v3Tables.length > 0) {
        const firstTable = v3Tables[0];
        const rootLogtimeCard = firstTable.closest('.bg-white');
        if (rootLogtimeCard) {
            const headerRow = rootLogtimeCard.querySelector('.flex-col.gap-1.md\\:flex-row, .justify-between');
            if (headerRow) {
                injectOnPageIndicator(headerRow, false);
            }
        }

        v3Tables.forEach(table => {
            const headerElement = table.querySelector('th');
            if (!headerElement) return;

            let monthName = headerElement.dataset.rawMonthName;
            if (!monthName) {
                const rawText = headerElement.textContent.trim();
                monthName = rawText.split(/[-((\s]/)[0]; 
                headerElement.dataset.rawMonthName = monthName;
            }

            const rawText = headerElement.textContent.trim();
            const yearMatch = rawText.match(/\d{4}/);
            const displayYear = yearMatch ? parseInt(yearMatch[0], 10) : new Date().getFullYear();

            const dayCells = table.querySelectorAll('tbody td div');
            let totalMinutes = 0;

            dayCells.forEach(cell => {
                const dayNum = parseInt(cell.textContent.trim(), 10);
                if (isNaN(dayNum)) return;

                const bgStyle = cell.style.backgroundColor;
                let dayMinutes = 0;

                if (bgStyle && bgStyle !== 'none') {
                    const rgbaMatch = bgStyle.match(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/) || 
                                      bgStyle.match(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/);
                    if (rgbaMatch && rgbaMatch[1]) {
                        const alpha = parseFloat(rgbaMatch[1]);
                        if (alpha > 0) {
                            dayMinutes = alpha * V3_MAX_MINUTES;
                            totalMinutes += dayMinutes;
                        }
                    }
                }

                const constructedDate = new Date(displayYear, parseMonthToIndex(monthName), dayNum, 12, 0, 0);
                const visualDateStr = constructedDate.toISOString().split('T')[0];
                
                cell.dataset.chronoIndex = globalChronoIndex;
                nextTimeline.push({ dateStr: visualDateStr, mins: dayMinutes });
                globalChronoIndex++;

                if (!cell.dataset.hasLogtimeEvents) {
                    cell.dataset.hasLogtimeEvents = "true";
                    
                    cell.addEventListener('mousedown', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        document.body.classList.add('logtime-dragging-state');
                        selectionStartIndex = parseInt(cell.dataset.chronoIndex, 10);
                        selectionEndIndex = selectionStartIndex;
                        isDragging = true;
                        updateSelectionUI();
                        refreshVisualHighlights();
                    });
                    cell.addEventListener('mouseenter', (e) => {
                        if (isDragging) {
                            selectionEndIndex = parseInt(cell.dataset.chronoIndex, 10);
                            updateSelectionUI();
                            refreshVisualHighlights();
                        }
                    });
                }
            });

            const hours = Math.floor(totalMinutes / 60);
            const minutes = Math.round(totalMinutes % 60);
            
            headerElement.innerText = `${monthName} (~${hours}h ${minutes}m)`;
        });
    }

    // ==========================================
    // LAYER B: INTRA V2 CONTROLLER (SVG Graphic)
    // ==========================================
    if (v2Svg) {
        const v2ParentContainer = v2Svg.parentElement;
        if (v2ParentContainer && !document.getElementById('intra-logtime-indicator')) {
            injectOnPageIndicator(v2ParentContainer, true);
        }

        const monthlyMinutes = {};
        const headerXCoordinates = [];
        const monthRectXBounds = {};

        const textElements = v2Svg.querySelectorAll('text');
        textElements.forEach(textEl => {
            const rawLabelText = textEl.textContent.trim();
            if (["Mon", "Wed", "Fri", "Sun", "Sat", "Tue", "Thu"].includes(rawLabelText)) return;
            
            if (!textEl.dataset.rawMonthName) {
                const parts = rawLabelText.split(/[-((\s]/);
                const extractedMonth = parts[0];
                if (extractedMonth.match(/^[A-Za-z]{3}$/)) {
                    textEl.dataset.rawMonthName = extractedMonth;
                } else {
                    return;
                }
            }

            const cleanMonthName = textEl.dataset.rawMonthName;

            if (!textEl.dataset.originalXCoordinate) {
                textEl.dataset.originalXCoordinate = textEl.getAttribute('x') || '0';
            }
            const cachedX = parseInt(textEl.dataset.originalXCoordinate, 10);
            if (cachedX > 0) {
                headerXCoordinates.push({ node: textEl, name: cleanMonthName, originalX: cachedX });
                if (!(cleanMonthName in monthlyMinutes)) {
                    monthlyMinutes[cleanMonthName] = 0;
                    monthRectXBounds[cleanMonthName] = { min: Infinity, max: -Infinity };
                }
            }
        });

        const gridGroups = Array.from(v2Svg.querySelectorAll('g[data-toggle="tooltip"]'));
        
        let anchorIdx = -1;
        let anchorDate = null;

        for (let i = 0; i < gridGroups.length; i++) {
            const group = gridGroups[i];
            const rect = group.querySelector('rect');
            let tooltip = group.getAttribute('data-original-title') || (rect ? rect.getAttribute('title') : '') || '';
            const titleNode = group.querySelector('title');
            if (titleNode) tooltip += ' ' + titleNode.textContent;

            const match = tooltip.match(/(\d{4}-\d{2}-\d{2})/);
            if (match) {
                anchorIdx = i;
                anchorDate = new Date(match[1] + "T12:00:00");
                break; 
            }
        }

        if (anchorIdx === -1 && gridGroups.length > 0) {
            anchorIdx = gridGroups.length - 1;
            anchorDate = new Date();
        }

        gridGroups.forEach((group, idx) => {
            const rect = group.querySelector('rect');
            if (!rect) return;

            const rectX = parseInt(rect.getAttribute('x') || '0', 10);
            const rectW = parseInt(rect.getAttribute('width') || '18', 10);
            const bgStyle = rect.getAttribute('fill') || '';
            
            let tooltipTitle = group.getAttribute('data-original-title') || rect.getAttribute('title') || '';
            const titleNode = group.querySelector('title');
            if (titleNode) tooltipTitle += ' ' + titleNode.textContent;

            let dayMinutes = 0;
            
            const timeMatch = tooltipTitle.match(/(\d+)\s*[hH]\s*(\d*)/);
            
            if (timeMatch) {
                const h = parseInt(timeMatch[1], 10) || 0;
                const m = parseInt(timeMatch[2], 10) || 0;
                dayMinutes = (h * 60) + m;
            } 
            else if (bgStyle.startsWith('rgba')) {
                const rgbaMatch = bgStyle.match(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/);
                if (rgbaMatch && rgbaMatch[1]) {
                    const alpha = parseFloat(rgbaMatch[1]);
                    if (alpha > 0) {
                        dayMinutes = (alpha * 1420.0) + 12; 
                    }
                }
            }

            let assignedMonth = null;
            let minDistance = Infinity;
            headerXCoordinates.forEach(header => {
                const distance = Math.abs(rectX - header.originalX);
                if (distance < minDistance) {
                    minDistance = distance;
                    assignedMonth = header.name;
                }
            });

            if (assignedMonth && minDistance < 75) {
                monthlyMinutes[assignedMonth] += dayMinutes;
                
                if (rectX < monthRectXBounds[assignedMonth].min) monthRectXBounds[assignedMonth].min = rectX;
                if ((rectX + rectW) > monthRectXBounds[assignedMonth].max) monthRectXBounds[assignedMonth].max = rectX + rectW;
            }

            let displayDateStr = 'Unknown';
            if (anchorDate) {
                const exactDate = new Date(anchorDate);
                exactDate.setDate(exactDate.getDate() + (idx - anchorIdx));
                displayDateStr = exactDate.toISOString().split('T')[0];
            }

            rect.dataset.chronoIndex = globalChronoIndex;
            nextTimeline.push({ dateStr: displayDateStr, mins: dayMinutes });
            globalChronoIndex++;

            if (!rect.dataset.hasLogtimeEvents) {
                rect.dataset.hasLogtimeEvents = "true";

                rect.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    document.body.classList.add('logtime-dragging-state');
                    selectionStartIndex = parseInt(rect.dataset.chronoIndex, 10);
                    selectionEndIndex = selectionStartIndex;
                    isDragging = true;
                    updateSelectionUI();
                    refreshVisualHighlights();
                });
                rect.addEventListener('mouseenter', (e) => {
                    if (isDragging) {
                        e.stopPropagation();
                        selectionEndIndex = parseInt(rect.dataset.chronoIndex, 10);
                        updateSelectionUI();
                        refreshVisualHighlights();
                    }
                });
            }
        });

        headerXCoordinates.forEach(header => {
            const cleanMonthName = header.name;
            const textEl = header.node;
            
            if (monthlyMinutes.hasOwnProperty(cleanMonthName)) {
                const totalMinutesForMonth = monthlyMinutes[cleanMonthName];
                const hours = Math.floor(totalMinutesForMonth / 60);
                const minutes = Math.round(totalMinutesForMonth % 60);
                
                const targetedTextString = `${cleanMonthName} (~${hours}h ${minutes}m)`;
                
                const bounds = monthRectXBounds[cleanMonthName];
                if (bounds && bounds.min !== Infinity && bounds.max !== -Infinity) {
                    const blockCenter = bounds.min + ((bounds.max - bounds.min) / 2);
                    const approxTextLength = targetedTextString.length * 5.4; 
                    const correctedX = Math.round(blockCenter - (approxTextLength / 2));
                    
                    textEl.textContent = targetedTextString;
                    textEl.setAttribute('x', correctedX);
                }
            }
        });
    }

    window.calendarTimeline = nextTimeline;
    refreshVisualHighlights();
}

window.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        document.body.classList.remove('logtime-dragging-state');
        if (selectionStartIndex !== null && selectionEndIndex === null) {
            selectionEndIndex = selectionStartIndex;
        }
        updateSelectionUI();
        refreshVisualHighlights();
    }
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('table.table-fixed tbody td div') && 
        !e.target.closest('#user-locations g[data-toggle="tooltip"] rect') &&
        !e.target.closest('#logtime-range-badge') &&
        !e.target.closest('#intra-logtime-indicator')) {
        selectionStartIndex = null;
        selectionEndIndex = null;
        updateSelectionUI();
        refreshVisualHighlights();
    }
});

calculateLogtime();
setInterval(calculateLogtime, 2000);