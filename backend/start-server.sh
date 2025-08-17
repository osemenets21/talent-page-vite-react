#!/bin/bash
# Unified Backend Server Startup Script

# Configuration
PORT=8000
XAMPP_PHP="C:\xampp\php\php.exe"
STANDALONE_PHP="php"

# Check which PHP to use
if [ -f "$XAMPP_PHP" ]; then
    PHP_CMD="$XAMPP_PHP"
    echo "🚀 Starting unified backend server with XAMPP PHP (MySQL support)..."
else
    PHP_CMD="$STANDALONE_PHP"
    echo "🚀 Starting unified backend server with standalone PHP..."
fi

echo "📍 Server will be available at: http://localhost:$PORT"
echo "🎯 API Endpoints:"
echo "   • Events API: http://localhost:$PORT/api/events"
echo "   • Talent API: http://localhost:$PORT/api/talent"
echo "   • Uploads: http://localhost:$PORT/uploads/*"
echo ""
echo "📊 Direct Event Endpoints:"
echo "   • GET    /events - List all events"
echo "   • POST   /events - Create event"
echo "   • PUT    /events?id=1 - Update event"
echo "   • DELETE /events?id=1 - Delete event"
echo ""
echo "👥 Direct Talent Endpoints:"
echo "   • POST /talent/submit - Submit talent form"
echo "   • GET  /talent/all - Get all talent"
echo "   • GET  /talent/get?email=... - Get by email"
echo ""
echo "🛑 Press Ctrl+C to stop the server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Start the server
"$PHP_CMD" -S "localhost:$PORT" -t .
