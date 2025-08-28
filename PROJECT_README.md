# Quantum-Inspired Smart Routing Web App

A production-grade web application for optimizing delivery routes using quantum-inspired algorithms with modern 3D visualizations.

## 🚀 Features

- **2-Pane Dashboard**: Smart Routing Panel + Interactive Dashboard
- **Multiple Algorithms**: Classical, Simulated Quantum Annealing (SQA), Quantum-Inspired Evolutionary Algorithm (QI-EA), QAOA-Inspired Heuristic
- **3D Visualizations**: Animated route tubes, vehicle avatars, and interactive 3D previews
- **Real-time Optimization**: Live route calculation and comparison
- **Responsive Design**: Mobile-friendly interface
- **Dark/Light Theme**: Automatic theme switching

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Three Fiber** for 3D graphics
- **React Leaflet** for 2D maps
- **Recharts** for data visualization
- **Zustand** for state management

### Backend
- **FastAPI** (Python) for REST API
- **Quantum-inspired algorithms** for route optimization
- **Async/await** for performance
- **CORS** enabled for frontend integration

## 📦 Installation

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (3.8 or higher)
- **npm** or **yarn**

### Frontend Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`

### Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create a Python virtual environment**:
   ```bash
   python -m venv venv
   
   # On Windows:
   venv\Scripts\activate
   
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the backend server**:
   ```bash
   python main.py
   ```

   The API will be available at `http://localhost:8000`

## 🎯 Usage

### Adding Locations
1. Use the **Smart Routing Panel** to add delivery locations
2. Enter addresses or coordinates directly
3. Drag and drop to reorder stops

### Setting Constraints
1. Choose optimization goal (Time vs Distance)
2. Adjust vehicle capacity using the slider
3. Set maximum travel time constraints
4. Select your preferred algorithm

### Route Optimization
1. Click **"Optimize"** to run a single algorithm
2. Click **"Compare Algorithms"** to run all algorithms
3. View results in the **Interactive Dashboard**

### 3D Visualization
- Watch animated route flows in the 3D preview
- See vehicle avatars travel along optimized paths
- Interactive markers show delivery stops

## 🔧 Development Scripts

```bash
# Frontend development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Backend development
cd backend
python main.py       # Start development server
```

## 📊 Algorithm Details

### Classical (Greedy + 2-OPT)
- Fast nearest neighbor construction
- 2-OPT local search improvement
- Best for small to medium problems

### Simulated Quantum Annealing (SQA)
- Temperature-based acceptance probability
- Quantum-inspired tunneling effects
- Excellent for escaping local optima

### Quantum-Inspired Evolutionary Algorithm (QI-EA)
- Population-based optimization
- Quantum-inspired crossover operators
- Balance of exploration and exploitation

### QAOA-Inspired Heuristic
- Variational quantum algorithm principles
- Parameterized optimization approach
- Best performance for complex problems

## 🌐 API Documentation

The backend provides a complete REST API. When running, visit `http://localhost:8000/docs` for interactive API documentation.

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy the 'dist' folder
```

### Backend (Docker)
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY backend/ .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

**Built with ❤️ for the future of logistics optimization**
