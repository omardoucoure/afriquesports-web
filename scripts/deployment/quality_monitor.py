#!/usr/bin/env python3
"""
A/B testing framework with quality metrics tracking
Monitors repetition, length variance, and generation time
"""

import hashlib
import json
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import List, Dict
from pathlib import Path


@dataclass
class CommentaryMetrics:
    """Metrics for a single commentary generation"""
    model: str
    timestamp: str
    text: str
    generation_time_ms: float
    char_length: int
    word_count: int
    repetition_score: float  # 0-1, lower is better


class ABTestMonitor:
    """Track model performance in A/B test"""

    def __init__(self, metrics_file: str = "/root/afcon-agent-temp/metrics/commentary_metrics.jsonl"):
        self.metrics_file = Path(metrics_file)
        self.metrics_file.parent.mkdir(parents=True, exist_ok=True)
        self.metrics: List[CommentaryMetrics] = []
        self._load_metrics()

    def _load_metrics(self):
        """Load existing metrics from file"""
        if self.metrics_file.exists():
            with open(self.metrics_file, 'r') as f:
                for line in f:
                    data = json.loads(line)
                    self.metrics.append(CommentaryMetrics(**data))

    def should_use_variant(self, event_id: str) -> bool:
        """
        50/50 split based on event ID hash

        Args:
            event_id: Unique identifier for the event (e.g., "match123_min45")

        Returns:
            True if should use variant model, False for control
        """
        hash_value = int(hashlib.md5(event_id.encode()).hexdigest(), 16)
        return (hash_value % 100) < 50

    def calculate_repetition(self, text: str) -> float:
        """
        Measure phrase repetition using trigram overlap

        Returns:
            Score from 0-1, where 0 = no repetition, 1 = completely repetitive
        """
        words = text.lower().split()
        if len(words) < 3:
            return 0.0

        # Create trigrams from current text
        trigrams = set(tuple(words[i:i+3]) for i in range(len(words) - 2))

        # Get trigrams from last 5 commentaries
        recent_trigrams = set()
        for m in self.metrics[-5:]:
            recent_words = m.text.lower().split()
            if len(recent_words) >= 3:
                recent_trigrams.update(
                    tuple(recent_words[i:i+3])
                    for i in range(len(recent_words) - 2)
                )

        if not recent_trigrams:
            return 0.0

        # Calculate overlap
        overlap = len(trigrams & recent_trigrams)
        return overlap / len(trigrams) if trigrams else 0.0

    def log_metric(self, model: str, text: str, gen_time: float):
        """
        Track quality metrics for a generated commentary

        Args:
            model: Model name (llama3.1:8b or mistral-commentary)
            text: Generated commentary text
            gen_time: Generation time in milliseconds
        """
        metric = CommentaryMetrics(
            model=model,
            timestamp=datetime.utcnow().isoformat(),
            text=text,
            generation_time_ms=gen_time,
            char_length=len(text),
            word_count=len(text.split()),
            repetition_score=self.calculate_repetition(text)
        )

        self.metrics.append(metric)

        # Save to file
        with open(self.metrics_file, 'a') as f:
            f.write(json.dumps(asdict(metric)) + '\n')

    def get_comparison_report(self, last_n: int = 100) -> Dict:
        """
        Compare Llama vs Mistral performance

        Args:
            last_n: Number of recent metrics to analyze

        Returns:
            Dict with comparison statistics
        """
        recent = self.metrics[-last_n:] if len(self.metrics) > last_n else self.metrics

        llama_metrics = [m for m in recent if 'llama' in m.model.lower()]
        mistral_metrics = [m for m in recent if 'mistral' in m.model.lower()]

        def calc_stats(metrics: List[CommentaryMetrics]) -> Dict:
            if not metrics:
                return {
                    "count": 0,
                    "avg_repetition": 0,
                    "avg_length": 0,
                    "avg_gen_time": 0,
                    "length_variance": 0
                }

            lengths = [m.char_length for m in metrics]
            avg_length = sum(lengths) / len(lengths)
            variance = sum((x - avg_length) ** 2 for x in lengths) / len(lengths)
            length_variance = (variance ** 0.5) / avg_length if avg_length > 0 else 0

            return {
                "count": len(metrics),
                "avg_repetition": sum(m.repetition_score for m in metrics) / len(metrics),
                "avg_length": avg_length,
                "avg_gen_time": sum(m.generation_time_ms for m in metrics) / len(metrics),
                "length_variance": length_variance * 100  # as percentage
            }

        return {
            "llama3.1": calc_stats(llama_metrics),
            "mistral-commentary": calc_stats(mistral_metrics),
            "total_samples": len(recent)
        }

    def get_recommendation(self) -> Dict:
        """
        Analyze metrics and provide rollout recommendation

        Returns:
            Dict with recommendation and reasoning
        """
        report = self.get_comparison_report()

        llama = report['llama3.1']
        mistral = report['mistral-commentary']

        # Decision criteria
        if mistral['count'] < 20:
            return {
                "action": "continue_testing",
                "reason": "Insufficient data (need at least 20 samples)"
            }

        repetition_improved = mistral['avg_repetition'] < 0.25 and mistral['avg_repetition'] < llama['avg_repetition']
        variance_improved = mistral['length_variance'] > 15
        speed_acceptable = mistral['avg_gen_time'] < 10000  # 10 seconds

        if repetition_improved and variance_improved and speed_acceptable:
            return {
                "action": "full_rollout",
                "reason": f"Mistral shows better quality (repetition: {mistral['avg_repetition']:.2f}, variance: {mistral['length_variance']:.1f}%)",
                "confidence": "high"
            }
        elif mistral['avg_repetition'] > 0.35 or mistral['avg_gen_time'] > 15000:
            return {
                "action": "rollback",
                "reason": f"Mistral quality issues (repetition: {mistral['avg_repetition']:.2f}, gen_time: {mistral['avg_gen_time']:.0f}ms)",
                "confidence": "high"
            }
        else:
            return {
                "action": "continue_testing",
                "reason": "Metrics inconclusive, continue A/B test",
                "confidence": "low"
            }


if __name__ == '__main__':
    import sys

    monitor = ABTestMonitor()

    if len(sys.argv) < 2:
        print("Usage:")
        print("  python quality_monitor.py report              # Show comparison report")
        print("  python quality_monitor.py recommendation      # Get rollout recommendation")
        print("  python quality_monitor.py log <model> <text> <time>  # Log a metric")
        sys.exit(1)

    command = sys.argv[1]

    if command == "report":
        report = monitor.get_comparison_report()
        print("\n" + "="*70)
        print("A/B TEST COMPARISON REPORT")
        print("="*70)
        print(json.dumps(report, indent=2))

    elif command == "recommendation":
        rec = monitor.get_recommendation()
        print("\n" + "="*70)
        print("ROLLOUT RECOMMENDATION")
        print("="*70)
        print(f"Action: {rec['action'].upper()}")
        print(f"Reason: {rec['reason']}")
        print(f"Confidence: {rec.get('confidence', 'medium')}")

    elif command == "log":
        if len(sys.argv) < 5:
            print("Error: model, text, and time required")
            sys.exit(1)
        model = sys.argv[2]
        text = sys.argv[3]
        gen_time = float(sys.argv[4])
        monitor.log_metric(model, text, gen_time)
        print(f"✅ Metric logged for {model}")

    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
