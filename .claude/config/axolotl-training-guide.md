# Axolotl Training Guide - afrique-v1 LoRA Adapter

**Training**: AFCON 2025 Match Commentary
**Base Model**: Qwen/Qwen2.5-VL-7B-Instruct
**Method**: QLoRA (4-bit)
**GPU**: RTX A5000 24GB
**Estimated Time**: 2-3 hours
**Estimated Cost**: ~$0.45-0.50 (spot) or ~$0.81 (on-demand)

---

## Step 1: Pod Setup (While Creating)

**Recommended Settings:**
- **Template**: Axolotl (axolotlai/axolotl-cloud:main-latest)
- **GPU**: RTX A5000 24GB
- **Pod Type**: **SPOT** (50-70% cheaper, ~$0.15/hr)
- **Container Disk**: 20GB minimum
- **Volume Disk**: 40GB (persistent storage)
- **Expose HTTP/TCP Ports**: 8888 (for Jupyter, optional)

---

## Step 2: Connect to Your Pod

Once the pod is running, you'll have these options:

### Option A: Web Terminal (Easiest)
1. Click **"Connect"** button in RunPod console
2. Select **"Start Web Terminal"**
3. Terminal opens in browser ✅

### Option B: SSH (Recommended for file uploads)
1. Click **"Connect"** → Copy SSH command
2. Example: `ssh root@123.456.789.012 -p 12345 -i ~/.ssh/id_ed25519`
3. Run in your local terminal

---

## Step 3: Upload Training Data

### Method 1: Using SCP (from your local machine)

```bash
# From your local terminal (NOT in the pod)
# Replace with your actual SSH details from RunPod console

scp -P <PORT> -i ~/.ssh/id_ed25519 \
  "/Users/omardoucoure/Documents/Afrique Sports/afriquesports-web/scripts/data-collection/data/afcon2025_training.jsonl" \
  root@<POD_IP>:/workspace/afcon2025_training.jsonl

scp -P <PORT> -i ~/.ssh/id_ed25519 \
  "/Users/omardoucoure/Documents/Afrique Sports/afriquesports-web/.claude/config/axolotl-afrique-v1.yaml" \
  root@<POD_IP>:/workspace/axolotl-afrique-v1.yaml
```

### Method 2: Using RunPod File Upload
1. In RunPod console, click **"Files"** tab
2. Navigate to `/workspace`
3. Upload both files:
   - `afcon2025_training.jsonl`
   - `axolotl-afrique-v1.yaml`

### Method 3: Direct Download (if files are accessible online)
```bash
# In pod terminal
cd /workspace
wget <URL_TO_YOUR_TRAINING_DATA>
wget <URL_TO_YOUR_CONFIG>
```

---

## Step 4: Verify Setup (In Pod Terminal)

```bash
# Check if files are uploaded
ls -lh /workspace/

# Should see:
# - afcon2025_training.jsonl (~500KB-1MB)
# - axolotl-afrique-v1.yaml (~2KB)

# Check number of training examples
wc -l /workspace/afcon2025_training.jsonl
# Should show: 2000 lines

# Verify Axolotl is installed
axolotl version

# Check GPU
nvidia-smi
# Should show: RTX A5000 with ~24GB VRAM
```

---

## Step 5: Start Training 🚀

```bash
cd /workspace

# Run Axolotl training
accelerate launch -m axolotl.cli.train axolotl-afrique-v1.yaml

# Alternative (if above doesn't work):
python -m axolotl.cli.train axolotl-afrique-v1.yaml
```

**What You'll See:**
```
[INFO] Loading config: axolotl-afrique-v1.yaml
[INFO] Loading model: Qwen/Qwen2.5-VL-7B-Instruct
[INFO] Applying 4-bit quantization...
[INFO] Loading dataset: /workspace/afcon2025_training.jsonl
[INFO] Found 2000 training examples
[INFO] Validation split: 100 examples (5%)
[INFO] Configuring LoRA with r=64, alpha=128
[INFO] Trainable params: ~33M (0.47% of 7B)
[INFO] Starting training for 3 epochs...

Epoch 1/3:
  [====>                    ] 15% | Step 50/330 | Loss: 0.782 | LR: 0.0001 | ETA: 1h 45m
```

---

## Step 6: Monitor Training

### Watch Live Progress
```bash
# In another terminal tab/window, connect to pod and run:
tail -f /workspace/lora-adapters/afrique-v1/training.log
```

### Key Metrics to Watch:
- **Loss**: Should decrease from ~0.78 → ~0.40 (our baseline was 0.789)
- **Learning Rate**: Starts low, peaks, then decreases (cosine schedule)
- **ETA**: Total time ~2-3 hours for 3 epochs

### Expected Training Steps:
- **Total samples**: 1,900 (training) + 100 (validation)
- **Batch size**: 4 × 4 (gradient accumulation) = 16 effective
- **Steps per epoch**: ~119 steps
- **Total steps**: ~357 steps (3 epochs)
- **Checkpoints**: Saved every ~60 steps

---

## Step 7: Training Complete ✅

When training finishes, you'll see:

```
[INFO] Training complete!
[INFO] Final training loss: 0.412
[INFO] Final validation loss: 0.438
[INFO] Best checkpoint: checkpoint-300
[INFO] Adapter saved to: /workspace/lora-adapters/afrique-v1
```

### Verify Output Files

```bash
ls -lh /workspace/lora-adapters/afrique-v1/

# Should contain:
# - adapter_config.json
# - adapter_model.safetensors (or adapter_model.bin)
# - tokenizer files
# - checkpoint folders
```

---

## Step 8: Download Trained Adapter

### Method 1: SCP Download (Recommended)

