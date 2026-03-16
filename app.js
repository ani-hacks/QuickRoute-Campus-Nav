// QuickRoute Application Logic (v2)

// Configuration & Context
const getContext = () => {
    const params = new URLSearchParams(window.location.search);
    const startNode = params.get('start');
    const building = params.get('building') || "IT_BLOCK"; // Default building context for demo
    
    return {
        building: building,
        startNodeId: startNode, 
    };
};

const Context = getContext();

// State variables
let currentFloor = null;
let startNodeId = Context.startNodeId;
let destinationNodeId = null;

// Leaflet Map State
let map;
let imageOverlay;
let pathLayer;
let markersLayer;
let userMarkerLayer;

// Initialization
function initApp() {
    // 1. Build Graph from CAMPUS_DATA
    initGraphData(Context.building);
    
    // UI Binding: Manual Override
    const manualBtn = document.getElementById('manual-entry-btn');
    const manualSelect = document.getElementById('manual-location-select');
    if(manualBtn && manualSelect) {
        manualBtn.addEventListener('click', () => {
            if(manualSelect.value) {
                startNodeId = manualSelect.value;
                document.getElementById('qr-overlay').classList.add('hidden');
                document.getElementById('recenter-btn').classList.remove('hidden');
                
                // Initialize map using updated starting point
                const bldg = CAMPUS_DATA.buildings[Context.building];
                const initialFloor = bldg.nodes.find(n => n.id === startNodeId)?.floor;
                if(initialFloor) {
                    currentFloor = initialFloor;
                    if(!map) initMap(); 
                }
            }
        });
    }

    // UI Binding: Sidebar Toggle
    const dirToggle = document.getElementById('directory-toggle');
    const dirSidebar = document.getElementById('directory-sidebar');
    const dirClose = document.getElementById('close-directory');
    if(dirToggle && dirSidebar && dirClose) {
        dirToggle.addEventListener('click', () => dirSidebar.classList.remove('closed'));
        dirClose.addEventListener('click', () => dirSidebar.classList.add('closed'));
        populateDirectory();
    }
    
    // 2. Init UI based on QR entry state
    const qrOverlay = document.getElementById('qr-overlay');
    if (!startNodeId) {
        qrOverlay.classList.remove('hidden');
        // We cannot initialize map without knowing floor, halt.
        console.warn("Awaiting QR Code Scan...");
        return;
    } else {
        qrOverlay.classList.add('hidden');
        document.getElementById('recenter-btn').classList.remove('hidden');
    }
    
    // Determine initial floor based on startNode
    const buildingData = CAMPUS_DATA.buildings[Context.building];
    const initialNode = buildingData.nodes.find(n => n.id === startNodeId);
    if(initialNode) {
        currentFloor = initialNode.floor;
        initMap();
    } else {
        console.error("Invalid start node ID.");
    }
}


function initMap() {
    map = L.map('map', {
        crs: L.CRS.Simple, 
        minZoom: -1.5,
        maxZoom: 2,
        zoomControl: true,
        attributionControl: false,
        zoomSnap: 0.1
    });

    map.zoomControl.setPosition('topright');

    document.querySelectorAll('.floor-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const floorId = e.target.dataset.floor;
            if(floorId !== currentFloor) {
                changeFloor(floorId);
            }
        });
    });
    
    document.getElementById('recenter-btn').addEventListener('click', () => {
        const buildingData = CAMPUS_DATA.buildings[Context.building];
        const startNode = buildingData.nodes.find(n => n.id === startNodeId);
        if(startNode) {
             if(currentFloor !== startNode.floor) {
                 changeFloor(startNode.floor);
             }
             map.flyTo(getLatLng(startNode.x, startNode.y), -0.5, { duration: 1.5 });
        }
    });

    changeFloor(currentFloor);
    setupSearch();
    
    document.addEventListener('keydown', (e) => {
        if(e.key === 'Escape') stopNavigation();
    });
}

document.addEventListener('DOMContentLoaded', initApp);

