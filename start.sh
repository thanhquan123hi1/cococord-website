#!/bin/bash
# CoCoCord - Start Script for Linux/Mac
# This script checks prerequisites and starts the application

echo "========================================"
echo "   CoCoCord Real-time Chat App"
echo "========================================"
echo ""

# Check Java
echo "[1/4] Checking Java..."
if ! command -v java &> /dev/null; then
    echo "ERROR: Java is not installed or not in PATH"
    echo "Please install Java 21 or higher"
    exit 1
fi
echo "Java OK"
echo ""

# Check MySQL
echo "[2/4] Checking MySQL connection..."
if ! command -v mysql &> /dev/null; then
    echo "WARNING: MySQL client not found"
    echo "Please ensure MySQL is running on localhost:3306"
else
    mysql -u root -pthanhquandz957 -e "SELECT 1" &> /dev/null
    if [ $? -ne 0 ]; then
        echo "WARNING: Cannot connect to MySQL"
        echo "Please ensure MySQL is running on localhost:3306"
        echo "Username: root"
        echo "Password: thanhquandz957"
        read -p "Press enter to continue anyway..."
    else
        echo "MySQL OK"
    fi
fi
echo ""

# Check MongoDB
echo "[3/4] Checking MongoDB connection..."
echo "MongoDB will be checked when app starts"
echo ""

# Start Application
echo "[4/4] Starting CoCoCord..."
echo ""
echo "The application will start on http://localhost:8080"
echo ""
echo "Available pages:"
echo "- http://localhost:8080/register - Register new account"
echo "- http://localhost:8080/login - Login"
echo "- http://localhost:8080/chat - Chat interface"
echo "- http://localhost:8080/websocket-test.html - WebSocket test client"
echo ""
echo "Press Ctrl+C to stop the server"
echo "========================================"
echo ""

# Start Spring Boot
./mvnw spring-boot:run
