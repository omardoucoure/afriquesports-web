#!/usr/bin/env python3
"""
Flask web app for manual review of scraped commentary
Keyboard shortcuts: A (approve), R (reject), E (edit), N (next batch)
Target: 90%+ approval rate
"""

from flask import Flask, render_template, request, jsonify
import json
import os
from datetime import datetime
from typing import List, Dict
from quality_filter import is_quality_commentary, calculate_quality_metrics

app = Flask(__name__)

# Configuration
DATA_DIR = 'scripts/data-collection/data'
REVIEW_STATE_FILE = os.path.join(DATA_DIR, 'review_state.json')
APPROVED_FILE = os.path.join(DATA_DIR, 'approved_commentary.json')
REJECTED_FILE = os.path.join(DATA_DIR, 'rejected_commentary.json')

# In-memory state
review_state = {
    'current_index': 0,
    'approved_count': 0,
    'rejected_count': 0,
    'edited_count': 0,
    'commentary_list': []
}


def load_review_state():
    """Load review state from disk"""
    global review_state

    if os.path.exists(REVIEW_STATE_FILE):
        with open(REVIEW_STATE_FILE, 'r', encoding='utf-8') as f:
            review_state = json.load(f)
    else:
        review_state = {
            'current_index': 0,
            'approved_count': 0,
            'rejected_count': 0,
            'edited_count': 0,
            'commentary_list': []
        }


def save_review_state():
    """Save review state to disk"""
    with open(REVIEW_STATE_FILE, 'w', encoding='utf-8') as f:
        json.dump(review_state, f, ensure_ascii=False, indent=2)


def append_to_file(file_path: str, entry: Dict):
    """Append an entry to a JSON file"""
    entries = []

    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            entries = json.load(f)

    entries.append(entry)

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)


@app.route('/')
def index():
    """Home page with statistics"""
    total = len(review_state['commentary_list'])
    reviewed = review_state['current_index']
    remaining = total - reviewed

    approval_rate = (
        review_state['approved_count'] / reviewed
        if reviewed > 0 else 0
    )

    stats = {
        'total': total,
        'reviewed': reviewed,
        'remaining': remaining,
        'approved': review_state['approved_count'],
        'rejected': review_state['rejected_count'],
        'edited': review_state['edited_count'],
        'approval_rate': f"{approval_rate:.1%}",
        'progress': f"{reviewed / total * 100:.1f}%" if total > 0 else "0%"
    }

    return render_template('index.html', stats=stats)


@app.route('/review')
def review():
    """Review interface"""
    load_review_state()

    current_idx = review_state['current_index']
    commentary_list = review_state['commentary_list']

    if current_idx >= len(commentary_list):
        return render_template('completed.html')

    # Get current batch (show 1 at a time, but prepare next 5 for quick navigation)
    batch = commentary_list[current_idx:min(current_idx + 5, len(commentary_list))]

    current = batch[0] if batch else None

    if current:
        # Run quality check
        current['auto_quality_check'] = is_quality_commentary(current)

    stats = {
        'current_index': current_idx + 1,
        'total': len(commentary_list),
        'approved': review_state['approved_count'],
        'rejected': review_state['rejected_count'],
        'approval_rate': f"{review_state['approved_count'] / max(current_idx, 1) * 100:.1f}%"
    }

    return render_template('review.html', current=current, stats=stats, batch=batch)


@app.route('/api/approve', methods=['POST'])
def approve():
    """Approve current commentary"""
    data = request.json
    index = data.get('index', review_state['current_index'])

    if index < len(review_state['commentary_list']):
        entry = review_state['commentary_list'][index]
        entry['reviewed_at'] = datetime.utcnow().isoformat()
        entry['status'] = 'approved'

        append_to_file(APPROVED_FILE, entry)

        review_state['approved_count'] += 1
        review_state['current_index'] = index + 1
        save_review_state()

        return jsonify({'success': True, 'next_index': review_state['current_index']})

    return jsonify({'success': False, 'error': 'Invalid index'})


@app.route('/api/reject', methods=['POST'])
def reject():
    """Reject current commentary"""
    data = request.json
    index = data.get('index', review_state['current_index'])
    reason = data.get('reason', 'Quality issues')

    if index < len(review_state['commentary_list']):
        entry = review_state['commentary_list'][index]
        entry['reviewed_at'] = datetime.utcnow().isoformat()
        entry['status'] = 'rejected'
        entry['rejection_reason'] = reason

        append_to_file(REJECTED_FILE, entry)

        review_state['rejected_count'] += 1
        review_state['current_index'] = index + 1
        save_review_state()

        return jsonify({'success': True, 'next_index': review_state['current_index']})

    return jsonify({'success': False, 'error': 'Invalid index'})