// Render Floor
function changeFloor(floorId) {
    currentFloor = floorId;
    
    if (imageOverlay) map.removeLayer(imageOverlay);
    if (markersLayer) map.removeLayer(markersLayer);
    if (userMarkerLayer) map.removeLayer(userMarkerLayer);
    if (pathLayer) map.removeLayer(pathLayer);
    
    const floorInfo = CAMPUS_DATA.buildings[Context.building].floors.find(f => f.id === floorId);
    if (!floorInfo) return;

    const h = floorInfo.height;
    const w = floorInfo.width;
    const bounds = [[0,0], [h, w]];
    
    imageOverlay = L.imageOverlay(floorInfo.img, bounds, {
        interactive: true
    }).addTo(map);

    map.fitBounds(bounds);
    
    if(window.innerWidth < 600) {
        map.setZoom(-1.2);
    }
    
    document.getElementById('building-info').innerText = `IT BLOCK - FLOOR ${floorId}`;
    
    document.querySelectorAll('.floor-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.floor === floorId) {
            btn.classList.add('active');
        }
    });

    renderFloorItems();
    
    if (destinationNodeId) calculateAndDrawRoute();
}

function getLatLng(x, y) {
    const floorInfo = CAMPUS_DATA.buildings[Context.building].floors.find(f => f.id === currentFloor);
    return [floorInfo.height - y, x]; 
}

function renderFloorItems() {
    markersLayer = L.layerGroup().addTo(map);
    userMarkerLayer = L.layerGroup().addTo(map);
    pathLayer = L.layerGroup().addTo(map);
    
    // Add V4 Map Scanner Line
    if(!document.querySelector('.map-scanner-line')) {
        const scanner = document.createElement('div');
        scanner.className = 'map-scanner-line';
        document.getElementById('map').appendChild(scanner);
    }

    const bldg = CAMPUS_DATA.buildings[Context.building];
    const nodes = bldg.nodes.filter(n => n.floor === currentFloor);
    
    const startNode = bldg.nodes.find(n => n.id === startNodeId);
    if (startNode && startNode.floor === currentFloor) {
        const userIcon = L.divIcon({
            className: 'user-location-marker',
            html: `<div class="pulse-dot"></div><div class="you-are-here-label">You Are Here</div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });
        L.marker(getLatLng(startNode.x, startNode.y), { icon: userIcon, zIndexOffset: 1000 }).addTo(userMarkerLayer);
    }
    
    const destNode = bldg.nodes.find(n => n.id === destinationNodeId);
    if (destNode && destNode.floor === currentFloor) {
        const destIcon = L.divIcon({
            className: 'destination-marker',
            html: `<div class="dest-pin"></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 24]
        });
        L.marker(getLatLng(destNode.x, destNode.y), { icon: destIcon, zIndexOffset: 900 }).addTo(markersLayer);
    }

    nodes.forEach(node => {
        if (['lab', 'office', 'utility', 'stairs'].includes(node.type)) {
             
             // V4 Cyberpunk Micro-Data Labels
             let labelHtml = '';
             if (node.type === 'lab') labelHtml = '<div class="micro-data-label status-idle">00</div>';
             if (node.type === 'office') labelHtml = '<div class="micro-data-label status-active">00</div>';

             const nodeIcon = L.divIcon({
                className: 'interactive-node',
                html: `<div class="node-marker" data-id="${node.id}">${labelHtml}</div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
             });
             
             const marker = L.marker(getLatLng(node.x, node.y), { icon: nodeIcon })
                .bindTooltip(node.name, { className: 'custom-tooltip', direction: 'top', offset: [0, -10] })
                .addTo(markersLayer);
                
             marker.on('click', () => {
                 startNavigation(node.id);
             });
        } else if (['wifi', 'water', 'fire', 'restroom'].includes(node.type)) {
             // V5 Environmental Greebles
             let iconContent = '';
             if(node.type === 'wifi') iconContent = '📶';
             if(node.type === 'water') iconContent = '💧';
             if(node.type === 'fire') iconContent = '🧯';
             if(node.type === 'restroom') iconContent = '🚻';

             const envIcon = L.divIcon({
                className: 'env-node-marker',
                html: `<div class="env-icon" title="${node.name}">${iconContent}</div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
             });
             
             L.marker(getLatLng(node.x, node.y), { icon: envIcon, interactive: false }).addTo(markersLayer);
        }
    });
}

