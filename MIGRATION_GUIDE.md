# Railway PostgreSQL Migration Guide

## Overview
This migration sets up a complete PostgreSQL database on Railway with Prisma ORM, making Supabase optional.

## Key Changes

### 1. Database Setup
- **Prisma Schema**: Complete database schema in `prisma/schema.prisma`
- **Migration Files**: Initial migration in `prisma/migrations/`
- **Seed Data**: Sample data setup in `prisma/seed.js`

### 2. Services
- **DatabaseService**: New service for PostgreSQL operations
- **Supabase Optional**: Can be disabled with `ENABLE_SUPABASE=false`
- **Backward Compatible**: Existing Supabase code still works

### 3. Environment Variables

#### Required
```bash
DATABASE_URL="postgresql://username:password@host:port/database"
REQUESTY_API_KEY=your_api_key
```

#### Optional
```bash
ENABLE_SUPABASE=false  # Disable Supabase integration
REDIS_URL=redis://...  # For distributed events
GITHUB_TOKEN=...       # GitHub integration
```

## Deployment Steps

### 1. Railway Setup
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link project
railway login
railway link
```

### 2. Add PostgreSQL Database
1. Go to Railway dashboard
2. Add PostgreSQL service to your project
3. Railway will automatically set `DATABASE_URL`

### 3. Set Environment Variables
```bash
# In Railway dashboard, set:
NODE_ENV=production
PORT=8080
REQUESTY_API_KEY=your_key_here
ENABLE_SUPABASE=false
```

### 4. Deploy
```bash
npm run deploy
```

Railway will automatically:
- Install dependencies
- Generate Prisma client
- Run database migrations
- Seed initial data
- Start the server

## Database Schema

### Core Tables
- **users**: User accounts
- **organizations**: Multi-tenant organizations  
- **conversations**: Chat conversations
- **messages**: Chat messages with embeddings
- **artifacts**: Generated code/content
- **folders**: Organization structure

### Swarm Tables
- **swarms**: Agent swarm instances
- **agents**: Individual AI agents
- **tasks**: Swarm tasks and coordination
- **swarm_events**: Event history

### Project Tables
- **projects**: Development projects
- **project_files**: File management
- **deployments**: Deployment tracking

## Migration Benefits

### 1. **Cost Efficiency**
- Single Railway service
- No external database costs
- Built-in PostgreSQL

### 2. **Performance**
- Same-region database
- No network latency
- Vector search ready

### 3. **Simplicity**
- One deployment pipeline
- Automatic migrations
- Built-in monitoring

### 4. **Flexibility**
- Keep Supabase if needed
- Easy local development
- Full SQL access

## Local Development

### 1. Setup Database
```bash
# Install PostgreSQL locally or use Docker
docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres

# Set DATABASE_URL
export DATABASE_URL="postgresql://postgres:password@localhost:5432/swarm_agents"
```

### 2. Run Migrations
```bash
npm run db:migrate
npm run db:seed
```

### 3. Start Development
```bash
npm run dev
```

## Prisma Commands

```bash
# Generate Prisma client
npm run db:generate

# Apply schema changes
npm run db:push

# Deploy migrations
npm run db:migrate

# Seed database
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

## Turning Off Supabase

To disable Supabase completely:

1. **Set Environment Variable**:
   ```bash
   ENABLE_SUPABASE=false
   ```

2. **Remove Supabase Dependencies** (optional):
   ```bash
   npm uninstall @supabase/supabase-js
   ```

3. **Update Frontend**: The app will automatically use Railway PostgreSQL APIs

## Monitoring

### Health Check
Visit `/health` to see:
- Database connection status
- Service availability  
- Configuration status

### Prisma Studio
Use `npm run db:studio` for visual database management

### Railway Logs
Monitor deployment and runtime logs in Railway dashboard

## Troubleshooting

### Database Connection Issues
1. Check `DATABASE_URL` format
2. Verify PostgreSQL service is running
3. Check Railway service logs

### Migration Errors
1. Reset database: `npx prisma db push --force-reset`
2. Re-run migrations: `npm run db:migrate`
3. Re-seed data: `npm run db:seed`

### Performance Issues
1. Check query performance in logs
2. Add database indexes if needed
3. Monitor Railway metrics

## Next Steps

1. **Deploy to Railway**: `npm run deploy`
2. **Test API endpoints**: Use the Test API button
3. **Create conversations**: Test the UI functionality
4. **Monitor performance**: Check Railway dashboard
5. **Scale as needed**: Upgrade Railway plan if required

The migration is now complete! You have a fully functional PostgreSQL database on Railway with optional Supabase support.