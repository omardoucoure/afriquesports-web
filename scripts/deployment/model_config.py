#!/usr/bin/env python3
"""
Configuration-driven model switching for zero-downtime deployment
Allows instant switching between llama3.1:8b and mistral-commentary
"""

import json
from typing import Literal
from datetime import datetime
from pathlib import Path

ModelName = Literal["llama3.1:8b", "mistral-commentary"]

class ModelConfig:
    """Zero-downtime model configuration"""

    CONFIG_PATH = Path("/root/afcon-agent-temp/config/models.json")

    @classmethod
    def get_active_model(cls) -> ModelName:
        """Read current model from config file"""
        if not cls.CONFIG_PATH.exists():
            # Default to llama3.1 if config doesn't exist
            return "llama3.1:8b"

        with open(cls.CONFIG_PATH) as f:
            config = json.load(f)
        return config.get("active_model", "llama3.1:8b")

    @classmethod
    def switch_model(cls, model_name: ModelName):
        """Instant model switch (< 30 seconds)"""
        cls.CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)

        # Read current config
        if cls.CONFIG_PATH.exists():
            with open(cls.CONFIG_PATH) as f:
                config = json.load(f)
        else:
            config = {}

        # Update with new model
        previous_model = config.get("active_model", "llama3.1:8b")
        config.update({
            "active_model": model_name,
            "switched_at": datetime.utcnow().isoformat(),
            "previous_model": previous_model
        })

        with open(cls.CONFIG_PATH, 'w') as f:
            json.dump(config, f, indent=2)

        print(f"✅ Switched from {previous_model} to {model_name}")

    @classmethod
    def get_model_params(cls, model_name: ModelName) -> dict:
        """Get model-specific parameters"""
        params = {
            "llama3.1:8b": {
                "temperature": 0.8,
                "top_p": 0.9,
                "top_k": 40,
                "repeat_penalty": 1.1,
                "num_predict": 120
            },
            "mistral-commentary": {
                "temperature": 0.9,
                "top_p": 0.95,
                "top_k": 50,
                "repeat_penalty": 1.15,
                "num_predict": 120
            }
        }
        return params.get(model_name, params["llama3.1:8b"])

    @classmethod
    def init_config(cls):
        """Initialize config file with default settings"""
        cls.CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)

        default_config = {
            "active_model": "llama3.1:8b",
            "models": {
                "llama3.1:8b": {
                    "temperature": 0.8,
                    "context_window": 2048
                },
                "mistral-commentary": {
                    "temperature": 0.9,
                    "context_window": 512
                }
            },
            "ab_test": {
                "enabled": False,
                "split_ratio": 0.5,
                "variant_model": "mistral-commentary"
            }
        }

        with open(cls.CONFIG_PATH, 'w') as f:
            json.dump(default_config, f, indent=2)

        print(f"✅ Config initialized at {cls.CONFIG_PATH}")


if __name__ == '__main__':
    import sys

    if len(sys.argv) < 2:
        print("Usage:")
        print("  python model_config.py init                    # Initialize config")
        print("  python model_config.py get                     # Get active model")
        print("  python model_config.py switch <model_name>     # Switch model")
        print("  python model_config.py params <model_name>     # Get model params")
        sys.exit(1)

    command = sys.argv[1]

    if command == "init":
        ModelConfig.init_config()
    elif command == "get":
        print(f"Active model: {ModelConfig.get_active_model()}")
    elif command == "switch":
        if len(sys.argv) < 3:
            print("Error: model_name required")
            sys.exit(1)
        ModelConfig.switch_model(sys.argv[2])
    elif command == "params":
        if len(sys.argv) < 3:
            print("Error: model_name required")
            sys.exit(1)
        params = ModelConfig.get_model_params(sys.argv[2])
        print(json.dumps(params, indent=2))
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
