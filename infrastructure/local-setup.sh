#!/bin/bash

echo "=== Local Development Environment Setup ==="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this from the frontend directory"
    echo "   cd ecommerce-app/frontend"
    echo "   bash ../infrastructure/local-setup.sh"
    exit 1
fi

echo "📦 Installing frontend dependencies..."
npm install

echo ""
echo "🐍 Setting up Python backend..."
cd ../backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

echo ""
echo "✅ Local environment setup complete!"
echo ""
echo "=== Next Steps ==="
echo "1. Create your .env file in the frontend directory"
echo "2. Create your env.json file in the backend directory" 
echo "3. Run the Google Sheets setup script"
echo ""
echo "See the configuration templates that will be created next..."