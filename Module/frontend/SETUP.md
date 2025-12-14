# Frontend Setup Guide

## Prerequisites

You need to install Node.js and npm first.

### Install Node.js

#### macOS (using Homebrew)
```bash
brew install node
```

#### macOS (using official installer)
1. Visit https://nodejs.org/
2. Download the LTS version
3. Run the installer

#### Linux (Ubuntu/Debian)
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Windows
1. Visit https://nodejs.org/
2. Download the LTS version installer
3. Run the installer

### Verify Installation
```bash
node --version
npm --version
```

You should see version numbers for both commands.

## Installation Steps

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open browser**
   Navigate to `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Troubleshooting

### Port 3000 already in use
If port 3000 is already in use, Vite will automatically use the next available port (3001, 3002, etc.)

### Module not found errors
Delete `node_modules` and `package-lock.json`, then run `npm install` again:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Permission errors (Linux/macOS)
Use `sudo` if needed, or fix npm permissions:
```bash
sudo npm install -g npm
```

## Backend Services

Make sure the following backend services are running:

- **Demand Analysis**: `http://localhost:5002`
- **Supply Analysis**: `http://localhost:5001`
- **Matching Service**: `http://localhost:5003`
- **Scenario Service**: `http://localhost:5004`

The frontend will proxy API requests to these services automatically.

