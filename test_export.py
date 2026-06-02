import requests
import json

# Test data
test_data = {
    "boardTitle": "Test Board",
    "availableItems": [
        {"id": "1", "label": "Item 1", "emoji": "📦", "color": "#667eea"}
    ],
    "sections": [
        {"id": "s1", "title": "Section 1", "items": [{"id": "1"}]}
    ],
    "todos": [
        {"id": "t1", "text": "Task 1", "date": "2024-01-01", "completed": False, "subtasks": []}
    ]
}

# Test the export endpoint
response = requests.post('http://localhost:5000/export-excel', json=test_data)

if response.status_code == 200:
    with open('test_export.xlsx', 'wb') as f:
        f.write(response.content)
    print("Excel file saved as test_export.xlsx")
else:
    print(f"Error: {response.status_code}")
    print(response.text)