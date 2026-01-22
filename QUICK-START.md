# ⚡ Quick Start - Get Running in 5 Minutes

## Prerequisites Check

First, let's check if you have everything needed:

```bash
# Check Node.js
node --version || echo "⚠️  Node.js not found - Install with: brew install node"

# Check npm
npm --version || echo "⚠️  npm not found - Comes with Node.js"

# Check MySQL
mysql --version || echo "⚠️  MySQL not found - Install with: brew install mysql"
```

---

## 🚀 Fast Track Setup

### 1. Install Node.js (if needed)

```bash
brew install node
```

Verify:
```bash
node --version  # Should be v18+
npm --version
```

### 2. Install MySQL (if needed)

```bash
brew install mysql
brew services start mysql
```

### 3. Run Automated Setup

```bash
cd /Users/angeljimenezr/workspace/repos/sipi-v2
./setup-env.sh
```

This will:
- ✅ Install all dependencies
- ✅ Create `.env` files
- ✅ Guide you through next steps

### 4. Create Database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE sipi_db;
EXIT;
```

### 5. Update Backend .env

Edit `backend/.env` and update:
- `DATABASE_URL` with your MySQL credentials
- `JWT_SECRET` (generate with: `openssl rand -base64 32`)

### 6. Setup Database

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

### 7. Create Test User

```bash
cd backend
npm run create:user
```

Follow prompts to create an admin user.

### 8. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 9. Open Browser

Navigate to: `http://localhost:5173`

Login with the user you created in step 7.

---

## ✅ Verification Checklist

- [ ] Node.js 18+ installed
- [ ] MySQL installed and running
- [ ] Dependencies installed (backend & frontend)
- [ ] `.env` files created and configured
- [ ] Database `sipi_db` created
- [ ] Prisma client generated
- [ ] Migrations run successfully
- [ ] Test user created
- [ ] Backend running on port 3001
- [ ] Frontend running on port 5173
- [ ] Can access login page in browser

---

## 🆘 Quick Troubleshooting

**Node.js not found?**
```bash
brew install node
source ~/.zshrc
```

**MySQL not running?**
```bash
brew services start mysql
```

**Port in use?**
```bash
lsof -i :3001
kill -9 <PID>
```

**Database connection error?**
- Check `backend/.env` credentials
- Verify MySQL is running
- Test: `mysql -u root -p`

**Module not found?**
```bash
cd backend && rm -rf node_modules && npm install
cd frontend && rm -rf node_modules && npm install
```

---

## 📚 More Details

For detailed instructions, see:
- [SETUP-GUIDE.md](./SETUP-GUIDE.md) - Complete setup guide
- [README-SETUP.md](./README-SETUP.md) - Setup reference
- [README.md](./README.md) - Project overview

---

Ready to code! 🎉


