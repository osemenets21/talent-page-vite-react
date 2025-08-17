@echo off
REM Use XAMPP's PHP instead of standalone PHP
REM This ensures MySQL drivers are available

set XAMPP_PHP=C:\xampp\php\php.exe

if exist "%XAMPP_PHP%" (
    echo Using XAMPP PHP with MySQL support...
    "%XAMPP_PHP%" %*
) else (
    echo Error: XAMPP not found at C:\xampp\
    echo Please install XAMPP or update the path in this script
    exit /b 1
)
