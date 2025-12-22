# Football Commentary Data Collection System

Comprehensive system for collecting, filtering, and reviewing French football commentary to train Mistral 7B for human-quality match commentary generation.

## 🎯 Objective

Collect **2000+ high-quality French commentary examples** to fine-tune Mistral 7B with LoRA, achieving 90-95% human-indistinguishable quality.

## 📁 Project Structure

```
scripts/data-collection/
├── scrapers/
│   ├── base_scraper.py        # Base scraper class
│   ├── lequipe_scraper.py     # L'Équipe scraper (target: 1200 examples)
│   └── rmc_scraper.py          # RMC Sport scraper (target: 600 examples)
├── templates/
│   ├── index.html              # Review dashboard
│   ├── review.html             # Review interface
│   └── completed.html          # Completion page
├── data/
│   ├── raw_commentary.json     # Raw scraped data
│   ├── filtered_commentary.json # After quality filter
│   ├── approved_commentary.json # Manual review approved
│   ├── rejected_commentary.json # Manual review rejected
│   ├── commentary_training.jsonl # Final training format
│   └── data_stats.json         # Quality metrics
├── collect_commentary.py       # Main orchestrator
├── quality_filter.py           # Quality filtering logic
├── review_app.py               # Flask review web app
└── README.md                   # This file
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd scripts/data-collection
pip install requests beautifulsoup4 flask
```

### 2. Prepare URL Lists

Create text files with match URLs (one per line):

**lequipe_urls.txt:**
```
https://www.lequipe.fr/Football/match-direct/can/2025/maroc-comores-live/670748
https://www.lequipe.fr/Football/match-direct/ligue-1/2024/psg-marseille-live/123456
...
```

**rmc_urls.txt:**
```
https://rmcsport.bfmtv.com/football/can-2025/match-live-123
...
```

### 3. Run Data Collection

```bash
python collect_commentary.py --lequipe-urls lequipe_urls.txt --rmc-urls rmc_urls.txt
```

Options:
- `--strict`: Use stricter quality filtering (higher quality, fewer results)

### 4. Manual Review

Start the Flask review app:

```bash
python review_app.py
```

Open http://localhost:5000 in your browser.

**Keyboard Shortcuts:**
- `A` - Approve commentary
- `R` - Reject commentary
- `E` - Edit commentary
- `Esc` - Cancel edit

**Target: 90%+ approval rate**

### 5. Export for Training

Once review is complete, export approved commentary to JSONL:

```bash
# Via web interface
curl http://localhost:5000/api/export_approved

# Or via API
```

Output: `data/commentary_training.jsonl`

## 📊 Quality Criteria

### Automatic Quality Filter

Commentary must pass these criteria:

1. **Length**: 50-500 characters
2. **Football vocabulary**: Must contain football-related terms (but, tir, passe, etc.)
3. **No bare URLs**: Cannot start with http/www
4. **Sentence limit**: Max 3 sentences (avoid walls of text)
5. **Text content**: Must contain sufficient letters
6. **Uniqueness**: < 50% word repetition

### Manual Review Guidelines

**✅ Approve if:**
- Natural, human-sounding French
- Specific details (player names, actions)
- Varied sentence structure
- Emotional but not sensationalist
- Similar to L'Équipe/RMC Sport style

**❌ Reject if:**
- Generic/robotic phrasing
- Repetitive structure
- Too short or too long
- Contains errors or gibberish
- Just metadata (timestamps, scores only)

## 📈 Data Collection Progress

### Target Distribution

| Source | Target | Percentage |
|--------|--------|------------|
| L'Équipe | 1200 | 60% |
| RMC Sport | 600 | 30% |
| Manual curation | 200 | 10% |
| **Total** | **2000+** | **100%** |

### Quality Metrics

Monitor these metrics in the review dashboard:

- **Approval Rate**: Target 90%+
- **Vocabulary Diversity**: Target > 8,000 unique words
- **Average Length**: Target 70-90 characters
- **Event Type Distribution**: Mix of commentary, goals, cards, substitutions

## 🔧 API Endpoints (Review App)

### GET /
Dashboard with collection statistics

### GET /review
Review interface with current commentary

### POST /api/approve
Approve current commentary

