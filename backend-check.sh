#!/bin/bash

echo "🔍 Checking Backend Status..."

# Check if backend is running
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Backend is running on http://localhost:3000"
    echo "📊 Health check response:"
    curl -s http://localhost:3000/api/health | jq '.' 2>/dev/null || curl -s http://localhost:3000/api/health
else
    echo "❌ Backend is NOT running on http://localhost:3000"
    echo ""
    echo "🚀 To start the backend:"
    echo "1. Open a new terminal"
    echo "2. Navigate to the backend folder: cd backend"
    echo "3. Install dependencies: npm install"
    echo "4. Start the server: npm run dev"
    echo ""
    echo "📋 Backend should show:"
    echo "   🚀 Server running on port 3000"
    echo "   ✅ Connected to MongoDB"
fi

echo ""
echo "🔗 Testing API endpoints:"

# Test jobs endpoint
echo "📝 Testing GET /api/jobs..."
if curl -s http://localhost:3000/api/jobs > /dev/null; then
    echo "✅ Jobs endpoint is accessible"
else
    echo "❌ Jobs endpoint is not accessible"
fi

# Test health endpoint
echo "🏥 Testing GET /api/health..."
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Health endpoint is accessible"
else
    echo "❌ Health endpoint is not accessible"
fi
