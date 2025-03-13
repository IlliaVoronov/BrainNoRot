import requests
import json
import sys
import time

# Configuration
api_key = '505e707e8d99dae9082dd33bd91c6371'  # Your API key
bible_id = 'de4e12af7f28f599-02'  # ESV Bible ID
base_url = f'https://api.scripture.api.bible/v1/bibles/{bible_id}'

# Function to fetch data from the API
def fetch_data(endpoint):
    headers = {'api-key': api_key}
    url = f'{base_url}/{endpoint}'
    print(f"Fetching: {url}")
    try:
        response = requests.get(url, headers=headers, timeout=30)  # 30-second timeout
        response.raise_for_status()
        data = response.json()['data']
        print(f"Success: {endpoint} fetched")
        return data
    except requests.exceptions.Timeout:
        print(f"Error: Timeout after 30 seconds for {url}")
        sys.exit(1)
    except requests.exceptions.HTTPError as e:
        print(f"HTTP Error: {e} (Status: {response.status_code})")
        print(f"Response: {response.text}")
        sys.exit(1)
    except requests.exceptions.RequestException as e:
        print(f"Request Error: {e}")
        sys.exit(1)

# Initialize the Bible structure
bible_structure = {"books": []}

# Step 1: Fetch all books
print("Fetching all books...")
books = fetch_data('books')
print(f"Found {len(books)} books")

# Step 2: Process each book
for book in books:
    book_id = book['id']      # e.g., "GEN"
    book_name = book['name']  # e.g., "Genesis"
    print(f"\nProcessing {book_name} ({book_id})")
    
    # Step 3: Fetch chapters for the book
    chapters = fetch_data(f'books/{book_id}/chapters')
    chapter_count = len(chapters) - 1  # Exclude introduction chapter if present
    print(f"Found {chapter_count} chapters")
    
    # Step 4: Fetch verse counts for each chapter
    verse_counts = []
    for chapter in chapters[1:]:  # Skip introduction chapter
        chapter_id = chapter['id']  # e.g., "GEN.1"
        chapter_details = fetch_data(f'chapters/{chapter_id}')
        verse_counts.append(chapter_details['verseCount'])
        time.sleep(0.5)  # Rate limiting: 0.5-second delay between requests
    
    # Step 5: Add book data to the structure
    bible_structure["books"].append({
        "id": book_id,
        "name": book_name,
        "chapters": chapter_count,
        "verses": verse_counts
    })
    print(f"Completed {book_name}")

# Step 6: Save to a JSON file
with open('bibleStructure.json', 'w') as f:
    json.dump(bible_structure, f, indent=2)

print("\nBible structure saved to bibleStructure.json")