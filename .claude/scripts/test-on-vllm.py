#!/usr/bin/env python3
"""
Test fine-tuned model vs base model using vLLM API
"""

import requests
import json
from datetime import datetime

# Configuration
VLLM_BASE_URL = "http://213.173.107.186:37541/v1"  # Your vLLM server
BASE_MODEL = "Qwen/Qwen2.5-VL-7B-Instruct"

# Test match scenario - Full match events
MATCH_EVENTS = [
    {"minute": "1'", "type": "kickoff", "team": "Tunisie vs Ghana"},
    {"minute": "5'", "type": "commentary", "team": "Tunisie"},
    {"minute": "12'", "type": "chance", "team": "Ghana"},
    {"minute": "18'", "type": "commentary", "team": "Tunisie"},
    {"minute": "23'", "type": "goal", "team": "Tunisie", "scorer": "Hannibal Mejbri"},
    {"minute": "28'", "type": "commentary", "team": "Ghana"},
    {"minute": "35'", "type": "chance", "team": "Ghana"},
    {"minute": "42'", "type": "commentary", "team": "Tunisie"},
    {"minute": "45'", "type": "halftime", "team": "Tunisie vs Ghana"},
    {"minute": "46'", "type": "kickoff", "team": "Second Half"},
    {"minute": "52'", "type": "commentary", "team": "Ghana"},
    {"minute": "58'", "type": "substitution", "team": "Tunisie"},
    {"minute": "65'", "type": "goal", "team": "Ghana", "scorer": "Mohammed Kudus"},
    {"minute": "72'", "type": "commentary", "team": "Tunisie"},
    {"minute": "78'", "type": "commentary", "team": "Ghana"},
    {"minute": "85'", "type": "chance", "team": "Tunisie"},
    {"minute": "90'", "type": "fulltime", "team": "Tunisie vs Ghana"},
]

def create_prompt(event):
    """Create prompt for commentary generation"""
    return f"Génère un commentaire pour: Minute {event['minute']} - {event['type']} - {event['team']}"

def generate_with_vllm(prompt, model_name=BASE_MODEL, use_adapter=False):
    """Generate commentary using vLLM API"""
    messages = [
        {
            "role": "system",
            "content": "Tu es un commentateur sportif professionnel pour Afrique Sports. Tu génères des commentaires de match de la CAN 2025 en français, avec un style vivant, précis et engageant, similaire à L'Équipe et RMC Sport."
        },
        {
            "role": "user",
            "content": prompt
        }
    ]

    payload = {
        "model": model_name,
        "messages": messages,
        "max_tokens": 150,
        "temperature": 0.7,
        "top_p": 0.9,
        "repetition_penalty": 1.1
    }

    # Add adapter if specified
    if use_adapter:
        payload["lora_path"] = "/workspace/fine-tuning/outputs/afrique-v1"

    try:
        response = requests.post(
            f"{VLLM_BASE_URL}/chat/completions",
            json=payload,
            timeout=30
        )
        response.raise_for_status()
        result = response.json()
        return result['choices'][0]['message']['content']
    except Exception as e:
        return f"Error: {str(e)}"

def main():
    print("=" * 80)
    print("AFCON 2025 Commentary - Base Model vs Fine-Tuned Model Comparison")
    print("=" * 80)
    print(f"vLLM Server: {VLLM_BASE_URL}")
    print(f"Base Model: {BASE_MODEL}")
    print("=" * 80)
    print()

    # Test vLLM connection
    print("Testing vLLM server connection...")
    try:
        response = requests.get(f"{VLLM_BASE_URL}/models", timeout=5)
        if response.status_code == 200:
            print("✅ vLLM server is running")
        else:
            print(f"⚠️ vLLM server returned status {response.status_code}")
    except Exception as e:
        print(f"❌ Cannot connect to vLLM server: {e}")
        print("Make sure vLLM is running on RunPod")
        return

    results = {
        "test_date": datetime.now().isoformat(),
        "base_model": BASE_MODEL,
        "vllm_server": VLLM_BASE_URL,
        "events": []
    }

    # Test each event
    for i, event in enumerate(MATCH_EVENTS, 1):
        print(f"\n{'=' * 80}")
        print(f"Event {i}/{len(MATCH_EVENTS)}: {event['minute']} - {event['type']}")
        print(f"{'=' * 80}")

        prompt = create_prompt(event)
        print(f"\nPrompt: {prompt}")
        print()

        # Base model
        print("🔵 BASE MODEL:")
        base_commentary = generate_with_vllm(prompt, use_adapter=False)
        print(base_commentary)
        print()

        # Fine-tuned model
        print("🟢 FINE-TUNED MODEL (with LoRA):")
        finetuned_commentary = generate_with_vllm(prompt, use_adapter=True)
        print(finetuned_commentary)
        print()

        # Store results
        results["events"].append({
            "minute": event["minute"],
            "type": event["type"],
            "team": event["team"],
            "prompt": prompt,
            "base_commentary": base_commentary,
            "finetuned_commentary": finetuned_commentary
        })

    # Save results
    output_file = "/Users/omardoucoure/Documents/Afrique Sports/afriquesports-web/.claude/results/model-comparison.json"
    import os
    os.makedirs(os.path.dirname(output_file), exist_ok=True)

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 80)
    print("✅ Test completed!")
    print(f"Results saved to: {output_file}")
    print("=" * 80)

    # Print summary
    print("\n" + "=" * 80)
    print("SUMMARY COMPARISON")
    print("=" * 80)

    for i, result in enumerate(results["events"], 1):
        print(f"\n{i}. {result['minute']} - {result['type']}")
        print(f"   Base: {result['base_commentary'][:100]}...")
        print(f"   Fine-tuned: {result['finetuned_commentary'][:100]}...")

if __name__ == "__main__":
    main()
