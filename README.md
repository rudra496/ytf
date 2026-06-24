# RippleUp - Youth Sustainability Reward Journey 🍃

RippleUp is a gamified behavior-change platform designed to empower urban youth to build climate-friendly habits through physical-plus-digital interventions. This project was conceptualized by **Team #12** (led by Saara Vishnoi, with members Rudra Sarker, Jabir Tukur Bakiyawa, Samia Hossain, Nigel Hove, Catherine Waweru, SUCHITA SOMKUWAR, Priyamvada ., and Afsara Tasnim) to address the UNICEF-IUCN research findings that youth in Least Developed Countries have strong motivations to act but lack structured opportunities and micro-incentives.

👉 **Live Site:** [https://rudra496.github.io/ytf/](https://rudra496.github.io/ytf/)

---

## 🚀 Key Features

1. **Interactive App Simulator**: A fully functional mock mobile interface on the landing page that simulates:
   - **Action Logger**: Click buttons to simulate refilling water bottles, recycling, commuting green, and avoiding food waste.
   - **QR Code Scanner**: Simulate scanning physical QR stickers at water refill stations or partner grocery stalls.
   - **Live Counters**: Watch points count up, CO₂ savings update in real time, and streak fire animations change.
   - **Milestones**: Unlock Bronze, Silver, and Gold badges dynamically as actions accrue.
2. **Professional 3D Three.js Animation**:
   - An interactive 3D particle eco-globe representing green and golden sustainability nodes.
   - Supports mouse hover parallax tracking, drag/touch rotation, and scroll velocity acceleration.
3. **Interactive User Journey Storyboard**:
   - A step-by-step slider illustrating the full RippleUp MVP user flow (10 panels).
4. **Community Standings**:
   - Interactive leaderboard toggles to view team rankings (highlighting Team #12) and top individual contributors.
5. **Research & Stakeholder Insights**:
   - Outlines the problem statement, UNICEF-IUCN findings, and contains transcripts of stakeholder interviews (Ridwan, Tanvir) that guided the product design.

---

## 🛠️ Technology Stack

- **Core Structure**: HTML5 (Semantic elements)
- **Styling & Theme**: Vanilla CSS3
  - Dark mode theme utilizing custom HSL color systems.
  - Glassmorphism surfaces (`backdrop-filter: blur()`).
  - Keyframe animations (scans, pulses, droplets, custom counters).
- **Interactivity**: Vanilla JavaScript (ES6)
- **3D Engine**: Three.js (via CDN)
- **Icons**: FontAwesome v6 (via CDN)
- **Fonts**: Google Fonts (Outfit & Inter)

---

## 💻 Local Setup & Running

Since this is a client-side web application, running it locally is extremely simple and requires no dependencies.

1. Clone or navigate to the directory:
   ```bash
   cd ytf
   ```
2. Run a local static file server (to ensure Three.js modules/textures load correctly under CORS policies):
   * **Python 3**:
     ```bash
     python -m http.server 8000
     ```
   * **Node.js (`http-server`)**:
     ```bash
     npx http-server -p 8000
     ```
3. Open your browser and navigate to:
   [http://localhost:8000](http://localhost:8000)

---

## 🌐 Deployment to GitHub Pages

To deploy this project to GitHub Pages under the repository name `ytf`:

1. Initialize git and check out a `main` branch:
   ```bash
   git init
   git checkout -b main
   ```
2. Commit files:
   ```bash
   git add .
   git commit -m "Initial commit of RippleUp web platform"
   ```
3. Create the repository on GitHub using the GitHub CLI:
   ```bash
   gh repo create ytf --public --source=. --remote=origin --push
   ```
4. Configure GitHub Pages:
   - Go to your repository settings on GitHub.
   - Under "Pages", select deployment from the `main` branch (root folder) and save.
   - The site will be active shortly at `https://rudra496.github.io/ytf/`.

---

### 👥 Team #12 Core Members
- **Saara Vishnoi** (Welfare Designer)
- **Rudra Sarker** (Student | Founder | Project Developer | Tech Enthusiast)
- **Jabir Tukur Bakiyawa** (Student)
- **Samia Hossain** (Student)
- **Nigel Hove**
- **Catherine Waweru** (Student Sustainability)
- **SUCHITA SOMKUWAR** (Teacher)
- **Priyamvada .** (Student)
- **Afsara Tasnim** (Development Professional & Disaster Management Graduate)
