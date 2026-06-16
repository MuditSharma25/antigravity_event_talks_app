import time
import requests
import feedparser
import re
from flask import Flask, jsonify, render_template

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
CACHE_TTL = 30  # seconds cache to prevent feed rate limits
cache = {
    "data": None,
    "last_fetched": 0
}

def parse_entry_summary(entry_title, entry_link, summary_html):
    # Find all h3 tags and split content between them
    matches = list(re.finditer(r'<h3>([^<]+)</h3>', summary_html))
    updates = []
    
    if not matches:
        # If no h3 headings exist, return the summary as a single update
        updates.append({
            "date": entry_title,
            "type": "Update",
            "content": summary_html,
            "link": entry_link
        })
        return updates
        
    for idx, match in enumerate(matches):
        update_type = match.group(1).strip()
        start_pos = match.end()
        end_pos = matches[idx+1].start() if idx + 1 < len(matches) else len(summary_html)
        content = summary_html[start_pos:end_pos].strip()
        
        updates.append({
            "date": entry_title,
            "type": update_type,
            "content": content,
            "link": entry_link
        })
        
    return updates

def fetch_and_parse_feed():
    now = time.time()
    if cache["data"] and (now - cache["last_fetched"] < CACHE_TTL):
        return cache["data"]
        
    # Fetch feed content from Google Cloud docs
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    response = requests.get(FEED_URL, headers=headers, timeout=15)
    response.raise_for_status()
    
    # Parse RSS/Atom feed using feedparser
    feed = feedparser.parse(response.content)
    
    all_updates = []
    for index, entry in enumerate(feed.entries):
        entry_updates = parse_entry_summary(entry.title, entry.link, entry.get('summary', ''))
        for sub_index, up in enumerate(entry_updates):
            # Create a unique ID
            up["id"] = f"{index}_{sub_index}"
            all_updates.append(up)
            
    cache["data"] = all_updates
    cache["last_fetched"] = now
    return all_updates

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    try:
        updates = fetch_and_parse_feed()
        return jsonify({
            "status": "success",
            "updates": updates
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    # Running local server
    app.run(debug=True, port=5000)
