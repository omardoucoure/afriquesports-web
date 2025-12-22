# 🎯 Mistral 7B Fine-Tuning Guide - French Football Commentary

Complete guide for training Mistral 7B to generate human-quality French football commentary.

## 📊 Data Collection Complete

**Status**: ✅ READY FOR FINE-TUNING

### Collected Data
- **Total entries**: 255 commentary examples
- **Sources**: 4 fully commented matches
  - Morocco vs Comoros (CAN 2025) - 60 entries
  - Lyon vs Go Ahead Eagles (Europa League) - 61 entries
  - Nice vs Braga (Europa League) - 74 entries
  - Young Boys vs Lille (Europa League) - 60 entries

### Event Distribution
- Commentary: 209 (82%)
- Goals: 26 (10%)
- Substitutions: 14 (5%)
- Penalties: 3 (1%)
- Cards: 3 (1%)

### Quality Metrics
- Average length: 99.4 characters
- Full match coverage (1' to 90'+)
- Natural French style from L'Équipe journalists

---

## 📁 Files Generated

### Training Data
```
data/
├── training_commentary.json      # Raw 255 entries
├── mistral_training.jsonl        # Formatted for Mistral (136 KB)
└── lequipe_commented_matches.json # Match metadata
```

### Scripts
```
scrapers/
├── lequipe_finished_match_scraper.py  # Main scraper with scrolling
├── lequipe_match_finder.py            # Finds commented matches
└── batch_scraper.py                   # Batch processing

export_to_mistral_jsonl.py             # JSONL converter
mistral_finetuning_colab.ipynb         # Google Colab notebook
```

---

## 🚀 Fine-Tuning Instructions

### Step 1: Upload to Google Colab