### POST /api/reject
Reject current commentary (with optional reason)

### POST /api/edit
Edit and approve commentary

### GET /api/stats
Detailed statistics JSON

### GET /api/export_approved
Export approved commentary to JSONL training format

## 📝 Data Format

### Scraped Format (JSON)
```json
{
  "source": "lequipe",
  "time": "45'",
  "text": "Hakimi délivre une passe parfaite pour Ziyech qui contrôle brillamment!",
  "event_type": "commentary",
  "scraped_at": "2025-01-15T10:30:00Z"
}
```

### Training Format (JSONL)
```jsonl
{"messages": [
  {"role": "system", "content": "Tu es un commentateur sportif professionnel pour L'Équipe."},
  {"role": "user", "content": "Génère un commentaire pour: Minute 45' - commentary"},
  {"role": "assistant", "content": "Hakimi délivre une passe parfaite pour Ziyech qui contrôle brillamment!"}
]}
```

## 🛠️ Advanced Usage

### Custom Scraper Development

Extend `BaseScraper` to add new sources:

```python
from base_scraper import BaseScraper

class CustomScraper(BaseScraper):
    def __init__(self):
        super().__init__(base_url="https://example.com", delay=2.0)

    def extract_commentary(self, soup):
        # Implement extraction logic
        commentary_list = []
        # ... extract events ...
        return commentary_list
```

### Quality Filter Customization

Edit `quality_filter.py` to adjust filtering criteria:

```python
# Adjust minimum length
min_length = 60  # Increase for stricter filter

# Add custom football vocabulary
FOOTBALL_TERMS_FR.update({'pressing', 'contre-pressing', 'tiki-taka'})
```

### Batch Processing

Process multiple URL files:

```bash
for file in urls/*.txt; do
    python collect_commentary.py --lequipe-urls "$file" --strict
done
```

## 📋 Workflow Checklist

### Phase 1: Data Collection
- [ ] Gather 50+ match URLs from L'Équipe
- [ ] Gather 30+ match URLs from RMC Sport
- [ ] Run collection script
- [ ] Verify raw data quality

### Phase 2: Quality Filtering
- [ ] Apply automatic quality filter
- [ ] Check approval rate (aim for 50%+ at this stage)
- [ ] Review filtered data statistics
- [ ] Adjust filters if needed

### Phase 3: Manual Review
- [ ] Start Flask review app
- [ ] Review all filtered commentary
- [ ] Maintain 90%+ approval rate
- [ ] Edit unclear/improvable entries

### Phase 4: Export & Validation
- [ ] Export to JSONL format
- [ ] Validate total: 2000+ examples
- [ ] Check vocabulary diversity: 8,000+ unique words
- [ ] Verify no duplicates
- [ ] Review final statistics

## 🚨 Troubleshooting

### Scraper Issues

**Problem**: No commentary extracted
**Solution**:
- Check if website structure changed
- Verify selectors in scraper code
- Test with browser DevTools

**Problem**: Rate limiting / blocked
**Solution**:
- Increase delay between requests
- Rotate user agents
- Respect robots.txt

### Review App Issues

**Problem**: Flask app won't start
**Solution**:
```bash
pip install flask
# Check port 5000 is not in use
lsof -i :5000
```

**Problem**: Keyboard shortcuts not working
**Solution**: Click outside any text input field

## 📚 Resources

- [L'Équipe Football](https://www.lequipe.fr/Football/)
- [RMC Sport](https://rmcsport.bfmtv.com/football/)
- [BeautifulSoup4 Docs](https://www.crummy.com/software/BeautifulSoup/bs4/doc/)
- [Flask Docs](https://flask.palletsprojects.com/)

## 🔄 Next Steps

After completing data collection:

1. Upload `commentary_training.jsonl` to Google Colab
2. Follow fine-tuning notebook instructions
3. Train Mistral 7B with LoRA
4. Export to GGUF format
5. Deploy to production server

See main plan file for complete workflow: `/Users/omardoucoure/.claude/plans/linear-roaming-hopper.md`

## 📞 Support

For issues or questions, refer to the main project documentation or contact the development team.

---

**Target**: 2000+ examples | **Quality**: 90-95% human-indistinguishable | **Timeline**: 3-5 days
