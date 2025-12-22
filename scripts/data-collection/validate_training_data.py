#!/usr/bin/env python3
"""
Validate Mistral training data format
Ensures JSONL is ready for Colab
"""

import json
import sys
from pathlib import Path

def validate_jsonl(file_path: str):
    """Validate training data format"""

    print(f"📂 Validating: {file_path}\n")
    print("="*70)

    errors = []
    examples = []

    with open(file_path, 'r', encoding='utf-8') as f:
        for i, line in enumerate(f, 1):
            try:
                example = json.loads(line)
                examples.append(example)

                # Check required fields
                if 'messages' not in example:
                    errors.append(f"Line {i}: Missing 'messages' field")
                    continue

                messages = example['messages']

                # Check message structure
                if len(messages) != 3:
                    errors.append(f"Line {i}: Expected 3 messages, got {len(messages)}")

                # Check roles
                expected_roles = ['system', 'user', 'assistant']
                actual_roles = [m['role'] for m in messages]

                if actual_roles != expected_roles:
                    errors.append(f"Line {i}: Roles {actual_roles} != {expected_roles}")

                # Check content exists
                for j, msg in enumerate(messages):
                    if 'content' not in msg or not msg['content']:
                        errors.append(f"Line {i}, message {j}: Empty content")

            except json.JSONDecodeError as e:
                errors.append(f"Line {i}: Invalid JSON - {e}")

    # Print results
    print(f"\n✅ VALIDATION RESULTS")
    print("="*70)
    print(f"Total examples: {len(examples)}")
    print(f"Errors found: {len(errors)}")

    if errors:
        print(f"\n❌ ERRORS:")
        for error in errors[:10]:  # Show first 10
            print(f"   {error}")
        if len(errors) > 10:
            print(f"   ... and {len(errors) - 10} more")
        return False

    # Show statistics
    print(f"\n📊 STATISTICS:")

    system_lengths = [len(ex['messages'][0]['content']) for ex in examples]
    user_lengths = [len(ex['messages'][1]['content']) for ex in examples]
    assistant_lengths = [len(ex['messages'][2]['content']) for ex in examples]

    print(f"   System message avg length: {sum(system_lengths) / len(system_lengths):.1f} chars")
    print(f"   User prompt avg length: {sum(user_lengths) / len(user_lengths):.1f} chars")
    print(f"   Assistant response avg length: {sum(assistant_lengths) / len(assistant_lengths):.1f} chars")

    # Show sample
    print(f"\n📝 SAMPLE EXAMPLE:")
    print("-"*70)
    sample = examples[5]
    print(f"System: {sample['messages'][0]['content'][:100]}...")
    print(f"\nUser: {sample['messages'][1]['content']}")
    print(f"\nAssistant: {sample['messages'][2]['content']}")
    print("-"*70)

    # File size
    file_size = Path(file_path).stat().st_size / 1024
    print(f"\n💾 FILE INFO:")
    print(f"   Size: {file_size:.1f} KB")
    print(f"   Ready for upload to Colab: {'✅ YES' if file_size < 500 else '⚠️  Large file'}")

    print("\n" + "="*70)
    print("✅ VALIDATION PASSED - Ready for fine-tuning!")
    print("="*70)

    return True


if __name__ == '__main__':
    file_path = sys.argv[1] if len(sys.argv) > 1 else 'data/mistral_training.jsonl'

    if not Path(file_path).exists():
        print(f"❌ File not found: {file_path}")
        sys.exit(1)

    success = validate_jsonl(file_path)
    sys.exit(0 if success else 1)
