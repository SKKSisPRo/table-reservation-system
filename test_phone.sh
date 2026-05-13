#!/bin/bash
BASE_URL="http://localhost:3000/reservations"

echo "--- Phone Validation Tests ---"

echo "Test 1: Valid Norway Phone (+47 12345678)"
curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{"tableId": 12, "name": "Valid Phone", "phone": "+47 12345678", "date": "2026-05-18", "time": "19:00", "guests": 2}'

echo -e "\n\nTest 2: Invalid Norway Phone (+47 123)"
curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{"tableId": 12, "name": "Invalid Phone", "phone": "+47 123", "date": "2026-05-18", "time": "19:00", "guests": 2}'

echo -e "\n\nTest 3: Valid UK Phone (+44 1234567890)"
curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{"tableId": 12, "name": "Valid UK", "phone": "+44 1234567890", "date": "2026-05-18", "time": "19:00", "guests": 2}'