```bash
# From your LOCAL machine (not in pod)
scp -P <PORT> -i ~/.ssh/id_ed25519 -r \
  root@<POD_IP>:/workspace/lora-adapters/afrique-v1 \
  "/Users/omardoucoure/Documents/Afrique Sports/afriquesports-web/.claude/models/"
```

### Method 2: RunPod File Manager
1. Go to **"Files"** tab in RunPod console
2. Navigate to `/workspace/lora-adapters/afrique-v1`
3. Select all files
4. Click **"Download"**

### Method 3: Upload to Hugging Face Hub (Optional)
```bash
# In pod terminal
huggingface-cli login
# Paste your HF token

# Upload adapter
cd /workspace/lora-adapters/afrique-v1
huggingface-cli upload <your-username>/afrique-v1-lora .
```

---

## Step 9: Test the Adapter

### Option A: Test on Training Pod (Quick Test)

```bash
# In pod terminal
cd /workspace

# Create test script
cat > test_adapter.py << 'EOF'
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
import torch

base_model = "Qwen/Qwen2.5-VL-7B-Instruct"
adapter_path = "/workspace/lora-adapters/afrique-v1"

print("Loading model...")
tokenizer = AutoTokenizer.from_pretrained(base_model, trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained(
    base_model,
    torch_dtype=torch.bfloat16,
    device_map="auto",
    trust_remote_code=True
)

print("Loading LoRA adapter...")
model = PeftModel.from_pretrained(model, adapter_path)
model.eval()

# Test prompt
messages = [
    {"role": "system", "content": "Tu es un commentateur sportif professionnel pour Afrique Sports couvrant la CAN 2025."},
    {"role": "user", "content": "Commente le but de Mohamed Salah à la 67ème minute."}
]

text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
inputs = tokenizer(text, return_tensors="pt").to(model.device)

print("\nGenerating commentary...\n")
outputs = model.generate(**inputs, max_new_tokens=150, temperature=0.7)
result = tokenizer.decode(outputs[0], skip_special_tokens=True)
print(result)
EOF

python test_adapter.py
```

### Option B: Test on vLLM Inference Pod (Production Test)

See next section for deploying to your vLLM pod.

---

## Step 10: Deploy to vLLM Inference Pod

### Copy Adapter to Inference Pod

**Option 1: Direct Copy (if same volume)**
```bash
# If both pods share /workspace volume
cp -r /workspace/lora-adapters/afrique-v1 /workspace/lora-adapters/
```

**Option 2: Download + Upload**
1. Download from training pod (Step 8)
2. Upload to inference pod via SCP:
```bash
scp -P <INFERENCE_POD_PORT> -i ~/.ssh/id_ed25519 -r \
  "/Users/omardoucoure/Documents/Afrique Sports/afriquesports-web/.claude/models/afrique-v1" \
  root@<INFERENCE_POD_IP>:/workspace/lora-adapters/afrique-v1
```

### Update vLLM Launch Parameters

Stop your inference pod and update the launch command to include:

```bash
--enable-lora \
--max-loras 4 \
--max-lora-rank 64 \
--lora-modules afrique-v1=/workspace/lora-adapters/afrique-v1
```

### Test via API

```bash
curl -X POST https://5x6ah8amw9oo9e-8000.proxy.runpod.net/v1/chat/completions \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "afrique-v1",
    "messages": [
      {"role": "system", "content": "Tu es un commentateur sportif professionnel pour Afrique Sports couvrant la CAN 2025."},
      {"role": "user", "content": "Commente le but de Mohamed Salah à la 67ème minute."}
    ],
    "max_tokens": 150
  }'
```

---

## Troubleshooting

### Issue: "CUDA out of memory"
**Solution**: Reduce batch size in config
```yaml
micro_batch_size: 2  # Instead of 4
gradient_accumulation_steps: 8  # Instead of 4
```

### Issue: "Model not found"
**Solution**: Check Hugging Face token
```bash
huggingface-cli login
# Paste your token
```

### Issue: Training stuck/frozen
**Solution**: Check GPU status
```bash
nvidia-smi
# If showing 0% utilization, restart training

# Kill stuck process
pkill -9 python
```

### Issue: "Dataset not found"
**Solution**: Verify file path
```bash
ls -lh /workspace/afcon2025_training.jsonl
# Make sure file exists and is readable
```

---

## Cost Management

### Save Money Tips:
1. ✅ Use **SPOT** instances (50-70% cheaper)
2. ✅ **Stop pod immediately** after downloading adapter
3. ✅ Use **volume storage** for large files (cheaper than container disk)
4. ✅ Delete pod once adapter is safely downloaded

### Expected Costs:
- **Training (3 hours, spot)**: ~$0.45
- **Training (3 hours, on-demand)**: ~$0.81
- **Storage (40GB volume, 1 month)**: ~$4.00
- **Total first month**: < $5

---

## Next Steps After Training

1. **Run comparison test** - Re-run match commentary baseline with fine-tuned model
2. **Calculate improvement** - Compare loss: 0.789 (baseline) vs new loss
3. **Generate comparison report** - Side-by-side commentary quality
4. **Deploy to production** - Integrate with afriquesports.net API

---

## Quick Reference Commands

```bash
# Start training
accelerate launch -m axolotl.cli.train axolotl-afrique-v1.yaml

# Monitor progress
tail -f /workspace/lora-adapters/afrique-v1/training.log

# Check GPU usage
watch -n 1 nvidia-smi

# Test adapter
python test_adapter.py

# Stop pod (save money!)
# Go to RunPod console → Click "Stop Pod"
```

---

**Need Help?** Check:
- Axolotl Docs: https://github.com/OpenAccess-AI-Collective/axolotl
- RunPod Docs: https://docs.runpod.io/fine-tune
- Config file: `/workspace/axolotl-afrique-v1.yaml`
