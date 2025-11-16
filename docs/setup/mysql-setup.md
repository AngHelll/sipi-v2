# MySQL Installation and Setup Guide

## Installation Status

MySQL is **not currently installed** on your system.

## Installation Options

### Option 1: Install via Homebrew (Recommended for macOS)

Since you have Homebrew installed, this is the easiest method:

```bash
# Install MySQL
brew install mysql

# Start MySQL service
brew services start mysql

# Secure installation (set root password)
mysql_secure_installation
```

### Option 2: Install MySQL Server via Official Installer

1. Download MySQL from: https://dev.mysql.com/downloads/mysql/
2. Choose macOS installer (DMG)
3. Run the installer and follow the setup wizard
4. Remember the root password you set during installation

### Option 3: Use Docker (Alternative)

If you prefer Docker:

```bash
# Run MySQL in a Docker container
docker run --name sipi-mysql \
  -e MYSQL_ROOT_PASSWORD=yourpassword \
  -e MYSQL_DATABASE=sipi_db \
  -p 3306:3306 \
  -d mysql:8.0

# Your DATABASE_URL would be:
# DATABASE_URL="mysql://root:yourpassword@localhost:3306/sipi_db"
```

## After Installation

### 1. Verify Installation

```bash
# Check MySQL version
mysql --version

# Check if MySQL is running
brew services list | grep mysql
# or
ps aux | grep mysql
```

### 2. Connect to MySQL

```bash
# Connect as root (you'll be prompted for password)
mysql -u root -p

# Or if no password is set yet
mysql -u root
```

### 3. Create Database

Once connected to MySQL, create the database:

```sql
CREATE DATABASE sipi_db;
-- or
CREATE DATABASE sipi_modern;

-- Verify it was created
SHOW DATABASES;

-- Exit MySQL
EXIT;
```

### 4. Update .env File

Update your `backend/.env` file with the correct credentials:

```bash
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/sipi_db"
```

Replace `YOUR_PASSWORD` with the root password you set.

### 5. Test Connection

```bash
cd backend

# Test with Prisma
npx prisma db pull

# Or test with MySQL client
mysql -u root -p -h localhost -P 3306 sipi_db
```

## Common Commands

### Start/Stop MySQL

```bash
# Start MySQL
brew services start mysql
# or
mysql.server start

# Stop MySQL
brew services stop mysql
# or
mysql.server stop

# Restart MySQL
brew services restart mysql
```

### Reset Root Password

If you forgot your root password:

```bash
# Stop MySQL
brew services stop mysql

# Start MySQL in safe mode
mysqld_safe --skip-grant-tables &

# Connect without password
mysql -u root

# Reset password
USE mysql;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'newpassword';
FLUSH PRIVILEGES;
EXIT;

# Stop safe mode MySQL and restart normally
brew services restart mysql
```

### Create a Non-Root User (Recommended for Production)

```sql
-- Connect as root
mysql -u root -p

-- Create user
CREATE USER 'sipi_user'@'localhost' IDENTIFIED BY 'secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON sipi_db.* TO 'sipi_user'@'localhost';
FLUSH PRIVILEGES;

-- Then use in DATABASE_URL:
-- DATABASE_URL="mysql://sipi_user:secure_password@localhost:3306/sipi_db"
```

## Troubleshooting

### MySQL Won't Start

```bash
# Check error logs
tail -f /usr/local/var/mysql/*.err
# or
tail -f /opt/homebrew/var/mysql/*.err

# Check if port 3306 is in use
lsof -i :3306
```

### Connection Refused

- Ensure MySQL is running: `brew services list`
- Check firewall settings
- Verify port 3306 is not blocked

### Access Denied

- Verify username and password
- Check if user has privileges: `SHOW GRANTS FOR 'user'@'localhost';`
- Try resetting password (see above)

## Next Steps

After MySQL is installed and configured:

1. ✅ Update `.env` with correct `DATABASE_URL`
2. ✅ Run `npm run verify:env` to verify configuration
3. ✅ Run `npm run prisma:generate` to generate Prisma client
4. ✅ Run `npm run prisma:migrate` to create database tables
5. ✅ Start your backend: `npm run dev`