@app.route('/api/edit', methods=['POST'])
def edit():
    """Edit and approve commentary"""
    data = request.json
    index = data.get('index', review_state['current_index'])
    edited_text = data.get('text', '')

    if index < len(review_state['commentary_list']) and edited_text:
        entry = review_state['commentary_list'][index].copy()
        entry['text'] = edited_text
        entry['reviewed_at'] = datetime.utcnow().isoformat()
        entry['status'] = 'edited'
        entry['original_text'] = review_state['commentary_list'][index]['text']

        append_to_file(APPROVED_FILE, entry)

        review_state['approved_count'] += 1
        review_state['edited_count'] += 1
        review_state['current_index'] = index + 1
        save_review_state()

        return jsonify({'success': True, 'next_index': review_state['current_index']})

    return jsonify({'success': False, 'error': 'Invalid input'})


@app.route('/api/load_data', methods=['POST'])
def load_data():
    """Load commentary data from a JSON file"""
    data = request.json
    file_path = data.get('file_path')

    if not file_path or not os.path.exists(file_path):
        return jsonify({'success': False, 'error': 'File not found'})

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            commentary_list = json.load(f)

        review_state['commentary_list'] = commentary_list
        review_state['current_index'] = 0
        save_review_state()

        return jsonify({
            'success': True,
            'loaded': len(commentary_list),
            'message': f'Loaded {len(commentary_list)} commentary entries'
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/stats')
def stats():
    """Get current review statistics"""
    total = len(review_state['commentary_list'])
    reviewed = review_state['current_index']

    approval_rate = (
        review_state['approved_count'] / reviewed
        if reviewed > 0 else 0
    )

    # Calculate quality metrics for approved commentary
    approved_metrics = {}
    if os.path.exists(APPROVED_FILE):
        with open(APPROVED_FILE, 'r', encoding='utf-8') as f:
            approved_list = json.load(f)
            if approved_list:
                approved_metrics = calculate_quality_metrics(approved_list)

    return jsonify({
        'total': total,
        'reviewed': reviewed,
        'remaining': total - reviewed,
        'approved': review_state['approved_count'],
        'rejected': review_state['rejected_count'],
        'edited': review_state['edited_count'],
        'approval_rate': approval_rate,
        'approved_metrics': approved_metrics
    })


@app.route('/api/export_approved', methods=['GET'])
def export_approved():
    """Export approved commentary to JSONL format for training"""
    if not os.path.exists(APPROVED_FILE):
        return jsonify({'success': False, 'error': 'No approved commentary found'})

    with open(APPROVED_FILE, 'r', encoding='utf-8') as f:
        approved_list = json.load(f)

    # Convert to Mistral chat format
    jsonl_output = os.path.join(DATA_DIR, 'commentary_training.jsonl')

    with open(jsonl_output, 'w', encoding='utf-8') as f:
        for entry in approved_list:
            training_example = {
                "messages": [
                    {
                        "role": "system",
                        "content": "Tu es un commentateur sportif professionnel pour L'Équipe."
                    },
                    {
                        "role": "user",
                        "content": f"Génère un commentaire pour: Minute {entry['time']} - {entry.get('event_type', 'commentary')}"
                    },
                    {
                        "role": "assistant",
                        "content": entry['text']
                    }
                ]
            }
            f.write(json.dumps(training_example, ensure_ascii=False) + '\n')

    return jsonify({
        'success': True,
        'file': jsonl_output,
        'count': len(approved_list),
        'message': f'Exported {len(approved_list)} examples to {jsonl_output}'
    })


if __name__ == '__main__':
    # Create data directory if it doesn't exist
    os.makedirs(DATA_DIR, exist_ok=True)

    # Load existing state
    load_review_state()

    print("\n" + "=" * 70)
    print("📝 COMMENTARY REVIEW APP")
    print("=" * 70)
    print("\nKeyboard shortcuts:")
    print("  A - Approve")
    print("  R - Reject")
    print("  E - Edit")
    print("  N - Next batch")
    print("\nStarting Flask server at http://localhost:5000")
    print("=" * 70 + "\n")

    app.run(debug=True, host='0.0.0.0', port=5000)
