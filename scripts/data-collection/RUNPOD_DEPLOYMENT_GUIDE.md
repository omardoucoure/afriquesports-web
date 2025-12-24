# RunPod Deployment Guide - Afrique Sports Commentary Fine-Tuning

Complete guide to deploy data collection and fine-tuning scripts on your RunPod server.

## Server Information

- **Server IP**: http://194.68.245.75:8000/v1
- **Current Model**: Llama 3.1 70B (base)
- **Infrastructure**: RunPod with vLLM
- **GPUs**: 4x A100 80GB (recommended)

## Quick Start (SSH into RunPod)

### 1. SSH into your RunPod instance

```bash
# Get SSH command from RunPod dashboard
# Example:
ssh root@<your-runpod-instance>.runpod.io -p <port>
```

### 2. Upload scripts to RunPod

**Option A: Using scp (from your local machine)**

```bash
cd /Users/omardoucoure/Documents/Afrique\ Sports/afriquesports-web/scripts/data-collection

# Upload data collector
scp -P <port> runpod_data_collector.py root@<your-runpod-instance>.runpod.io:/workspace/

# Upload fine-tuner
scp -P <port> runpod_finetuner.py root@<your-runpod-instance>.runpod.io:/workspace/

# Or upload all at once
scp -P <port> runpod_*.py root@<your-runpod-instance>.runpod.io:/workspace/
```

**Option B: Clone from GitHub (if you push to repo)**

```bash
# On RunPod server
cd /workspace
git clone https://github.com/your-repo/afriquesports-web.git
cd afriquesports-web/scripts/data-collection
```

**Option C: Direct copy-paste (quick method)**

```bash
# On RunPod server
cd /workspace
nano runpod_data_collector.py
# Paste the entire script
# Save with Ctrl+X, Y, Enter

nano runpod_finetuner.py
# Paste the entire script
# Save with Ctrl+X, Y, Enter
```

### 3. Install Python dependencies

```bash
cd /workspace
pip install aiohttp beautifulsoup4 lxml pyyaml
```

### 4. Run data collection (1000+ matches)

```bash
# Collect 2000+ training examples from 1000 matches
python runpod_data_collector.py

# Monitor progress
tail -f /workspace/training_data/raw_commentary_progress.json
```

**Expected output:**
```
==================================================================
RUNPOD DATA COLLECTION - AFRIQUE SPORTS COMMENTARY
==================================================================
Target: 2000 high-quality French commentary examples
Max matches: 1000
==================================================================

📋 STEP 1: Discovering match URLs...
  Found 50 matches so far...
  Found 100 matches so far...
  ...
✅ Discovered 1000 unique match URLs

📝 STEP 2: Scraping commentary from matches...
[1/1000] Scraping https://www.lequipe.fr/Football/match-direct/can/2025/maroc-comores-live/670748...
  ✓ Extracted 45 entries
  💾 Progress saved: 45 total entries
[2/1000] Scraping https://www.lequipe.fr/Football/match-direct/can/2025/senegal-gambie-live/670749...
  ...
```

**This will take 30-60 minutes** to collect 2000+ examples from 1000 matches.

### 5. Run fine-tuning

```bash
# Start fine-tuning (will take 4-6 hours on 4x A100)
python runpod_finetuner.py

# Monitor training progress in another terminal
tail -f /workspace/finetuned_model/training.log
```

**Expected output:**
```
==================================================================
SETTING UP FINE-TUNING ENVIRONMENT
==================================================================
📦 Installing Axolotl...
✅ Environment setup complete

🔍 Validating training data...
✅ Training data validated: 2145 examples

📝 Creating Axolotl configuration...
✅ Configuration saved to /workspace/axolotl_config.yml

⚙️  Creating DeepSpeed configuration...
✅ DeepSpeed config saved to /workspace/ds_config.json

==================================================================
STARTING FINE-TUNING
==================================================================
This will take several hours on 4x A100 GPUs...

[Training logs will appear here...]
```

### 6. Deploy fine-tuned model

Once fine-tuning is complete:

```bash
# Stop current vLLM server (if running)
pkill -f "vllm.entrypoints.openai.api_server"

# Start vLLM with fine-tuned model
python -m vllm.entrypoints.openai.api_server \
    --model /workspace/merged_model \
    --host 0.0.0.0 \
    --port 8000 \
    --tensor-parallel-size 4

# Or run in background
nohup python -m vllm.entrypoints.openai.api_server \
    --model /workspace/merged_model \
    --host 0.0.0.0 \
    --port 8000 \
    --tensor-parallel-size 4 > /workspace/vllm.log 2>&1 &
```

### 7. Test fine-tuned model

```bash
# Test API endpoint
curl -X POST http://194.68.245.75:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "/workspace/merged_model",
    "messages": [
      {
        "role": "system",
        "content": "Tu es un commentateur sportif professionnel pour Afrique Sports."
      },
      {
        "role": "user",
        "content": "Génère un commentaire pour: Minute 45 - goal"
      }
    ],
    "max_tokens": 200,
    "temperature": 0.7
  }'
```

