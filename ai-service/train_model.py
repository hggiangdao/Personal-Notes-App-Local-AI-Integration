import json
import os
import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.model_selection import cross_val_score

def train():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(current_dir, "data", "training_data.json")
    models_dir = os.path.join(current_dir, "models")
    os.makedirs(models_dir, exist_ok=True)

    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    texts = [item["text"] for item in data]
    labels = [item["tag"] for item in data]

    print(f"Loaded {len(texts)} samples across labels: {set(labels)}")

    # Feature Extraction: TF-IDF with Unigram & Bigram
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        sublinear_tf=True,
        min_df=1,
        norm='l2'
    )
    X = vectorizer.fit_transform(texts)

    # Compare Logistic Regression vs MultinomialNB
    clf_lr = LogisticRegression(C=5.0, solver='liblinear', random_state=42)
    scores_lr = cross_val_score(clf_lr, X, labels, cv=5)
    print(f"LogisticRegression 5-Fold Accuracy: {scores_lr.mean():.4f} (+/- {scores_lr.std():.4f})")

    clf_nb = MultinomialNB(alpha=0.1)
    scores_nb = cross_val_score(clf_nb, X, labels, cv=5)
    print(f"MultinomialNB 5-Fold Accuracy: {scores_nb.mean():.4f} (+/- {scores_nb.std():.4f})")

    # Pick the best classifier
    if scores_lr.mean() >= scores_nb.mean():
        best_clf = clf_lr
        best_name = "LogisticRegression"
    else:
        best_clf = clf_nb
        best_name = "MultinomialNB"

    best_clf.fit(X, labels)
    print(f"Selected Best Model: {best_name}")

    # Save artifacts
    vectorizer_file = os.path.join(models_dir, "vectorizer.pkl")
    model_file = os.path.join(models_dir, "tag_classifier.pkl")

    joblib.dump(vectorizer, vectorizer_file)
    joblib.dump(best_clf, model_file)

    print(f"Successfully saved artifacts to {models_dir}")

    # Comprehensive tests
    test_cases = [
        "Sáng mai 9h họp khẩn với phòng kỹ thuật sửa lỗi server",
        "Ý tưởng làm app nhắc uống nước kết hợp nuôi mèo ảo",
        "Ôn tập 30 từ vựng tiếng Anh chuẩn bị cho kỳ thi IELTS",
        "Đi siêu thị mua rau củ, trứng gà và dầu ăn cho mẹ"
    ]

    print("\n--- TEST PREDICTIONS ---")
    for phrase in test_cases:
        X_test = vectorizer.transform([phrase])
        pred = best_clf.predict(X_test)[0]
        probs = best_clf.predict_proba(X_test)[0]
        conf = np.max(probs)
        print(f"'{phrase}'\n  -> Predicted: {pred} (Confidence: {conf*100:.1f}%)\n")

if __name__ == "__main__":
    train()
