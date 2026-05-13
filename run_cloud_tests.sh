#!/bin/bash
BASE_URL="http://localhost:3000/reservations"

echo "--- Scenario 1: Cloud Data Integrity (POST) ---"
# Table V3 (ID 12), May 16 (4 guests, capacity 4)
curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{"tableId": 12, "name": "Cloud Test", "phone": "99988777", "date": "2026-05-16", "time": "19:00", "guests": 4}' > result_cloud.json
cat result_cloud.json
CLOUD_ID=$(cat result_cloud.json | grep -o '"id":[0-9]*' | cut -d: -f2)
echo -e "\nCreated ID: $CLOUD_ID\n"

echo "--- Scenario 1: Async Validation & Constraints ---"
echo "Table Capacity (5 guests at T9/ID 9, Capacity 2)"
curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{"tableId": 9, "name": "Fail Capacity", "phone": "123", "date": "2026-05-16", "time": "19:00", "guests": 5}'

echo -e "\n24-Hour Rule (Today: 2026-05-12)"
curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{"tableId": 12, "name": "Fail 24h", "phone": "123", "date": "2026-05-12", "time": "19:00", "guests": 4}'

echo -e "\nClosing Time (21:30)"
curl -s -X POST $BASE_URL -H "Content-Type: application/json" -d '{"tableId": 12, "name": "Fail Cutoff", "phone": "123", "date": "2026-05-16", "time": "21:30", "guests": 4}'

echo -e "\n\n--- Scenario 3: Admin CRUD with Service Role ---"
echo "Fetch to verify creation"
curl -s $BASE_URL | grep '"id":'$CLOUD_ID

echo -e "\nEdit: Change guest count to 2"
curl -s -X PUT $BASE_URL/$CLOUD_ID -H "Content-Type: application/json" -d '{"tableId": 12, "name": "Cloud Test Updated", "phone": "99988777", "date": "2026-05-16", "time": "19:00", "guests": 2, "status": "accepted"}'

echo -e "\nDelete: Remove booking"
curl -s -X DELETE $BASE_URL/$CLOUD_ID

echo -e "\nVerify deletion"
curl -s $BASE_URL | grep '"id":'$CLOUD_ID