**Expected response:**
```json
{
  "id": "cmpl-...",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "/workspace/merged_model",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "But magnifique de Salah qui délivre une frappe enroulée du gauche! Le ballon vient se loger dans la lucarne opposée, le gardien n'a rien pu faire. L'Égypte prend l'avantage juste avant la mi-temps!"
      },
      "finish_reason": "stop"
    }
  ]
}
```

## Troubleshooting

### Issue: "No module named 'aiohttp'"

**Solution:**
```bash
pip install aiohttp beautifulsoup4 lxml
```

### Issue: "CUDA out of memory"

**Solution:** Reduce batch size in `runpod_finetuner.py`:
```python
"micro_batch_size": 1,  # Reduce from 2 to 1
"gradient_accumulation_steps": 8,  # Increase from 4 to 8
```

### Issue: "Connection refused to L'Équipe"

**Solution:** Add delay between requests:
```python
await asyncio.sleep(5)  # Increase from 2 to 5 seconds
```

### Issue: "Not enough training data"

**Solution:** Lower target or scrape more matches:
```bash
# Scrape 1500 matches instead of 1000
python runpod_data_collector.py --max-matches 1500 --target-examples 2500
```

## File Structure on RunPod

After running scripts, your workspace will look like:

```
/workspace/
├── runpod_data_collector.py       # Data collection script
├── runpod_finetuner.py             # Fine-tuning script
├── training_data/                  # Collected training data
│   ├── match_urls.json            # Discovered match URLs (1000+)
│   ├── raw_commentary.json        # Raw scraped data
│   ├── filtered_commentary.json   # After quality filtering
│   └── training_data.jsonl        # Final training format (2000+ examples)
├── axolotl/                        # Axolotl framework (auto-installed)
├── axolotl_config.yml              # Axolotl configuration
├── ds_config.json                  # DeepSpeed configuration
├── finetuned_model/                # LoRA checkpoints during training
│   ├── checkpoint-100/
│   ├── checkpoint-200/
│   └── ...
├── merged_model/                   # Final merged model (LoRA + base)
│   ├── config.json
│   ├── tokenizer_config.json
│   ├── model-00001-of-00015.safetensors
│   └── ...
└── vllm.log                        # vLLM server logs
```

## Performance Expectations

### Data Collection (1000 matches)
- **Time**: 30-60 minutes
- **Expected output**: 2000-3000 commentary examples
- **Storage**: ~5-10 MB JSON files

### Fine-Tuning (2000 examples, 3 epochs)
- **Time**: 4-6 hours on 4x A100 80GB
- **Storage**: ~150 GB (model checkpoints + merged model)
- **VRAM usage**: ~60-70 GB per GPU

### Model Performance (after fine-tuning)
- **Quality**: 90-95% human-indistinguishable commentary
- **Inference speed**: ~50-80 tokens/second
- **Latency**: <100ms for typical commentary (50-100 tokens)

## Advanced Configuration

### Customize data collection

Edit parameters in `runpod_data_collector.py`:

```python
# Collect more matches
max_matches = 1500  # Increase from 1000

# Higher target examples
target_examples = 3000  # Increase from 2000

# Stricter quality filtering
filtered_commentary = QualityFilter.filter_commentary(unique_commentary, strict=True)
```

### Customize fine-tuning

Edit Axolotl config in `runpod_finetuner.py`:

```python
# Longer training
"num_epochs": 5,  # Increase from 3

# Higher LoRA rank (better quality, more memory)
"lora_r": 64,  # Increase from 32
"lora_alpha": 128,  # Increase from 64

# Larger batch size (if you have enough VRAM)
"micro_batch_size": 4,  # Increase from 2
```

## Next Steps

After successful deployment:

1. **Update your API endpoint** in Next.js app:
   ```typescript
   // src/app/api/ai/generate-commentary/route.ts
   const VLLM_API_URL = 'http://194.68.245.75:8000/v1/chat/completions';
   ```

2. **Monitor model performance** in production:
   - Track inference latency
   - Collect user feedback
   - Monitor API usage

3. **Iterative improvement**:
   - Collect more data from new matches
   - Fine-tune again with combined dataset
   - A/B test old vs new model

## Support

For issues or questions:
- Check RunPod logs: `/workspace/vllm.log`
- Review training logs: `/workspace/finetuned_model/training.log`
- Monitor GPU usage: `nvidia-smi`
- Check disk space: `df -h /workspace`

## Cost Estimation

**RunPod 4x A100 80GB:**
- Data collection (1 hour): ~$8-10
- Fine-tuning (5 hours): ~$40-50
- **Total**: ~$50-60 for complete pipeline

**Production serving:**
- Keep instance running 24/7: ~$1,200/month
- Or use on-demand instances: ~$8/hour when needed

---

**Ready to start? Run:**
```bash
cd /workspace
python runpod_data_collector.py
```

Good luck! 🚀
