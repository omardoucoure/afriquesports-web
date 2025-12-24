#!/usr/bin/env python3
"""
RunPod Fine-Tuning Script
Fine-tunes Llama 3.1 70B on African football commentary using Axolotl

Optimized for RunPod with 4x A100 80GB GPUs
Uses LoRA for efficient fine-tuning
"""

import os
import json
import subprocess
import logging
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class RunPodFineTuner:
    """Fine-tune Llama 3.1 70B for football commentary"""

    def __init__(self, training_data_path: str = "/workspace/training_data/training_data.jsonl"):
        self.training_data_path = Path(training_data_path)
        self.workspace = Path("/workspace")
        self.axolotl_dir = self.workspace / "axolotl"
        self.output_dir = self.workspace / "finetuned_model"

    def setup_environment(self):
        """Setup Axolotl and dependencies"""
        logger.info("=" * 70)
        logger.info("SETTING UP FINE-TUNING ENVIRONMENT")
        logger.info("=" * 70)

        # Check if Axolotl is installed
        if not self.axolotl_dir.exists():
            logger.info("📦 Installing Axolotl...")

            commands = [
                "cd /workspace",
                "git clone https://github.com/OpenAccess-AI-Collective/axolotl.git",
                "cd axolotl",
                "pip install packaging ninja",
                "pip install -e '.[flash-attn,deepspeed]'",
            ]

            for cmd in commands:
                logger.info(f"Running: {cmd}")
                subprocess.run(cmd, shell=True, check=True)
        else:
            logger.info("✅ Axolotl already installed")

        logger.info("✅ Environment setup complete\n")

    def create_axolotl_config(self) -> Path:
        """Create Axolotl configuration file"""
        logger.info("📝 Creating Axolotl configuration...")

        config = {
            # Base model
            "base_model": "meta-llama/Llama-3.1-70B-Instruct",
            "model_type": "LlamaForCausalLM",
            "tokenizer_type": "AutoTokenizer",

            # Dataset
            "datasets": [
                {
                    "path": str(self.training_data_path),
                    "type": "chat_template",
                    "chat_template": "llama3",
                    "field_messages": "messages",
                    "message_field_role": "role",
                    "message_field_content": "content",
                }
            ],

            # LoRA configuration
            "adapter": "lora",
            "lora_r": 32,
            "lora_alpha": 64,
            "lora_dropout": 0.05,
            "lora_target_linear": True,
            "lora_fan_in_fan_out": False,
            "lora_modules_to_save": ["embed_tokens", "lm_head"],

            # Training hyperparameters
            "sequence_len": 2048,
            "sample_packing": True,
            "pad_to_sequence_len": True,

            # Batch size and gradient accumulation
            "micro_batch_size": 2,
            "gradient_accumulation_steps": 4,
            "eval_batch_size": 2,

            # Learning rate and schedule
            "learning_rate": 2e-5,
            "lr_scheduler": "cosine",
            "num_epochs": 3,
            "warmup_steps": 100,

            # Optimizer
            "optimizer": "adamw_torch",
            "weight_decay": 0.01,
            "adam_beta1": 0.9,
            "adam_beta2": 0.95,
            "adam_epsilon": 1e-8,

            # Mixed precision
            "bf16": "auto",
            "fp16": False,
            "tf32": True,

            # DeepSpeed (for multi-GPU)
            "deepspeed": "/workspace/ds_config.json",

            # Gradient checkpointing
            "gradient_checkpointing": True,
            "gradient_checkpointing_kwargs": {
                "use_reentrant": False
            },

            # Logging and evaluation
            "logging_steps": 10,
            "eval_steps": 100,
            "save_steps": 100,
            "save_total_limit": 3,
            "output_dir": str(self.output_dir),

            # W&B (optional)
            "wandb_project": "afrique-sports-commentary",
            "wandb_entity": None,
            "wandb_run_id": None,
            "wandb_log_model": False,

            # Flash Attention
            "flash_attention": True,
            "sdp_attention": False,

            # Special tokens
            "special_tokens": {
                "pad_token": "<|end_of_text|>",
            },

            # Model saving
            "hub_model_id": None,
            "push_to_hub": False,
        }

        config_path = self.workspace / "axolotl_config.yml"

        # Convert to YAML format
        import yaml
        with open(config_path, 'w') as f:
            yaml.dump(config, f, default_flow_style=False)

        logger.info(f"✅ Configuration saved to {config_path}\n")
        return config_path

    def create_deepspeed_config(self) -> Path:
        """Create DeepSpeed configuration for multi-GPU training"""
        logger.info("⚙️  Creating DeepSpeed configuration...")

        ds_config = {
            "bf16": {
                "enabled": "auto"
            },
            "zero_optimization": {
                "stage": 2,
                "allgather_partitions": True,
                "allgather_bucket_size": 5e8,
                "reduce_scatter": True,
                "reduce_bucket_size": 5e8,
                "overlap_comm": True,
                "contiguous_gradients": True,
            },
            "gradient_accumulation_steps": "auto",
            "gradient_clipping": 1.0,
            "train_batch_size": "auto",
            "train_micro_batch_size_per_gpu": "auto",
        }

        ds_config_path = self.workspace / "ds_config.json"
        with open(ds_config_path, 'w') as f:
            json.dump(ds_config, f, indent=2)

        logger.info(f"✅ DeepSpeed config saved to {ds_config_path}\n")
        return ds_config_path

    def validate_training_data(self):
        """Validate training data format"""
        logger.info("🔍 Validating training data...")

        if not self.training_data_path.exists():
            raise FileNotFoundError(f"Training data not found at {self.training_data_path}")

        # Count examples
        example_count = 0
        with open(self.training_data_path, 'r') as f:
            for line in f:
                if line.strip():
                    example = json.loads(line)

                    # Validate format
                    assert "messages" in example, "Missing 'messages' field"
                    assert len(example["messages"]) == 3, "Expected 3 messages (system, user, assistant)"
                    assert example["messages"][0]["role"] == "system"
                    assert example["messages"][1]["role"] == "user"
                    assert example["messages"][2]["role"] == "assistant"

                    example_count += 1

        logger.info(f"✅ Training data validated: {example_count} examples\n")
        return example_count

    def run_finetuning(self, config_path: Path):
        """Run Axolotl fine-tuning"""
        logger.info("=" * 70)
        logger.info("STARTING FINE-TUNING")
        logger.info("=" * 70)
        logger.info("This will take several hours on 4x A100 GPUs...")
        logger.info("Monitor progress with: tail -f /workspace/finetuned_model/training.log\n")

        # Run Axolotl training
        cmd = f"cd {self.axolotl_dir} && accelerate launch -m axolotl.cli.train {config_path}"

        logger.info(f"Running: {cmd}\n")

        subprocess.run(cmd, shell=True, check=True)

        logger.info("\n✅ Fine-tuning complete!")

    def merge_and_export(self):
        """Merge LoRA weights and export to vLLM format"""
        logger.info("=" * 70)
        logger.info("MERGING LORA WEIGHTS")
        logger.info("=" * 70)

        # Merge LoRA adapters with base model
        cmd = f"""
        cd {self.axolotl_dir} && python -m axolotl.cli.merge_lora \\
            {self.workspace}/axolotl_config.yml \\
            --lora_model_dir={self.output_dir} \\
            --output_dir={self.workspace}/merged_model
        """

        logger.info("Merging LoRA weights with base model...")
        subprocess.run(cmd, shell=True, check=True)

        logger.info("✅ Model merged successfully\n")

        # Export for vLLM
        logger.info("=" * 70)
        logger.info("DEPLOYING TO VLLM")
        logger.info("=" * 70)

        merged_model_path = self.workspace / "merged_model"

        logger.info(f"Fine-tuned model ready at: {merged_model_path}")
        logger.info("\nTo deploy with vLLM:")
        logger.info(f"python -m vllm.entrypoints.openai.api_server \\")
        logger.info(f"    --model {merged_model_path} \\")
        logger.info(f"    --host 0.0.0.0 \\")
        logger.info(f"    --port 8000 \\")
        logger.info(f"    --tensor-parallel-size 4")

        logger.info("\n" + "=" * 70)
        logger.info("FINE-TUNING COMPLETE!")
        logger.info("=" * 70)

        return merged_model_path

    def run_full_pipeline(self):
        """Run the complete fine-tuning pipeline"""
        try:
            # Step 1: Setup environment
            self.setup_environment()

            # Step 2: Validate training data
            example_count = self.validate_training_data()

            if example_count < 500:
                logger.warning(f"⚠️  Warning: Only {example_count} examples. Consider collecting more data.")
                response = input("Continue anyway? (yes/no): ")
                if response.lower() != 'yes':
                    logger.info("Aborting fine-tuning.")
                    return

            # Step 3: Create configurations
            config_path = self.create_axolotl_config()
            ds_config_path = self.create_deepspeed_config()

            # Step 4: Run fine-tuning
            self.run_finetuning(config_path)

            # Step 5: Merge and export
            merged_model = self.merge_and_export()

            logger.info("\n🎉 Success! Your fine-tuned model is ready for production.")
            logger.info(f"Model path: {merged_model}")

        except Exception as e:
            logger.error(f"❌ Error during fine-tuning: {e}")
            import traceback
            traceback.print_exc()
            raise


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Fine-tune Llama 3.1 70B for football commentary')
    parser.add_argument(
        '--training-data',
        type=str,
        default='/workspace/training_data/training_data.jsonl',
        help='Path to training data JSONL file'
    )

    args = parser.parse_args()

    # Run fine-tuning
    finetuner = RunPodFineTuner(training_data_path=args.training_data)
    finetuner.run_full_pipeline()
