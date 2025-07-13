#!/usr/bin/env python3
"""
Master Setup Script for E-Commerce App
This guides you through the entire configuration process
"""

import os
import sys
import subprocess

def run_command(cmd, description):
    """Run a command and show the result"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"   ✅ {description} completed")
            return True
        else:
            print(f"   ❌ {description} failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"   ❌ {description} failed: {e}")
        return False

def check_requirements():
    """Check if all required tools are installed"""
    print("🔍 Checking requirements...")
    
    requirements = [
        ("python3 --version", "Python 3"),
        ("node --version", "Node.js"),
        ("npm --version", "npm"),
    ]
    
    all_good = True
    for cmd, name in requirements:
        if not run_command(cmd, f"Checking {name}"):
            all_good = False
    
    return all_good

def main():
    print("🚀 E-Commerce App Master Setup")
    print("=" * 50)
    print("")
    
    # Check if we're in the right directory
    if not os.path.exists("../frontend/package.json"):
        print("❌ Please run this from the infrastructure directory")
        print("   cd ecommerce-app/infrastructure")
        print("   python master-setup.py")
        return
    
    # Check requirements
    if not check_requirements():
        print("\n❌ Please install missing requirements and try again")
        return
    
    print("\n📋 This script will guide you through:")
    print("   1. Installing dependencies")
    print("   2. Configuring your app")
    print("   3. Setting up Google Sheets")
    print("   4. Creating GitHub secrets template")
    print("")
    
    response = input("📝 Ready to continue? (y/N): ").strip().lower()
    if response != 'y':
        print("👋 Setup cancelled")
        return
    
    # Step 1: Install dependencies
    print("\n1️⃣  Installing dependencies...")
    
    # Frontend dependencies
    os.chdir("../frontend")
    if not run_command("npm install", "Installing frontend dependencies"):
        return
    
    # Backend dependencies
    os.chdir("../backend")
    if not os.path.exists("venv"):
        run_command("python3 -m venv venv", "Creating Python virtual environment")
    
    # Activate virtual environment and install dependencies
    pip_cmd = "source venv/bin/activate && pip install -r requirements.txt"
    if not run_command(pip_cmd, "Installing backend dependencies"):
        return
    
    # Step 2: Configuration
    print("\n2️⃣  Running configuration wizard...")
    os.chdir("../infrastructure")
    
    print("\n📝 Please have ready:")
    print("   • Google OAuth Client ID")
    print("   • Google Spreadsheet ID")
    print("   • Path to your service account JSON file")
    print("")
    
    if subprocess.run([sys.executable, "configure-app.py"]).returncode != 0:
        print("❌ Configuration failed")
        return
    
    # Step 3: Google Sheets setup
    print("\n3️⃣  Setting up Google Sheets...")
    
    # Install Google dependencies first
    pip_cmd = "cd ../backend && source venv/bin/activate && pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client"
    run_command(pip_cmd, "Installing Google API dependencies")
    
    if subprocess.run([sys.executable, "setup-google-sheets.py"]).returncode != 0:
        print("❌ Google Sheets setup failed")
        return
    
    print("\n🎉 Setup Complete!")
    print("=" * 30)
    print("\n📋 Next Steps:")
    print("1. Test your local development:")
    print("   Terminal 1: cd frontend && npm start")
    print("   Terminal 2: cd backend && source venv/bin/activate && sam local start-api --env-vars env.json")
    print("")
    print("2. Set up AWS:")
    print("   Follow the guide in aws-setup-guide.md")
    print("")
    print("3. Deploy to production:")
    print("   Push to GitHub and configure secrets from github-secrets-template.json")
    print("")
    print("🌐 Your app will be running at:")
    print("   Frontend: http://localhost:3000")
    print("   Backend: http://localhost:3001")

if __name__ == "__main__":
    main()