// ==========================================
// Routing (Dijkstra)
// ==========================================
function findShortestPath(startId, endId) {
    const distances = {};
    const previous = {};
    const queue = new Set(Object.keys(GraphData));

    queue.forEach(node => distances[node] = Infinity);
    distances[startId] = 0;

    while (queue.size > 0) {
        let minNode = null;
        queue.forEach(node => {
            if (minNode === null || distances[node] < distances[minNode]) {
                minNode = node;
            }
        });

        if (distances[minNode] === Infinity || minNode === endId) break;

        queue.delete(minNode);

        for (let neighbor in GraphData[minNode]) {
            let alt = distances[minNode] + GraphData[minNode][neighbor];
            if (alt < distances[neighbor]) {
                distances[neighbor] = alt;
                previous[neighbor] = minNode;
            }
        }
    }

    if (distances[endId] === Infinity) return { path: [], distance: 0 };

    const path = [];
    let curr = endId;
    while (curr) {
        path.unshift(curr);
        curr = previous[curr];
    }
    
    return { path, distance: distances[endId] };
}

function calculateAndDrawRoute() {
    if (!startNodeId || !destinationNodeId) return;
    
    pathLayer.clearLayers();
    
    const { path, distance } = findShortestPath(startNodeId, destinationNodeId);
    if (path.length === 0) return;
    
    const fullNodeList = CAMPUS_DATA.buildings[Context.building].nodes;
    let currentPolyline = [];
    let isCrossFloorRoute = false;
    let stairNodeName = "";
    
    for (let i = 0; i < path.length; i++) {
        const nodeId = path[i];
        const nodeObj = fullNodeList.find(n => n.id === nodeId);
        
        if (nodeObj.floor === currentFloor) {
            currentPolyline.push(getLatLng(nodeObj.x, nodeObj.y));
            
            // If we are looking at a line approaching stairs due to a cross floor route...
            if(nodeObj.type === "stairs" && i < path.length - 1) {
                const nextNodeObj = fullNodeList.find(n => n.id === path[i+1]);
                if (nextNodeObj.floor !== currentFloor) {
                     isCrossFloorRoute = true;
                     stairNodeName = nodeObj.name;
                     // Draw an indicator arrow at the stair
                     const stairIcon = L.divIcon({
                        className: 'stair-transition-marker',
                        html: `<div style="background:var(--secondary-purple); color:white; padding:4px 8px; border-radius:12px; font-size:10px; border:1px solid white;">GO TO FLOOR ${nextNodeObj.floor}</div>`,
                        iconSize: [100, 20],
                        iconAnchor: [50, 30]
                     });
                     L.marker(getLatLng(nodeObj.x, nodeObj.y), { icon: stairIcon, zIndexOffset: 800 }).addTo(pathLayer);
                }
            } else if (nodeObj.type === "stairs" && i > 0) {
                 // Or coming DOWN from stairs
                 const prevNodeObj = fullNodeList.find(n => n.id === path[i-1]);
                 if(prevNodeObj.floor !== currentFloor) {
                      isCrossFloorRoute = true;
                      stairNodeName = nodeObj.name;
                 }
            }

        }
    }
    
    if (currentPolyline.length > 1) {
        // Glowing Background Line
        L.polyline(currentPolyline, {
            color: 'var(--primary-cyan)',
            weight: 8,
            opacity: 0.2,
            lineCap: 'round',
            lineJoin: 'round'
        }).addTo(pathLayer);
        
        // V4 High-Tech Neon Animated gradient dash
        L.polyline(currentPolyline, {
            color: '#fff',
            weight: 4,
            opacity: 1,
            className: 'neon-flow-route',
            lineCap: 'round',
            lineJoin: 'round'
        }).addTo(pathLayer);
    }

    // Dynamic style injection for path flow
    let style = document.getElementById('dash-flow-style');
    if(!style) {
        style = document.createElement('style');
        style.id = 'dash-flow-style';
        style.innerHTML = `
            .neon-flow-route {
                stroke-dasharray: 10, 15;
                animation: flow-route 1.2s linear infinite;
                filter: drop-shadow(0 0 5px var(--primary-cyan));
            }
            @keyframes flow-route {
                0% { stroke-dashoffset: 25; }
                100% { stroke-dashoffset: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    // Determine actual UI presentation
    const destObj = fullNodeList.find(n => n.id === destinationNodeId);
    let msgNode = document.getElementById('transition-msg');
    
    if (isCrossFloorRoute) {
        if(!msgNode) {
            msgNode = document.createElement('span');
            msgNode.id = 'transition-msg';
            msgNode.className = 'floor-transition-msg';
            document.querySelector('.route-header').appendChild(msgNode);
        }
        
        if (destObj.floor !== currentFloor) {
             msgNode.innerText = `Route via ${stairNodeName}. Please switch to Floor ${destObj.floor}.`;
        } else {
             msgNode.innerText = `You are on the destination floor.`;
        }
    } else if (msgNode) {
        msgNode.remove();
    }

    updateRoutePanel(destObj, distance);
}

// ==========================================
// UI Interactions
// ==========================================
function startNavigation(destId) {
    if(destId === startNodeId) {
        alert("You are already here.");
        return;
    }
    destinationNodeId = destId;
    renderFloorItems(); 
    calculateAndDrawRoute();
    
    document.getElementById('search-results').classList.add('hidden');
    document.getElementById('search-input').value = '';
    document.getElementById('search-input').blur();
}

function stopNavigation() {
    destinationNodeId = null;
    pathLayer.clearLayers();
    document.getElementById('route-panel').classList.add('hidden');
    renderFloorItems(); 
    
    // reset message
    const msg = document.getElementById('transition-msg');
    if(msg) msg.remove();

    const sn = CAMPUS_DATA.buildings[Context.building].nodes.find(n=>n.id===startNodeId);
    if(currentFloor !== sn.floor) changeFloor(sn.floor);
    map.flyTo(getLatLng(sn.x, sn.y), -0.5);
}

function updateRoutePanel(destObj, distancePixels) {
    const panel = document.getElementById('route-panel');
    document.getElementById('destination-name').innerText = destObj.name;
    document.getElementById('destination-type').innerText = destObj.type;
    
    const distanceMeters = Math.round(distancePixels * 0.2);
    document.getElementById('route-distance').innerText = `${distanceMeters} m`;
    
    const timeMins = Math.max(1, Math.round((distanceMeters / 1.3) / 60));
    document.getElementById('route-time').innerText = `${timeMins} min`;
    
    panel.classList.remove('hidden');
}

// Search Logic
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('search-results');
    const bldg = CAMPUS_DATA.buildings[Context.building];
    
    const searchableNodes = bldg.nodes.filter(n => ['lab', 'office', 'utility'].includes(n.type));

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        resultsContainer.innerHTML = '';
        
        if (query.length < 2) {
            resultsContainer.classList.add('hidden');
            return;
        }

        const matches = searchableNodes.filter(n => 
            n.name.toLowerCase().includes(query) || n.type.toLowerCase().includes(query)
        );

        if (matches.length > 0) {
            matches.slice(0, 5).forEach(match => { 
                const div = document.createElement('div');
                div.className = 'search-result-item';
                div.innerHTML = `
                    <span class="result-name">${match.name}</span>
                    <span class="result-floor">Floor ${match.floor}</span>
                `;
                div.onclick = () => {
                    if (currentFloor !== match.floor) {
                        changeFloor(match.floor);
                    }
                    startNavigation(match.id);
                    searchInput.value = match.name;
                };
                resultsContainer.appendChild(div);
            });
            resultsContainer.classList.remove('hidden');
        } else {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.innerHTML = `<span class="result-name" style="color:var(--text-muted)">No rooms found</span>`;
            resultsContainer.appendChild(div);
            resultsContainer.classList.remove('hidden');
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            resultsContainer.classList.add('hidden');
        }
    });
}

// Sidebar Directory Logic
function populateDirectory() {
    const content = document.getElementById('directory-content');
    if(!content) return;
    content.innerHTML = '';
    
    const bldg = CAMPUS_DATA.buildings[Context.building];
    
    // Group by floor
    bldg.floors.forEach(floor => {
        const floorNodes = bldg.nodes.filter(n => n.floor === floor.id && ['lab', 'office', 'utility'].includes(n.type));
        if(floorNodes.length === 0) return;
        
        const groupDiv = document.createElement('div');
        groupDiv.className = 'dir-floor-group';
        
        const titleDiv = document.createElement('div');
        titleDiv.className = 'dir-floor-title';
        titleDiv.innerText = floor.label || `Floor ${floor.id}`;
        groupDiv.appendChild(titleDiv);
        
        floorNodes.forEach(node => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'dir-item';
            itemDiv.innerHTML = `
                <span class="dir-item-name">${node.name}</span>
                <span class="dir-item-type">${node.type}</span>
            `;
            itemDiv.onclick = () => {
                document.getElementById('directory-sidebar').classList.add('closed');
                if (currentFloor !== node.floor) {
                    changeFloor(node.floor);
                }
                startNavigation(node.id);
            };
            groupDiv.appendChild(itemDiv);
        });
        
        content.appendChild(groupDiv);
    });
}
