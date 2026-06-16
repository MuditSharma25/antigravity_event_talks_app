# Antigravity Event Talks App Workspace

Welcome to the **Antigravity Event Talks App** workspace. This repository contains a collection of tools and web applications designed to streamline staying updated with technology feeds, specifically Google Cloud updates and news.

---

## 📁 Repository Structure

- **[bigquery-release-notes/](file:///D:/programs/Anitgravity/bigquery-release-notes/)**: A full-stack Flask web application that fetches, parses, and allows sharing of BigQuery release notes.
- **[google-news-cli/](file:///D:/programs/Anitgravity/google-news-cli/)**: A lightweight Node.js command-line interface (CLI) tool that fetches the top 5 latest news updates from Google.
- **[.gitignore](file:///D:/programs/Anitgravity/.gitignore)**: Global workspace configuration to exclude virtual environments, node modules, compiled binaries, and temporary editor settings from version control.

---

## 🚀 Projects Overview

### 1. BigQuery Release Hub (Web Application)
A responsive dashboard designed with a futuristic dark-theme cockpit aesthetic using glassmorphic cards and glowing status tags.

- **Tech Stack**: Python Flask, `feedparser`, plain vanilla HTML5, CSS3, and JavaScript.
- **Key Features**:
  - **Live Feed Parsing**: Fetches the Google Cloud BigQuery RSS feed and splits compound daily summaries into individual, filterable cards.
  - **Interactive Search & Filtering**: Instant, client-side search indexing and category filters (Features, Changed, Deprecated, Issues).
  - **Smart Tweet Composer**: A customized sidebar editor that strips HTML, handles Twitter's character truncation constraints (automatically sizing URLs as exactly 23 characters), provides toggle switches for details, and launches the X/Twitter Web Intent.
  - **Optimized Caching**: Server-side 30-second cache to prevent feed rate-limiting.
- **Run Instructions**:
  ```powershell
  cd bigquery-release-notes
  # Activate virtual environment and run the server
  .venv\Scripts\python.exe app.py
  ```
  Open **[http://127.0.0.1:5000](http://127.0.0.1:5000)** in your web browser.

---

### 2. Google News CLI (Command Line Tool)
A simple and efficient terminal utility for pulling real-time headlines.

- **Tech Stack**: Node.js, `https` module.
- **Key Features**:
  - Decodes RSS HTML entities into clean console text.
  - Fetches and displays the top 5 latest news updates with clickable links.
- **Run Instructions**:
  ```powershell
  cd google-news-cli
  node index.js
  ```

---

## 🛠️ Local Development & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+

### Setup Python Environment
To install package dependencies manually inside the `bigquery-release-notes` project:
```powershell
cd bigquery-release-notes
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
```
