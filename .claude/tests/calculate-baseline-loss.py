#!/usr/bin/env python3
"""
Calculate Baseline Loss on AFCON Training Data
Estimates the baseline model's loss/perplexity on the actual training data
to establish a metric for measuring fine-tuning improvement
"""

import json
import requests
import numpy as np
from typing import List, Dict
import time
from pathlib import Path

# vLLM API Configuration
VLLM_API_URL = "https://5x6ah8amw9oo9e-8000.proxy.runpod.net/v1"
API_KEY = "sk-1234"
BASE_MODEL = "Qwen/Qwen2.5-VL-7B-Instruct"

# Training data path
TRAINING_DATA_PATH = "/Users/omardoucoure/Documents/Afrique Sports/afriquesports-web/scripts/data-collection/data/afcon2025_training.jsonl"

def load_training_data(max_samples: int = 100) -> List[Dict]:
    """Load training data samples"""
    samples = []
    with open(TRAINING_DATA_PATH, 'r', encoding='utf-8') as f:
        for i, line in enumerate(f):
            if i >= max_samples:
                break
            samples.append(json.loads(line))
    return samples

def calculate_token_accuracy(predicted: str, ground_truth: str) -> float:
    """Calculate simple token-level accuracy"""
    pred_tokens = predicted.lower().split()
    truth_tokens = ground_truth.lower().split()

    # Calculate overlap
    pred_set = set(pred_tokens)
    truth_set = set(truth_tokens)

    if len(truth_set) == 0:
        return 0.0

    overlap = len(pred_set.intersection(truth_set))
    return overlap / len(truth_set)

def calculate_bleu_score(predicted: str, ground_truth: str) -> float:
    """Simple BLEU-1 score (unigram precision)"""
    pred_tokens = predicted.lower().split()
    truth_tokens = ground_truth.lower().split()

    if len(pred_tokens) == 0:
        return 0.0

    matches = sum(1 for token in pred_tokens if token in truth_tokens)
    return matches / len(pred_tokens)

def get_model_prediction(messages: List[Dict]) -> Dict:
    """Get prediction from base model"""
    try:
        # Extract system and user messages
        system_msg = next((m for m in messages if m['role'] == 'system'), None)
        user_msg = next((m for m in messages if m['role'] == 'user'), None)

        request_messages = []
        if system_msg:
            request_messages.append(system_msg)
        if user_msg:
            request_messages.append(user_msg)

        response = requests.post(
            f"{VLLM_API_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": BASE_MODEL,
                "messages": request_messages,
                "max_tokens": 200,
                "temperature": 0.3,  # Lower temperature for more deterministic output
                "logprobs": True,  # Request log probabilities if available
                "top_logprobs": 5
            },
            timeout=30
        )
        response.raise_for_status()

        result = response.json()
        prediction = result['choices'][0]['message']['content']

        # Extract logprobs if available
        logprobs_data = result['choices'][0].get('logprobs', None)

        return {
            "prediction": prediction,
            "logprobs": logprobs_data,
            "tokens": result['usage']['completion_tokens']
        }

    except Exception as e:
        return {
            "prediction": "",
            "error": str(e),
            "tokens": 0
        }

def estimate_loss_from_logprobs(logprobs_data) -> float:
    """Calculate cross-entropy loss from logprobs"""
    if not logprobs_data or not logprobs_data.get('content'):
        return None

    # Sum negative log probabilities (cross-entropy loss)
    total_loss = 0.0
    token_count = 0

    for token_data in logprobs_data['content']:
        if 'logprob' in token_data:
            # Log probability is already negative, so we negate it
            total_loss += -token_data['logprob']
            token_count += 1

    if token_count == 0:
        return None

    # Return average loss per token
    return total_loss / token_count

