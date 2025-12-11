@echo off
REM CoCoCord - Start Script for Windows
REM This script checks prerequisites and starts the application

echo ========================================
echo    CoCoCord Real-time Chat App
echo ========================================
echo.

REM Check Java
echo [1/4] Checking Java...
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Java is not installed or not in PATH
    echo Please install Java 21 or higher
    pause
    exit /b 1
)
echo Java OK
echo.

REM Check MySQL
echo [2/4] Checking MySQL connection...
mysql -u root -pthanhquandz957 -e "SELECT 1" >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Cannot connect to MySQL
    echo Please ensure MySQL is running on localhost:3306
    echo Username: root
    echo Password: thanhquandz957
    echo.
    echo Press any key to continue anyway...
    pause >nul
)
echo MySQL OK
echo.

REM Check MongoDB
echo [3/4] Checking MongoDB connection...
REM MongoDB check is optional, will start anyway
echo MongoDB will be checked when app starts
echo.

REM Start Application
echo [4/4] Starting CoCoCord...
echo.
echo The application will start on http://localhost:8080
echo.
echo Available pages:
echo - http://localhost:8080/register - Register new account
echo - http://localhost:8080/login - Login
echo - http://localhost:8080/chat - Chat interface
echo - http://localhost:8080/websocket-test.html - WebSocket test client
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

REM Start Spring Boot
call mvnw.cmd spring-boot:run

pause
