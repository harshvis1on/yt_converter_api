#!/bin/bash

echo "🚀 YouTube Converter API Deployment Script"
echo "=========================================="

# Check if git repo is initialized
if [ ! -d .git ]; then
    echo "📝 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit - YouTube Converter API"
fi

echo ""
echo "📋 Deployment Options:"
echo "1. 🟦 Render (Recommended)"
echo "2. 🚂 Railway" 
echo "3. ✈️  Fly.io"
echo "4. 🌐 Vercel"
echo ""

read -p "Choose deployment option (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🟦 RENDER DEPLOYMENT INSTRUCTIONS"
        echo "================================="
        echo ""
        echo "1. Go to https://render.com and sign up/login"
        echo "2. Click 'New +' → 'Web Service'"
        echo "3. Connect your GitHub repository or:"
        echo "   - Upload this folder as a zip"
        echo "4. Configure:"
        echo "   - Name: yt-converter-api"
        echo "   - Environment: Python 3"
        echo "   - Build Command: pip install -r requirements.txt"
        echo "   - Start Command: uvicorn main:app --host 0.0.0.0 --port \$PORT"
        echo ""
        echo "5. Set Environment Variables:"
        echo "   - RAPIDAPI_KEY=your_rapidapi_key"
        echo "   - CONVERSION_API_KEY=conv_2026_secure_podpay_api_key"
        echo "   - GOOGLE_CLIENT_ID=your_google_client_id"
        echo "   - GOOGLE_CLIENT_SECRET=your_google_client_secret"
        echo ""
        echo "6. Deploy!"
        echo ""
        echo "📄 render.yaml file has been created for automatic configuration"
        ;;
    2)
        echo ""
        echo "🚂 RAILWAY DEPLOYMENT INSTRUCTIONS"
        echo "=================================="
        echo ""
        echo "1. Install Railway CLI: npm install -g @railway/cli"
        echo "2. Login: railway login"
        echo "3. Initialize: railway init"
        echo "4. Set environment variables:"
        echo "   railway variables set RAPIDAPI_KEY=your_rapidapi_key"
        echo "   railway variables set CONVERSION_API_KEY=conv_2026_secure_podpay_api_key"
        echo "5. Deploy: railway up"
        ;;
    3)
        echo ""
        echo "✈️ FLY.IO DEPLOYMENT INSTRUCTIONS"
        echo "================================="
        echo ""
        echo "1. Install flyctl: curl -L https://fly.io/install.sh | sh"
        echo "2. Login: fly auth login"
        echo "3. Initialize: fly launch"
        echo "4. Set secrets:"
        echo "   fly secrets set RAPIDAPI_KEY=your_rapidapi_key"
        echo "   fly secrets set CONVERSION_API_KEY=conv_2026_secure_podpay_api_key"
        echo "5. Deploy: fly deploy"
        ;;
    4)
        echo ""
        echo "🌐 VERCEL DEPLOYMENT"
        echo "==================="
        echo ""
        echo "Note: Vercel is better for frontend, but can work for Python APIs"
        echo "1. Install Vercel CLI: npm install -g vercel"
        echo "2. Login: vercel login"
        echo "3. Deploy: vercel"
        echo "4. Set environment variables in Vercel dashboard"
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "📝 IMPORTANT NOTES:"
echo "=================="
echo "• Make sure to set your RAPIDAPI_KEY in the deployment environment"
echo "• The API will be available at: https://your-app-name.platform.com"
echo "• Test the health endpoint: https://your-app-name.platform.com/health"
echo "• Update your n8n workflow to use the new URL"
echo ""
echo "🔑 Environment Variables Needed:"
echo "• RAPIDAPI_KEY=your_rapidapi_key_here"
echo "• CONVERSION_API_KEY=conv_2026_secure_podpay_api_key"
echo "• GOOGLE_CLIENT_ID=your_google_client_id"
echo "• GOOGLE_CLIENT_SECRET=your_google_client_secret"