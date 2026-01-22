# 🔧 Complete Setup Guide for SIPI-V2

## Step-by-Step Setup Instructions

### Step 1: Install Node.js (Required)

Node.js doesn't appear to be installed. Here are your options:

#### Option A: Install via Homebrew (Recommended for macOS)

```bash
# Check if Homebrew is installed
brew --version

# If Homebrew is installed, install Node.js:
brew install node

# Verify installation
node --version  # Should be v18.x.x or higher
npm --version
```

#### Option B: Install from Official Website

1. Visit [https://nodejs.org/](https://nodejs.org/)
2. Download the LTS version (18.x or higher)
3. Run the installer
4. Verify installation:
   ```bash
   node --version
   npm --version
   ```

#### Option C: Install via nvm (Node Version Manager)

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload your shell
source ~/.zshrc

# Install Node.js LTS
nvm install --lts

# Use the installed version
nvm use --lts

# Verify
node --version
npm --version
```

---

### Step 2: Install MySQL (Required)

#### Option A: Install via Homebrew

```bash
brew install mysql

# Start MySQL service
brew services start mysql

# Secure installation (optional but recommended)
mysql_secure_installation
```

#### Option B: Install XAMPP (Includes MySQL + phpMyAdmin)

1. Download XAMPP from [https://www.apachefriends.org/](https://www.apachefriends.org/)
2. Install XAMPP
3. Start MySQL from XAMPP Control Panel

#### Verify MySQL Installation

```bash
# Check if MySQL is running
mysql --version

# Test connection (use root password or press Enter if no password)
mysql -u root -p
```

---

### Step 3: Setup Project Environment

Once Node.js is installed, run the automated setup script:

```bash
cd /Users/angeljimenezr/workspace/repos/sipi-v2
./setup-env.sh
```

**OR** follow the manual steps below:

---

### Step 4: Manual Setup (If Script Doesn't Work)

#### 4.1 Install Backend Dependencies

```bash
cd backend
npm install
```

#### 4.2 Install Frontend Dependencies

```bash
cd frontend
npm install
```

#### 4.3 Create Backend .env File

Create `backend/.env` with the following content:

```env
# Database Configuration
# Replace with your MySQL credentials
DATABASE_URL="mysql://root:password@localhost:3306/sipi_db"

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
# Generate a secure secret: openssl rand -base64 32
JWT_SECRET=development_jwt_secret_change_this_in_production_minimum_32_characters_long
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

**⚠️ Important:** 
- Replace `root:password` with your actual MySQL credentials
- If MySQL has no password, use: `mysql://root@localhost:3306/sipi_db`
- Replace `sipi_db` with your preferred database name

#### 4.4 Create Frontend .env File

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

---

### Step 5: Setup Database

#### 5.1 Create Database

```bash
# Connect to MySQL
mysql -u root -p
```

Then run in MySQL:

```sql
CREATE DATABASE sipi_db;
EXIT;
```

**OR** using phpMyAdmin (if using XAMPP):
1. Open http://localhost/phpmyadmin
2. Click "New" in the left sidebar
3. Database name: `sipi_db`
4. Click "Create"

#### 5.2 Update Database URL in .env

Make sure `backend/.env` has the correct `DATABASE_URL` matching your database credentials.

---

### Step 6: Generate Prisma Client

```bash
cd backend
npm run prisma:generate
```

This creates the Prisma client for type-safe database queries.

---

### Step 7: Run Database Migrations

```bash
cd backend
npm run prisma:migrate
```

This creates all the necessary tables in your database.

**If prompted**, enter a migration name or press Enter to accept the default.

---

### Step 8: (Optional) Create Test User

Create an admin user for testing:

```bash
cd backend
npm run create:user
```

Follow the prompts:
- Username: (e.g., `admin`)
- Password: (e.g., `admin123`)
- Role: `ADMIN`

---

### Step 9: Start the Application

#### Terminal 1 - Backend:

```bash
cd backend
npm run dev
```

You should see:
```
🚀 Server running on port 3001
📝 Environment: development
🔗 Health check: http://localhost:3001/health
```

#### Terminal 2 - Frontend:

```bash
cd frontend
npm run dev
```

You should see:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

### Step 10: Verify Setup

#### 10.1 Test Backend Health

```bash
curl http://localhost:3001/health
```

Should return: `{"status":"ok","timestamp":"..."}`

#### 10.2 Test Frontend

1. Open browser: `http://localhost:5173`
2. You should see the login page
3. Use the test user credentials created in Step 8

---

## Troubleshooting

### Node.js Issues

**Problem:** `node: command not found`

**Solution:**
- Make sure Node.js is installed (see Step 1)
- Add Node.js to PATH:
  ```bash
  # For Homebrew installation
  echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.zshrc
  source ~/.zshrc
  
  # For nvm
  echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
  echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.zshrc
  source ~/.zshrc
  ```

### MySQL Connection Issues

**Problem:** `Can't connect to MySQL server`

**Solutions:**

1. **Check if MySQL is running:**
   ```bash
   # Homebrew
   brew services list | grep mysql
   
   # XAMPP
   # Check XAMPP Control Panel
   ```

2. **Start MySQL:**
   ```bash
   # Homebrew
   brew services start mysql
   
   # XAMPP
   # Start from XAMPP Control Panel
   ```

3. **Test connection:**
   ```bash
   mysql -u root -p
   ```

4. **Check credentials in `backend/.env`:**
   - Username: `root` (or your MySQL username)
   - Password: Your MySQL password (leave empty if no password)
   - Host: `localhost`
   - Port: `3306` (default)

### Prisma Migration Issues

**Problem:** Migration fails

**Solutions:**

1. **Check database exists:**
   ```sql
   SHOW DATABASES;
   ```

2. **Check database connection:**
   ```bash
   # Test DATABASE_URL
   cd backend
   node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"
   ```

3. **Reset migrations (⚠️ WARNING: Deletes all data):**
   ```bash
   cd backend
   npx prisma migrate reset
   npm run prisma:migrate
   ```

### Port Already in Use

**Problem:** Port 3001 or 5173 already in use

**Solution:**

1. **Find the process:**
   ```bash
   lsof -i :3001
   lsof -i :5173
   ```

2. **Kill the process:**
   ```bash
   kill -9 <PID>
   ```

3. **Or change ports in `.env` files**

### Module Not Found Errors

**Problem:** `Cannot find module '...'`

**Solution:**

1. **Delete node_modules and reinstall:**
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

---

## Quick Command Reference

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Setup database
cd backend
npm run prisma:generate
npm run prisma:migrate

# Start development
cd backend && npm run dev      # Terminal 1
cd frontend && npm run dev     # Terminal 2

# Create test user
cd backend && npm run create:user

# Open Prisma Studio (Database GUI)
cd backend && npm run prisma:studio
```

---

## Next Steps

Once everything is running:

1. ✅ Login with your test user
2. ✅ Explore the admin dashboard
3. ✅ Create students, teachers, subjects
4. ✅ Test the enrollment system
5. ✅ Review the code structure
6. ✅ Check [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines

---

## Need Help?

- Check [README.md](./README.md) for project overview
- Review [README-SETUP.md](./README-SETUP.md) for quick reference
- Check [CONTRIBUTING.md](./CONTRIBUTING.md) for development practices
- Review [docs/setup/troubleshooting.md](./docs/setup/troubleshooting.md) for common issues

---

Happy coding! 🚀


