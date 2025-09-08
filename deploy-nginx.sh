#!/bin/bash

echo "🚀 Deploying PickSides Nginx HTTPS Configuration..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}This script should NOT be run as root. Please run as your user and it will use sudo when needed.${NC}"
   exit 1
fi

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo -e "${RED}Nginx is not installed. Please install it first:${NC}"
    echo "sudo apt update && sudo apt install nginx"
    exit 1
fi

echo -e "${YELLOW}1. Moving SSL certificates...${NC}"
sudo mkdir -p /etc/ssl/private /etc/ssl/certs
sudo cp tailscale.key /etc/ssl/private/tailscale.key
sudo cp tailscale.crt /etc/ssl/certs/tailscale.crt
sudo chmod 600 /etc/ssl/private/tailscale.key
sudo chmod 644 /etc/ssl/certs/tailscale.crt
echo -e "${GREEN}   ✓ SSL certificates installed${NC}"

echo -e "${YELLOW}2. Installing Nginx configuration...${NC}"
sudo cp nginx-picksides.conf /etc/nginx/sites-available/picksides
sudo ln -sf /etc/nginx/sites-available/picksides /etc/nginx/sites-enabled/picksides
echo -e "${GREEN}   ✓ Nginx config installed${NC}"

echo -e "${YELLOW}3. Removing default Nginx site...${NC}"
sudo rm -f /etc/nginx/sites-enabled/default
echo -e "${GREEN}   ✓ Default site removed${NC}"

echo -e "${YELLOW}4. Testing Nginx configuration...${NC}"
if sudo nginx -t; then
    echo -e "${GREEN}   ✓ Nginx configuration is valid${NC}"
else
    echo -e "${RED}   ✗ Nginx configuration has errors${NC}"
    exit 1
fi

echo -e "${YELLOW}5. Creating log directories...${NC}"
sudo mkdir -p /var/log/nginx
sudo touch /var/log/nginx/picksides_access.log
sudo touch /var/log/nginx/picksides_error.log
sudo touch /var/log/nginx/picksides_ssl_access.log
sudo touch /var/log/nginx/picksides_ssl_error.log
sudo chown www-data:adm /var/log/nginx/picksides*.log
echo -e "${GREEN}   ✓ Log files created${NC}"

echo -e "${YELLOW}6. Reloading Nginx...${NC}"
if sudo systemctl reload nginx; then
    echo -e "${GREEN}   ✓ Nginx reloaded successfully${NC}"
else
    echo -e "${RED}   ✗ Failed to reload Nginx${NC}"
    sudo systemctl status nginx
    exit 1
fi

echo -e "${YELLOW}7. Checking Nginx status...${NC}"
if sudo systemctl is-active --quiet nginx; then
    echo -e "${GREEN}   ✓ Nginx is running${NC}"
else
    echo -e "${RED}   ✗ Nginx is not running${NC}"
    sudo systemctl status nginx
    exit 1
fi

echo
echo -e "${GREEN}🎉 Nginx HTTPS deployment completed!${NC}"
echo
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Ensure your Next.js app is running:"
echo "   npm run dev -- -H 0.0.0.0"
echo
echo "2. Access your app via HTTPS:"
echo "   https://100.120.166.71"
echo
echo "3. You'll get a security warning (self-signed cert) - click 'Advanced' → 'Continue'"
echo
echo -e "${YELLOW}Troubleshooting:${NC}"
echo "• Check Nginx logs: sudo tail -f /var/log/nginx/picksides_ssl_error.log"
echo "• Check app is running: curl http://localhost:3000"
echo "• Test Nginx config: sudo nginx -t"
echo "• Reload Nginx: sudo systemctl reload nginx"