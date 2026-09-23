"""
Training and Evaluation runner for SIH26080 Regime Classifier.
Trains on JJAS 2021-2022, validates on JJAS 2023, tests on June 2024.
Serializes model weights and metrics.
"""
import os
import json
import pandas as pd
from src.features.split import ChronologicalSplitter
from src.regime_classifier.classifier import RegimeClassifier
from src.regime_classifier.label_generator import RegimeLabelGenerator


def run_regime_training():
    print("=== 1. GENERATING REGIME LABELS ===")
    generator = RegimeLabelGenerator()
    generator.export_raw_event_catalog()

    paired_df = pd.read_csv("data/processed/paired_monsoon_benchmark.csv")
    labels_df = generator.generate_labels_for_dataset(paired_df)

    # 2. Chronological Split
    print("\n=== 2. CHRONOLOGICAL SPLIT (ZERO TEMPORAL LEAKAGE) ===")
    train_labels, val_labels, test_labels = ChronologicalSplitter.split_by_dates(
        labels_df,
        time_col="timestamp",
        train_end="2022-10-01",
        val_end="2023-10-01"
    )

    y_train = train_labels["regime"]
    y_val = val_labels["regime"]
    y_test = test_labels["regime"]

    # Save target split files
    y_train.to_csv("data/processed/y_train_regime.csv", index=False)
    y_val.to_csv("data/processed/y_val_regime.csv", index=False)
    y_test.to_csv("data/processed/y_test_regime.csv", index=False)
    train_labels.to_csv("data/processed/regime_labels/train_labels.csv", index=False)
    val_labels.to_csv("data/processed/regime_labels/val_labels.csv", index=False)
    test_labels.to_csv("data/processed/regime_labels/test_labels.csv", index=False)

    print(f"Train labels: {len(y_train)} records")
    print(f"Val labels:   {len(y_val)} records")
    print(f"Test labels:  {len(y_test)} records")

    # Load feature matrices
    X_train = pd.read_csv("data/processed/X_train.csv")
    X_val = pd.read_csv("data/processed/X_val.csv")
    X_test = pd.read_csv("data/processed/X_test.csv")

    # 3. Train Gradient Boosting Classifier
    print("\n=== 3. TRAINING GRADIENT BOOSTING REGIME CLASSIFIER ===")
    clf = RegimeClassifier(
        model_type="gradient_boosting",
        n_estimators=50,
        max_depth=3,
        learning_rate=0.05,
        random_state=42
    )
    clf.fit(X_train, y_train)

    # 4. Evaluation
    val_metrics = clf.evaluate(X_val, y_val)
    test_metrics = clf.evaluate(X_test, y_test)
    train_metrics = clf.evaluate(X_train, y_train)

    print("\n--- Training Set Performance ---")
    print(f"Accuracy: {train_metrics['accuracy']:.4f}, Macro F1: {train_metrics['macro_f1']:.4f}")

    print("\n--- Validation Set (JJAS 2023) Performance ---")
    print(f"Accuracy: {val_metrics['accuracy']:.4f}")
    print(f"Macro F1: {val_metrics['macro_f1']:.4f}")
    print(f"Weighted F1: {val_metrics['weighted_f1']:.4f}")
    print(pd.DataFrame(val_metrics["classification_report"]).T)

    print("\n--- Test Set (June 2024) Performance ---")
    print(f"Accuracy: {test_metrics['accuracy']:.4f}")
    print(f"Macro F1: {test_metrics['macro_f1']:.4f}")
    print(f"Weighted F1: {test_metrics['weighted_f1']:.4f}")
    print(pd.DataFrame(test_metrics["classification_report"]).T)

    # 5. Save Model and Evaluation Metrics
    clf.save(
        model_path="models/regime_classifier.pkl",
        metadata_path="models/regime_classifier_metadata.json"
    )

    eval_summary = {
        "model_type": "gradient_boosting",
        "n_features": len(X_train.columns),
        "train_samples": len(X_train),
        "val_samples": len(X_val),
        "test_samples": len(X_test),
        "train_metrics": {
            "accuracy": train_metrics["accuracy"],
            "macro_f1": train_metrics["macro_f1"],
            "weighted_f1": train_metrics["weighted_f1"],
        },
        "val_metrics": {
            "accuracy": val_metrics["accuracy"],
            "macro_f1": val_metrics["macro_f1"],
            "weighted_f1": val_metrics["weighted_f1"],
            "class_report": val_metrics["classification_report"],
            "confusion_matrix": val_metrics["confusion_matrix"],
        },
        "test_metrics": {
            "accuracy": test_metrics["accuracy"],
            "macro_f1": test_metrics["macro_f1"],
            "weighted_f1": test_metrics["weighted_f1"],
            "class_report": test_metrics["classification_report"],
            "confusion_matrix": test_metrics["confusion_matrix"],
        },
        "classes": clf.classes_
    }

    with open("models/regime_classifier_evaluation.json", "w", encoding="utf-8") as f:
        json.dump(eval_summary, f, indent=2)

    print("\nModel saved to models/regime_classifier.pkl")
    print("Evaluation summary saved to models/regime_classifier_evaluation.json")


if __name__ == "__main__":
    run_regime_training()