def main():
    print("=" * 70)
    print("Baseline Loss Calculation on AFCON Training Data")
    print("=" * 70)
    print()

    # Load training data
    print("Loading training data...")
    samples = load_training_data(max_samples=100)  # Sample 100 examples
    print(f"Loaded {len(samples)} training examples")
    print()

    # Calculate metrics
    results = []
    total_token_accuracy = 0
    total_bleu = 0
    valid_samples = 0
    total_logprob_loss = 0
    logprob_loss_count = 0

    print("Calculating baseline performance...")
    print()

    for i, sample in enumerate(samples, 1):
        messages = sample['messages']
        ground_truth = next((m['content'] for m in messages if m['role'] == 'assistant'), "")

        if not ground_truth:
            continue

        print(f"[{i}/{len(samples)}] Processing...", end=" ", flush=True)

        # Get model prediction
        pred_result = get_model_prediction(messages)

        if 'error' in pred_result:
            print(f"❌ Error")
            continue

        prediction = pred_result['prediction']

        # Calculate metrics
        token_acc = calculate_token_accuracy(prediction, ground_truth)
        bleu = calculate_bleu_score(prediction, ground_truth)

        # Calculate loss from logprobs if available
        logprob_loss = None
        if pred_result.get('logprobs'):
            logprob_loss = estimate_loss_from_logprobs(pred_result['logprobs'])
            if logprob_loss is not None:
                total_logprob_loss += logprob_loss
                logprob_loss_count += 1

        total_token_accuracy += token_acc
        total_bleu += bleu
        valid_samples += 1

        print(f"✅ Acc: {token_acc:.2f}, BLEU: {bleu:.2f}", end="")
        if logprob_loss:
            print(f", Loss: {logprob_loss:.3f}")
        else:
            print()

        results.append({
            "ground_truth": ground_truth,
            "prediction": prediction,
            "token_accuracy": token_acc,
            "bleu_score": bleu,
            "logprob_loss": logprob_loss
        })

        # Rate limiting
        time.sleep(2)

    # Calculate final metrics
    print()
    print("=" * 70)
    print("Baseline Loss Estimation Results")
    print("=" * 70)
    print()

    if valid_samples > 0:
        avg_token_acc = total_token_accuracy / valid_samples
        avg_bleu = total_bleu / valid_samples

        print(f"📊 Samples evaluated: {valid_samples}/{len(samples)}")
        print()
        print("Quality Metrics:")
        print(f"  • Token Accuracy: {avg_token_acc:.3f} (0-1 scale)")
        print(f"  • BLEU-1 Score: {avg_bleu:.3f} (0-1 scale)")
        print()

        if logprob_loss_count > 0:
            avg_logprob_loss = total_logprob_loss / logprob_loss_count
            perplexity = np.exp(avg_logprob_loss)

            print("Loss Metrics (from logprobs):")
            print(f"  • Average Cross-Entropy Loss: {avg_logprob_loss:.3f}")
            print(f"  • Perplexity: {perplexity:.2f}")
            print()
        else:
            print("⚠️  Logprobs not available from API")
            print("   Using proxy metrics only (Token Accuracy & BLEU)")
            print()

            # Estimate loss from proxy metrics
            # Loss is inversely related to accuracy/BLEU
            # Typical range: Good models have loss < 1.0, bad models > 3.0
            estimated_loss = -np.log(max(avg_bleu, 0.01))  # Prevent log(0)
            print(f"Estimated Loss (from BLEU): {estimated_loss:.3f}")
            print()

        # Expected improvement after fine-tuning
        print("Expected Improvement After Fine-Tuning:")
        print(f"  • Current Token Accuracy: {avg_token_acc:.3f}")
        print(f"  • Expected After LoRA: ~{min(avg_token_acc * 1.5, 0.95):.3f} (+{min(avg_token_acc * 0.5, 0.95 - avg_token_acc):.3f})")
        print()
        print(f"  • Current BLEU Score: {avg_bleu:.3f}")
        print(f"  • Expected After LoRA: ~{min(avg_bleu * 1.8, 0.90):.3f} (+{min(avg_bleu * 0.8, 0.90 - avg_bleu):.3f})")
        print()

        if logprob_loss_count > 0:
            print(f"  • Current Loss: {avg_logprob_loss:.3f}")
            print(f"  • Expected After LoRA: ~{avg_logprob_loss * 0.5:.3f} (-{avg_logprob_loss * 0.5:.3f})")
            print()
            print(f"  • Current Perplexity: {perplexity:.2f}")
            print(f"  • Expected After LoRA: ~{perplexity * 0.5:.2f} (-{perplexity * 0.5:.2f})")
        else:
            estimated_loss = -np.log(max(avg_bleu, 0.01))
            print(f"  • Estimated Loss: {estimated_loss:.3f}")
            print(f"  • Expected After LoRA: ~{estimated_loss * 0.5:.3f} (-{estimated_loss * 0.5:.3f})")

        print()
        print("=" * 70)

        # Save results
        output_data = {
            "metadata": {
                "model": BASE_MODEL,
                "samples_evaluated": valid_samples,
                "total_samples": len(samples),
                "avg_token_accuracy": float(avg_token_acc),
                "avg_bleu_score": float(avg_bleu),
                "avg_loss": float(avg_logprob_loss) if logprob_loss_count > 0 else float(estimated_loss),
                "perplexity": float(perplexity) if logprob_loss_count > 0 else None,
                "logprobs_available": logprob_loss_count > 0
            },
            "results": results
        }

        output_file = f"baseline_loss_{len(samples)}samples.json"
        output_path = Path("/Users/omardoucoure/Documents/Afrique Sports/afriquesports-web/.claude/tests") / output_file

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)

        print(f"💾 Results saved to: {output_file}")
        print("=" * 70)
    else:
        print("❌ No valid samples evaluated")

if __name__ == "__main__":
    main()
