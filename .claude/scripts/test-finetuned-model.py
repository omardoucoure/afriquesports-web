#!/usr/bin/env python3
"""
Compare base model vs fine-tuned model on AFCON match commentary
"""

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel
import json
from datetime import datetime

# Configuration
BASE_MODEL = "Qwen/Qwen2.5-VL-7B-Instruct"
ADAPTER_PATH = "/Users/omardoucoure/Documents/Afrique Sports/afriquesports-web/.claude/models/afrique-v1"

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

def generate_commentary(model, tokenizer, prompt, model_type="base"):
    """Generate commentary with model"""
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

    # Tokenize
    text = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True
    )

    inputs = tokenizer(text, return_tensors="pt").to(model.device)

    # Generate
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=150,
            do_sample=True,
            temperature=0.7,
            top_p=0.9,
            repetition_penalty=1.1
        )

    # Decode
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)

    # Extract assistant response
    if "<|im_start|>assistant" in response:
        response = response.split("<|im_start|>assistant")[-1].strip()

    return response

def main():
    print("=" * 80)
    print("AFCON 2025 Commentary - Base Model vs Fine-Tuned Model Comparison")
    print("=" * 80)
    print()

    # Load tokenizer
    print("Loading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, trust_remote_code=True)
    print("✅ Tokenizer loaded")
    print()

    # Load base model
    print("Loading base model (Qwen 2.5 VL 7B)...")
    base_model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        torch_dtype=torch.bfloat16,
        device_map="auto",
        trust_remote_code=True
    )
    print("✅ Base model loaded")
    print()

    # Load fine-tuned model
    print("Loading fine-tuned model (with LoRA adapter)...")
    finetuned_model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        torch_dtype=torch.bfloat16,
        device_map="auto",
        trust_remote_code=True
    )
    finetuned_model = PeftModel.from_pretrained(finetuned_model, ADAPTER_PATH)
    finetuned_model = finetuned_model.merge_and_unload()  # Merge for faster inference
    print("✅ Fine-tuned model loaded")
    print()

    results = {
        "test_date": datetime.now().isoformat(),
        "base_model": BASE_MODEL,
        "adapter_path": ADAPTER_PATH,
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
        base_commentary = generate_commentary(base_model, tokenizer, prompt, "base")
        print(base_commentary)
        print()

        # Fine-tuned model
        print("🟢 FINE-TUNED MODEL:")
        finetuned_commentary = generate_commentary(finetuned_model, tokenizer, prompt, "finetuned")
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

if __name__ == "__main__":
    main()
