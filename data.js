// v3 Campus Data structure with explicit demo nodes
const CAMPUS_DATA = {
    buildings: {
        "IT_BLOCK": {
            floors: [
                { id: "G", label: "Ground Floor", img: "mock-g.svg", width: 1000, height: 800 },
                { id: "1", label: "First Floor", img: "mock-1.svg", width: 1000, height: 800 },
                { id: "2", label: "Second Floor", img: "mock-2.svg", width: 1000, height: 800 }
            ],
            nodes: [
                // Ground Floor (Updated with User Requested Demo Data)
                { id: "gate_1", name: "Main Entrance", floor: "G", x: 500, y: 750, type: "entrance" },
                { id: "it_lab_1", name: "IT Lab 101", floor: "G", x: 300, y: 450, type: "lab" },
                { id: "staircase_1_g", name: "Main Stairs", floor: "G", x: 500, y: 380, type: "stairs" },
                
                { id: "g_c1", name: "Lobby Center", floor: "G", x: 500, y: 600, type: "corridor" },
                { id: "g_c2", name: "West Corridor G", floor: "G", x: 300, y: 600, type: "corridor" },
                { id: "g_c3", name: "East Corridor G", floor: "G", x: 700, y: 600, type: "corridor" },
                { id: "g_r1", name: "Admin Office", floor: "G", x: 225, y: 550, type: "office" },
                { id: "g_r2", name: "Cafeteria", floor: "G", x: 775, y: 550, type: "utility" },
                { id: "g_s2", name: "East Stairs", floor: "G", x: 875, y: 600, type: "stairs" },
                
                // G Floor Environmental Greebles
                { id: "env_g_w1", name: "Wi-Fi Hub", floor: "G", x: 400, y: 700, type: "wifi" },
                { id: "env_g_w2", name: "Water Cooler", floor: "G", x: 600, y: 550, type: "water" },
                { id: "env_g_f1", name: "Fire Ext.", floor: "G", x: 250, y: 600, type: "fire" },
                { id: "env_g_r1", name: "Restroom", floor: "G", x: 800, y: 650, type: "restroom" },
                
                // 1st Floor (Updated with User Requested Demo Data)
                { id: "staircase_1_1", name: "Main Stairs", floor: "1", x: 500, y: 380, type: "stairs" },
                { id: "library_1", name: "Central Library", floor: "1", x: 800, y: 500, type: "office" },

                { id: "f1_s2", name: "East Stairs", floor: "1", x: 875, y: 600, type: "stairs" },
                { id: "f1_c1", name: "Center Hall 1", floor: "1", x: 500, y: 600, type: "corridor" },
                { id: "f1_c2", name: "West Corridor 1", floor: "1", x: 300, y: 600, type: "corridor" },
                { id: "f1_c3", name: "East Corridor 1", floor: "1", x: 700, y: 600, type: "corridor" },
                { id: "f1_l1", name: "Lab 101", floor: "1", x: 200, y: 500, type: "lab" },
                { id: "f1_l2", name: "Lab 102", floor: "1", x: 200, y: 700, type: "lab" },
                { id: "f1_cr1", name: "Servers", floor: "1", x: 500, y: 725, type: "utility" },

                // 1st Floor Environmental Greebles
                { id: "env_1_w1", name: "Wi-Fi Hub", floor: "1", x: 450, y: 650, type: "wifi" },
                { id: "env_1_r1", name: "Restroom", floor: "1", x: 800, y: 650, type: "restroom" },

                // 2nd Floor
                { id: "f2_s1", name: "Main Stairs", floor: "2", x: 500, y: 380, type: "stairs" },
                { id: "f2_s2", name: "East Stairs", floor: "2", x: 875, y: 600, type: "stairs" },
                { id: "f2_c1", name: "Center Hall 2", floor: "2", x: 500, y: 600, type: "corridor" },
                { id: "f2_c2", name: "West Corridor 2", floor: "2", x: 300, y: 600, type: "corridor" },
                { id: "f2_l1", name: "Lab 201", floor: "2", x: 200, y: 500, type: "lab" },
                { id: "f2_l2", name: "Lab 202", floor: "2", x: 200, y: 700, type: "lab" },
                { id: "f2_l3", name: "Conference RM", floor: "2", x: 500, y: 725, type: "office" },
            ],
            links: [
                // G Floor connections
                ["gate_1", "g_c1"],
                ["g_c1", "g_c2"],
                ["g_c1", "g_c3"],
                ["g_c1", "staircase_1_g"],
                ["g_c2", "g_r1"],
                ["g_r1", "it_lab_1"], // Connect IT Lab 101 to Admin Office area
                ["g_c3", "g_r2"],
                ["g_c3", "g_s2"],

                // 1st Floor connections
                ["staircase_1_1", "f1_c1"],
                ["f1_c1", "f1_c2"],
                ["f1_c1", "f1_c3"],
                ["f1_c1", "f1_cr1"],
                ["f1_c2", "f1_l1"],
                ["f1_c2", "f1_l2"],
                ["f1_c3", "library_1"], // Connect Central Library
                ["f1_c3", "f1_s2"],

                // 2nd Floor connections
                ["f2_s1", "f2_c1"],
                ["f2_c1", "f2_c2"],
                ["f2_c1", "f2_l3"],
                ["f2_c2", "f2_l1"],
                ["f2_c2", "f2_l2"],
                ["f2_c1", "f2_s2"],

                // Vertical connections (Stairs) 
                ["staircase_1_g", "staircase_1_1"],
                ["staircase_1_1", "f2_s1"],
                ["g_s2", "f1_s2"],
                ["f1_s2", "f2_s2"],
            ]
        }
    }
};

// Auto-generate Adjacency List with Euclidean Distances for Dijkstra
const GraphData = {};

function initGraphData(buildingId) {
    const building = CAMPUS_DATA.buildings[buildingId];
    if(!building) return;

    // Initialize objects
    building.nodes.forEach(n => {
        GraphData[n.id] = {};
    });

    // Helper: Euclidean distance
    const calcDistance = (nodeAId, nodeBId) => {
        const a = building.nodes.find(n => n.id === nodeAId);
        const b = building.nodes.find(n => n.id === nodeBId);
        
        if (!a || !b) return Infinity;
        
        // Heavy penalty for stairs to simulate time taken
        if (a.floor !== b.floor) return 300; 

        return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
    };

    // Populate edges
    building.links.forEach(([fromId, toId]) => {
        if(GraphData[fromId] && GraphData[toId]) {
            const dist = calcDistance(fromId, toId);
            GraphData[fromId][toId] = dist;
            GraphData[toId][fromId] = dist;
        }
    });
}
