# 📍 QuickRoute: AI-Powered Indoor Navigation
**Smart Campus Navigation for Mumbai University**

[![Live Demo](https://img.shields.io/badge/Demo-Live%20Link-brightgreen?style=for-the-badge)](https://ani-hacks.github.io/QuickRoute-Campus-Nav/?start=gate_1)
[![GitHub License](https://img.shields.io/github/license/ani-hacks/QuickRoute-Campus-Nav?style=flat-square)](https://github.com/ani-hacks/QuickRoute-Campus-Nav/blob/main/LICENSE)

## 📖 Overview
**QuickRoute** is a lightweight, mobile-first indoor navigation system designed to eliminate the frustration of finding labs, seminar halls, and offices in large university buildings. 

Unlike traditional GPS, which fails indoors, QuickRoute utilizes **QR-based entry points** and a custom **coordinate-mapped pathfinding engine** to guide users through complex building layouts with an ultra-modern, "AI Command Center" interface.

---

## 🚀 Key Features
* **Zero-Install Access:** Users scan a QR code at any building entrance to initialize their location instantly via URL parameters.
* **A* Pathfinding Engine:** Implements a custom shortest-path algorithm to calculate the most efficient route between rooms and floors.
* **Dynamic HUD Interface:** A cinematic, dark-mode UI featuring glassmorphism, glowing neon paths, and real-time navigation logs.
* **Multi-Floor Logic:** Seamlessly handles transitions between floors (Ground, 1st, 2nd) with an integrated floor-switcher.
* **Recruiter Mode:** Built-in "Manual Override" allows users to test the app's functionality even when not physically on campus.

---

## 🛠️ Tech Stack
* **Frontend:** Vanilla ES6+ JavaScript, HTML5, CSS3 (Custom Glassmorphism & Animations)
* **Maps Engine:** [Leaflet.js](https://leafletjs.com/) (Utilizing `L.CRS.Simple` for architectural blueprints)
* **Logic:** Custom Dijkstra/A* Pathfinding Algorithm
* **Deployment:** GitHub Pages

---

## 🗺️ How it Works (Technical Architecture)

1.  **QR Initialization:** A QR code at the entrance points to `?start=gate_1`. The app parses this ID to set the user's initial (x, y) coordinates.
2.  **Node Mapping:** The building is mapped into a JSON-based graph of "Nodes" (rooms/intersections) and "Edges" (hallways).
3.  **Path Rendering:** When a target is searched, the engine calculates the shortest path and renders a high-visibility SVG neon polyline across the blueprint.



---

## 🛠️ Installation & Local Setup
1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/ani-hacks/QuickRoute-Campus-Nav.git](https://github.com/ani-hacks/QuickRoute-Campus-Nav.git)
    ```
2.  **Open locally:**
    Simply open `index.html` in any modern web browser.
3.  **Simulate QR Scan:**
    Add `?start=gate_1` to the end of your local URL (e.g., `http://127.0.0.1:5500/index.html?start=gate_1`).

---

## 🚧 Future Roadmap
- [ ] **Voice Commands:** Integration of Web Speech API for hands-free searching.
- [ ] **Crowd Density:** Real-time indicator for busy lab areas.
- [ ] **AR Integration:** Using device sensors to overlay directional arrows on a live camera feed.

---

## 👤 Author
**Aniruddha Yadav** *Computer Engineering Student @ Mumbai University* [GitHub](https://github.com/ani-hacks) | [LinkedIn](https://www.linkedin.com/in/YOUR_LINKEDIN_USERNAME)

---

> **Note:** This project was developed as a simple problem-solving utility for daily campus life, focusing on reducing friction in indoor navigation.