1. **Open the notebook**:
   - Go to [Google Colab](https://colab.research.google.com/)
   - Upload `mistral_finetuning_colab.ipynb`

2. **Enable GPU**:
   - Runtime → Change runtime type
   - Hardware accelerator → T4 GPU
   - Save

3. **Upload training data**:
   - Click folder icon (left sidebar)
   - Upload `mistral_training.jsonl` (136 KB)

### Step 2: Run the Notebook

**Execute cells in order** (Shift+Enter):

1. ✅ Install dependencies (~2 min)
2. ✅ Mount Google Drive (~30 sec)
3. ✅ Load training data (~5 sec)
4. ✅ Format dataset (~10 sec)
5. ✅ Load Mistral 7B (~3 min)
6. ✅ Configure LoRA (~30 sec)
7. ✅ Setup training (~1 min)
8. ✅ Initialize trainer (~30 sec)
9. 🚀 **Train model** (~6-12 hours)
10. ✅ Test generation (~1 min)
11. ✅ Save model (~2 min)
12. ✅ Export to GGUF (optional, ~5 min)

### Step 3: Monitor Training

**Expected metrics**:
- Initial loss: ~2.0
- Final loss: ~0.5-0.7
- Training steps: ~48 per epoch × 3 epochs = 144 steps
- Checkpoints: Every 200 steps → saved to Google Drive

**If Colab disconnects**:
- The model is auto-saved to Google Drive every 200 steps
- You can resume training from the last checkpoint

---

## 🧪 Expected Results

### Quality Improvements

**Before (Llama 3.1 baseline)**:
```
❌ Repetition score: 0.45 (high repetition)
❌ Length variance: 8% (monotonous)
❌ Generic phrases: "Le joueur prend le ballon"
```

**After (Mistral 7B fine-tuned)**:
```
✅ Repetition score: < 0.25 (minimal repetition)
✅ Length variance: > 15% (varied structure)
✅ Natural phrases: L'Équipe style
✅ Proper tense mixing: présent/passé composé
```

### Sample Generation

**Input**: Minute 74', Type: But

**Output**:
> "El-Kaabi s'envole dans la surface et réussit un splendide retourné acrobatique du pied gauche. Pandor ne peut rien, c'est 2-0 pour le Maroc !"

---

## 💾 Model Files (Post-Training)

### In Google Drive

After training completes, you'll have:

```
MyDrive/
├── mistral-commentary-checkpoints/    # Training checkpoints
│   ├── checkpoint-200/
│   ├── checkpoint-400/
│   └── checkpoint-600/
│
├── mistral-commentary-final/          # LoRA adapter (small)
│   ├── adapter_config.json
│   ├── adapter_model.safetensors      # ~200 MB
│   └── tokenizer files
│
└── mistral-commentary-merged/         # Full merged model
    ├── config.json
    ├── model.safetensors               # ~14 GB
    └── tokenizer files
```

---

## 📦 Deployment Options

### Option 1: GGUF + Ollama (Recommended)

**Convert to GGUF**:
```bash
# On local machine with llama.cpp
python llama.cpp/convert.py \
    mistral-commentary-merged \
    --outtype q4_k_m \
    --outfile mistral-commentary-q4.gguf
```

**Upload to server**:
```bash
scp mistral-commentary-q4.gguf root@159.223.103.16:~/models/
```

**Create Modelfile**:
```bash
FROM ./models/mistral-commentary-q4.gguf

PARAMETER temperature 0.9
PARAMETER top_p 0.95
PARAMETER top_k 50
PARAMETER repeat_penalty 1.15

SYSTEM Tu es un commentateur sportif professionnel pour Afrique Sports, spécialisé dans le football africain. Ton style s'inspire de L'Équipe: vif, précis, émotionnel mais jamais sensationnaliste.
```

**Load in Ollama**:
```bash
ollama create mistral-commentary -f Modelfile
ollama run mistral-commentary "Génère un commentaire pour minute 67'"
```

### Option 2: HuggingFace Inference

**Load LoRA adapter**:
```python
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

base_model = AutoModelForCausalLM.from_pretrained("mistralai/Mistral-7B-v0.3")
model = PeftModel.from_pretrained(base_model, "path/to/mistral-commentary-final")
tokenizer = AutoTokenizer.from_pretrained("mistralai/Mistral-7B-v0.3")
```

---

## 🔬 A/B Testing Framework

**After deployment**, monitor quality:

```python
# scripts/deployment/quality_monitor.py
from quality_monitor import ABTestMonitor

monitor = ABTestMonitor()

# Track metrics
monitor.log_metric(
    model="mistral-commentary",
    text=generated_text,
    gen_time=elapsed_ms
)

# Compare with baseline
report = monitor.get_comparison_report()
# {
#   "llama3.1": {"avg_repetition": 0.45, ...},
#   "mistral-commentary": {"avg_repetition": 0.18, ...}
# }
```

**Decision criteria**:
- ✅ If repetition < 0.25 AND length variance > 15% → Full switchover
- ❌ If repetition > 0.35 OR crashes → Rollback to Llama

---

## 📈 Training Timeline

| Day | Task | Duration |
|-----|------|----------|
| Day 1 | ✅ Data collection (255 entries) | Complete |
| Day 1 | ✅ JSONL export | Complete |
| Day 1 | ✅ Colab notebook setup | Complete |
| Day 2-3 | Fine-tuning on Colab T4 | 6-12 hours |
| Day 3 | Model testing & validation | 2 hours |
| Day 3-4 | GGUF conversion & upload | 1 hour |
| Day 4 | Deploy with A/B testing | 2 hours |
| Day 5-7 | Monitor & production rollout | Ongoing |

**Total**: 3-5 days from start to production

---

## ⚠️ Troubleshooting

### Colab Issues

**Problem**: Disconnected during training
- **Solution**: Checkpoints are auto-saved every 200 steps to Google Drive. Resume from last checkpoint.

**Problem**: Out of memory (OOM)
- **Solution**: Reduce batch size to 1, or use gradient accumulation of 16

**Problem**: Training too slow
- **Solution**: Ensure T4 GPU is enabled (not CPU). Check Runtime → Change runtime type.

### Generation Issues

**Problem**: Repetitive output
- **Solution**: Increase `repetition_penalty` to 1.2-1.3 or `top_k` to 60

**Problem**: Incoherent text
- **Solution**: Lower `temperature` to 0.7-0.8

**Problem**: Too short/long
- **Solution**: Adjust `max_new_tokens` (default: 120)

---

## 📚 Resources

### Documentation
- [Unsloth GitHub](https://github.com/unslothai/unsloth) - Fast LoRA training
- [Mistral 7B](https://huggingface.co/mistralai/Mistral-7B-v0.3) - Base model
- [TRL Documentation](https://huggingface.co/docs/trl) - Supervised fine-tuning

### Monitoring
- Google Colab logs - Real-time training progress
- Google Drive - Checkpoints and model files
- Server logs - Production inference metrics

---

## ✅ Success Criteria

### Quantitative
- [x] Dataset: 255 examples collected
- [ ] Training loss: < 0.7
- [ ] Repetition score: < 0.25
- [ ] Length variance: > 15%
- [ ] Generation time: < 5 seconds
- [ ] No crashes during 90-minute match

### Qualitative
- [ ] 90%+ pass "human test" (indistinguishable from L'Équipe)
- [ ] Natural tense mixing (présent/passé composé)
- [ ] Emotional variation (excitement, analysis, context)
- [ ] No generic phrases
- [ ] Specific player names and actions

---

## 🎉 Next Steps

**You are here**: ✅ Data collected, JSONL exported, Colab notebook ready

**Next**:
1. Open `mistral_finetuning_colab.ipynb` in Google Colab
2. Upload `mistral_training.jsonl`
3. Run all cells
4. Wait 6-12 hours
5. Test the fine-tuned model
6. Deploy to production with A/B testing

**Questions?** Review the plan in `/Users/omardoucoure/.claude/plans/linear-roaming-hopper.md`

---

**Created**: December 22, 2025
**Dataset**: 255 L'Équipe commentary examples
**Target**: Human-quality French football commentary
**Status**: Ready for fine-tuning 🚀
