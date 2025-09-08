#!/bin/bash

# PickSides nginx Management Script

echo "PickSides nginx Management Commands:"
echo "==================================="

case "$1" in
  status)
    echo "nginx Status:"
    sudo systemctl status nginx --no-pager
    echo ""
    echo "Port 80 Status:"
    sudo ss -tlnp | grep :80
    ;;
  logs)
    echo "Recent nginx logs for PickSides:"
    echo "Access logs:"
    sudo tail -n 20 /var/log/nginx/picksides_access.log
    echo ""
    echo "Error logs:"
    sudo tail -n 20 /var/log/nginx/picksides_error.log
    ;;
  test)
    echo "Testing nginx configuration:"
    sudo nginx -t
    ;;
  reload)
    echo "Reloading nginx configuration:"
    sudo nginx -s reload
    ;;
  restart)
    echo "Restarting nginx:"
    sudo systemctl restart nginx
    ;;
  stop)
    echo "Stopping nginx:"
    sudo systemctl stop nginx
    ;;
  start)
    echo "Starting nginx:"
    sudo systemctl start nginx
    ;;
  check-site)
    echo "Testing PickSides access:"
    curl -I http://picksides.app 2>/dev/null | head -1 || echo "Site not accessible"
    ;;
  full-status)
    echo "=== FULL PICKSIDES STATUS ==="
    echo ""
    echo "1. PM2 (PickSides Backend):"
    npx pm2 status
    echo ""
    echo "2. Caddy (Reverse Proxy):"
    ps aux | grep caddy | grep -v grep || echo "Caddy not running"
    echo ""
    echo "3. nginx (Web Server):"
    sudo systemctl status nginx --no-pager -l
    echo ""
    echo "4. Port Status:"
    echo "Port 3002 (PM2):" && ss -tln | grep :3002 || echo "Not listening"
    echo "Port 8000 (Caddy):" && ss -tln | grep :8000 || echo "Not listening"
    echo "Port 80 (nginx):" && ss -tln | grep :80 || echo "Not listening"
    ;;
  *)
    echo "Usage: $0 {status|logs|test|reload|restart|stop|start|check-site|full-status}"
    echo ""
    echo "Commands:"
    echo "  status      - Show nginx service status"
    echo "  logs        - Show recent access and error logs"
    echo "  test        - Test nginx configuration"
    echo "  reload      - Reload nginx config (no downtime)"
    echo "  restart     - Restart nginx service"
    echo "  stop        - Stop nginx service"
    echo "  start       - Start nginx service"
    echo "  check-site  - Test if http://picksides.app is working"
    echo "  full-status - Show complete PickSides stack status"
    echo ""
    echo "Your PickSides stack:"
    echo "  http://picksides.app (nginx) → localhost:8000 (Caddy) → localhost:3002 (PM2)"
    ;;
esac