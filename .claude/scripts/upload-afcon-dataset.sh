#!/bin/bash
# Quick upload script for AFCON dataset to Hugging Face
# Usage: HF_TOKEN=hf_xxxxx ./upload-afcon-dataset.sh

set -e

if [ -z "$HF_TOKEN" ]; then
    echo "❌ Error: HF_TOKEN environment variable not set"
    echo ""
    echo "Usage:"
    echo "  HF_TOKEN=hf_xxxxx ./upload-afcon-dataset.sh"
    echo ""
    echo "Get your token from: https://huggingface.co/settings/tokens"
    exit 1
fi

echo "======================================================================"
echo "Upload AFCON Dataset to Hugging Face"
echo "======================================================================"
echo ""

# Activate virtual environment
source /tmp/hf-upload-env/bin/activate

# Run Python upload
python3 << 'PYCODE'
import json
import os
from datasets import Dataset
from huggingface_hub import HfApi, login

TRAINING_DATA_PATH = "/Users/omardoucoure/Documents/Afrique Sports/afriquesports-web/scripts/data-collection/data/afcon2025_training.jsonl"
DATASET_NAME = "afcon2025-commentary"
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
    formatted_data = {
        "messages": [item["messages"] for item in data]
    }
    dataset = Dataset.from_dict(formatted_data)
    return dataset

# Get token from environment
token = os.environ['HF_TOKEN']

print("Loading training data...")
data = load_jsonl_data(TRAINING_DATA_PATH)
print(f"✅ Loaded {len(data)} training examples")
print()

print("Creating Hugging Face dataset...")
dataset = create_dataset(data)
print(f"✅ Dataset created")
print()

# Show sample
print("Sample entry:")
print(f"  Messages: {len(dataset[0]['messages'])} messages")
print(f"  Roles: {[m['role'] for m in dataset[0]['messages']]}")
print()

# Login and upload
print(f"📤 Uploading dataset to Hugging Face Hub...")
print(f"   Name: {DATASET_NAME}")
print(f"   Samples: {len(dataset)}")
print()

login(token=token)
print("✅ Logged in to Hugging Face")
print()

# Upload
dataset.push_to_hub(
    DATASET_NAME,
    private=False,
    commit_message="Initial upload of AFCON 2025 training data"
)

print(f"✅ Dataset uploaded successfully!")
print()
print(f"📍 Dataset URL: https://huggingface.co/datasets/{DATASET_NAME}")
print()
print("Use this in RunPod fine-tuning form:")
print(f"   {DATASET_NAME}")
print()
PYCODE

echo ""
echo "======================================================================"
echo "✅ Upload complete!"
echo "======================================================================"
