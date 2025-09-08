#!/bin/bash

# PickSides nginx Setup Script
echo "Setting up nginx reverse proxy for PickSides..."

# Install nginx
echo "Installing nginx..."
sudo apt update
sudo apt install -y nginx

# Copy configuration
echo "Setting up nginx configuration..."
sudo cp nginx-picksides.conf /etc/nginx/sites-available/picksides

# Enable the site
echo "Enabling PickSides site..."
sudo ln -s /etc/nginx/sites-available/picksides /etc/nginx/sites-enabled/

# Remove default nginx site
echo "Removing default nginx site..."
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
echo "Testing nginx configuration..."
sudo nginx -t

# Start and enable nginx
echo "Starting nginx service..."
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
echo "nginx status:"
sudo systemctl status nginx --no-pager

echo ""
echo "Setup complete! Your PickSides app should now be accessible at:"
echo "http://picksides.app"
echo ""
echo "To check logs:"
echo "sudo tail -f /var/log/nginx/picksides_access.log"
echo "sudo tail -f /var/log/nginx/picksides_error.log"