# 🚀 Quick Setup Guide for SIPI-V2

This guide will help you set up the development environment for SIPI-V2.

## Prerequisites

- **Node.js 18+** ([Download](https://nodejs.org/))
- **MySQL 8.0+** (or XAMPP with MySQL)
- **npm** (comes with Node.js)
- **Git**

## Quick Setup (Automated)

Run the setup script:

```bash
./setup-env.sh
```

This script will:
- ✅ Check Node.js version
- ✅ Install backend dependencies
- ✅ Install frontend dependencies
- ✅ Create `.env` files (if they don't exist)

## Manual Setup

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

#### Backend (.env)

Create `backend/.env`:

```env
# Database Configuration
DATABASE_URL="mysql://root:password@localhost:3306/sipi_db"

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
# Generate a secure secret: openssl rand -base64 32
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

**⚠️ Important:** 
- Replace `root:password` with your MySQL credentials
- Replace `sipi_db` with your database name if different
- Change `JWT_SECRET` to a secure random string

#### Frontend (.env)

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

### 3. Setup Database

**Option A: Using MySQL directly**

```bash
mysql -u root -p
```

```sql
CREATE DATABASE sipi_db;
EXIT;
```

**Option B: Using XAMPP phpMyAdmin**

1. Open phpMyAdmin (usually at http://localhost/phpmyadmin)
2. Create a new database named `sipi_db`

### 4. Generate Prisma Client

```bash
cd backend
npm run prisma:generate
```

### 5. Run Database Migrations

```bash
cd backend
npm run prisma:migrate
```

This will create all the tables in your database.

### 6. (Optional) Create Test User

Create an admin user for testing:

```bash
cd backend
npm run create:user
```

Follow the prompts to create a user.

## Running the Application

### Start Backend

```bash
cd backend
npm run dev
```

Backend will run on: `http://localhost:3001`

Health check: `http://localhost:3001/health`

### Start Frontend

In a new terminal:

```bash
cd frontend
npm run dev
```

Frontend will run on: `http://localhost:5173`

## Verification

1. **Backend Health Check:**
   ```bash
   curl http://localhost:3001/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Frontend:**
   - Open `http://localhost:5173`
   - You should see the login page

## Troubleshooting

### Node.js not found

**macOS/Linux:**
- Install from [nodejs.org](https://nodejs.org/)
- Or use a version manager: `nvm` or `fnm`

**Check installation:**
```bash
node --version  # Should be v18.x.x or higher
npm --version
```

### MySQL Connection Error

1. Make sure MySQL is running:
   ```bash
   # macOS
   brew services list | grep mysql
   
   # Linux
   sudo systemctl status mysql
   ```

2. Verify credentials in `backend/.env`

3. Test connection:
   ```bash
   mysql -u root -p -h localhost -P 3306
   ```

### Prisma Migration Errors

If migrations fail:

1. Check database connection in `.env`
2. Make sure database exists:
   ```sql
   SHOW DATABASES;
   ```
3. If needed, reset (⚠️ **WARNING**: Deletes all data):
   ```bash
   cd backend
   npx prisma migrate reset
   npm run prisma:migrate
   ```

### Port Already in Use

If port 3001 or 5173 is already in use:

1. Find the process:
   ```bash
   # macOS/Linux
   lsof -i :3001
   lsof -i :5173
   ```

2. Kill the process or change ports in `.env`

### Missing Dependencies

If you get "module not found" errors:

```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## Development Tools

### Prisma Studio (Database GUI)

```bash
cd backend
npm run prisma:studio
```

Opens at: `http://localhost:5555`

### Available Scripts

**Backend:**
- `npm run dev` - Start development server with hot-reload
- `npm run build` - Build for production
- `npm start` - Run production build
- `npm run lint` - Run ESLint
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Next Steps

Once everything is running:

1. ✅ Test the login page
2. ✅ Create test users with the script
3. ✅ Explore the admin dashboard
4. ✅ Read the [CONTRIBUTING.md](./CONTRIBUTING.md) guide
5. ✅ Check the [CHANGELOG.md](./CHANGELOG.md) for recent changes

## Need Help?

- Check the [troubleshooting section](#troubleshooting)
- Review the main [README.md](./README.md)
- Check the documentation in `docs/` folder

---

Happy coding! 🎉


