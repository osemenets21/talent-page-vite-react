#!/bin/bash
# Use XAMPP's PHP instead of standalone PHP
# This ensures MySQL drivers are available

XAMPP_PHP="C:\xampp\php\php.exe"

if [ -f "$XAMPP_PHP" ]; then
    echo "Using XAMPP PHP with MySQL support..."
    "$XAMPP_PHP" "$@"
else
    echo "Error: XAMPP not found at C:\xampp\"
    echo "Please install XAMPP or update the path in this script"
    exit 1
fi
