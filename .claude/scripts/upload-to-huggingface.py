#!/usr/bin/env python3
"""
Upload AFCON training dataset to Hugging Face
"""

import json
from datasets import Dataset
from huggingface_hub import HfApi, login
import os

# Configuration
TRAINING_DATA_PATH = "/Users/omardoucoure/Documents/Afrique Sports/afriquesports-web/scripts/data-collection/data/afcon2025_training.jsonl"
DATASET_NAME = "afcon2025-commentary"  # Will create: <your-username>/afcon2025-commentary
DESCRIPTION = "AFCON 2025 match commentary training data for fine-tuning LLMs (2,000 French examples)"

def load_jsonl_data(file_path):
    """Load JSONL training data"""
    data = []
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            data.append(json.loads(line))
    return data

def create_dataset(data):
    """Convert to Hugging Face Dataset format"""
    # Extract fields
    formatted_data = {
        "messages": [item["messages"] for item in data]
    }

    dataset = Dataset.from_dict(formatted_data)
    return dataset

def upload_to_hub(dataset, dataset_name, token):
    """Upload dataset to Hugging Face Hub"""
    print(f"📤 Uploading dataset to Hugging Face Hub...")
    print(f"   Name: {dataset_name}")
    print(f"   Samples: {len(dataset)}")
    print()

    # Login
    login(token=token)
    print("✅ Logged in to Hugging Face")

    # Upload
    dataset.push_to_hub(
        dataset_name,
        private=False,  # Set to True if you want it private
        commit_message="Initial upload of AFCON 2025 training data"
    )

    print(f"✅ Dataset uploaded successfully!")
    print()
    print(f"📍 Dataset URL: https://huggingface.co/datasets/{dataset_name}")
    print()
    print("Use this URL in the RunPod fine-tuning form:")
    print(f"   {dataset_name}")
    print()

def main():
    print("=" * 70)
    print("Upload AFCON Dataset to Hugging Face")
    print("=" * 70)
    print()

    # Get HF token
    token = input("Enter your Hugging Face token (hf_...): ").strip()

    if not token.startswith("hf_"):
        print("❌ Invalid token format. Should start with 'hf_'")
        return

    print()
    print("Loading training data...")
    data = load_jsonl_data(TRAINING_DATA_PATH)
    print(f"✅ Loaded {len(data)} training examples")

    print()
    print("Creating Hugging Face dataset...")
    dataset = create_dataset(data)
    print(f"✅ Dataset created")

    # Show sample
    print()
    print("Sample entry:")
    print(f"  Messages: {len(dataset[0]['messages'])} messages")
    print(f"  Roles: {[m['role'] for m in dataset[0]['messages']]}")
    print()

    # Confirm upload
    confirm = input(f"Upload to 'https://huggingface.co/datasets/{DATASET_NAME}'? (yes/no): ").strip().lower()

    if confirm == "yes":
        upload_to_hub(dataset, DATASET_NAME, token)
    else:
        print("Upload cancelled")

if __name__ == "__main__":
    main()
