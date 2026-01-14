#!/bin/bash
set -e

VPS_HOST="root@31.97.123.84"
VPS_PATH="/root/tiktok-slideshow-generator/Desktop/tiktok"
BRANCH="feature/tiktok-slideshow-generator"
SERVICE="tiktok-slideshow"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== TikTok Slideshow Deploy ===${NC}"

# 1. Git add and commit (only tiktok project files)
cd /Users/elizavetapirozkova/Desktop/tiktok
if [[ -n $(git status -s .) ]]; then
    git add .
    MSG="${1:-Auto-deploy $(date +%Y-%m-%d_%H:%M)}"
    git commit -m "$MSG"
    echo -e "${GREEN}✓ Committed: $MSG${NC}"
else
    echo "No local changes to commit"
fi

# 2. Push to GitHub
git push origin $BRANCH
echo -e "${GREEN}✓ Pushed to GitHub${NC}"

# 3. Deploy to VPS
echo "Deploying to VPS..."
ssh $VPS_HOST "cd $VPS_PATH && \
    git pull origin $BRANCH && \
    cd backend && \
    pip3 install -r requirements.txt -q && \
    sudo systemctl restart $SERVICE"

echo -e "${GREEN}✓ Deployed and service restarted${NC}"

# 4. Verify service status
ssh $VPS_HOST "systemctl is-active $SERVICE"
echo -e "${GREEN}=== Deploy Complete ===${NC}"
