# Railway Deployment Guide

## Quick Deploy Steps

1. **Install Railway CLI**
```bash
npm install -g @railway/cli
```

2. **Login to Railway**
```bash
railway login
```

3. **Initialize Railway Project**
```bash
railway init
```

4. **Deploy Server**
```bash
railway up
```

## Environment Variables to Set in Railway

Go to your Railway project dashboard and add these environment variables:

### Required Variables
```
NODE_ENV=production
PORT=8080
REQUESTY_API_KEY=your_requesty_api_key_here
CLIENT_URL=https://tubular-biscochitos-608b9a.netlify.app
```

### Optional Variables (for enhanced features)
```
REDIS_URL=redis://localhost:6379
ASTRA_DB_ID=your_astra_db_id
ASTRA_DB_REGION=your_region
ASTRA_DB_TOKEN=your_token
GITHUB_TOKEN=your_github_token
```

## Deployment Commands
```bash
# Deploy to Railway
npm run deploy:railway

# Or manually
railway up
```