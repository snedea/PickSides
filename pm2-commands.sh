#!/bin/bash

# PickSides PM2 Management Script

echo "PickSides PM2 Management Commands:"
echo "=================================="

case "$1" in
  start)
    echo "Starting PickSides with PM2..."
    npx pm2 start ecosystem.config.js
    ;;
  stop)
    echo "Stopping PickSides..."
    npx pm2 stop picksides
    ;;
  restart)
    echo "Restarting PickSides..."
    npx pm2 restart picksides
    ;;
  status)
    echo "PickSides Status:"
    npx pm2 status
    ;;
  logs)
    echo "Showing PickSides logs (Ctrl+C to exit):"
    npx pm2 logs picksides
    ;;
  monitor)
    echo "Opening PM2 Monitor (Ctrl+C to exit):"
    npx pm2 monit
    ;;
  reload)
    echo "Zero-downtime reload of PickSides..."
    npx pm2 reload picksides
    ;;
  info)
    echo "PickSides Process Information:"
    npx pm2 describe picksides
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status|logs|monitor|reload|info}"
    echo ""
    echo "Commands:"
    echo "  start   - Start PickSides with PM2"
    echo "  stop    - Stop PickSides"
    echo "  restart - Restart PickSides"  
    echo "  status  - Show PM2 process status"
    echo "  logs    - Show live logs (tail)"
    echo "  monitor - Open PM2 monitoring dashboard"
    echo "  reload  - Zero-downtime reload"
    echo "  info    - Show detailed process info"
    echo ""
    echo "Access your app at: http://100.120.166.71:3002"
    ;;
esac