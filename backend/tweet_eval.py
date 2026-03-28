import torch
from datasets import load_dataset
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from torch.utils.data import DataLoader

# ---------------------------
# Setup
# ---------------------------
model_name = "cardiffnlp/twitter-roberta-base-sentiment"
max_length = 128
batch_size = 16
num_epochs = 1
learning_rate = 2e-5

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")

# ---------------------------
# Load tokenizer, model, dataset
# ---------------------------
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name)
model.to(device)

dataset = load_dataset("tweet_eval", "sentiment")

# ---------------------------
# Tokenization
# ---------------------------
def tokenize_function(example):
    return tokenizer(
        example["text"],
        truncation=True,
        padding="max_length",
        max_length=max_length
    )

tokenized_dataset = dataset.map(tokenize_function, batched=True)

# Keep only the columns we need and convert to PyTorch tensors
tokenized_dataset = tokenized_dataset.remove_columns(["text"])
tokenized_dataset = tokenized_dataset.rename_column("label", "labels")
tokenized_dataset.set_format("torch")

# ---------------------------
# DataLoaders
# ---------------------------
train_loader = DataLoader(
    tokenized_dataset["train"],
    batch_size=batch_size,
    shuffle=True
)

val_loader = DataLoader(
    tokenized_dataset["validation"],
    batch_size=batch_size,
    shuffle=False
)

# ---------------------------
# Optimizer
# ---------------------------
optimizer = torch.optim.AdamW(model.parameters(), lr=learning_rate)

# ---------------------------
# Training loop
# ---------------------------
for epoch in range(num_epochs):
    model.train()
    total_train_loss = 0

    print(f"\nEpoch {epoch + 1}/{num_epochs}")

    for batch in train_loader:
        batch = {k: v.to(device) for k, v in batch.items()}

        optimizer.zero_grad()

        outputs = model(**batch)
        loss = outputs.loss

        loss.backward()
        optimizer.step()

        total_train_loss += loss.item()

    avg_train_loss = total_train_loss / len(train_loader)
    print(f"Average training loss: {avg_train_loss:.4f}")

    # ---------------------------
    # Validation
    # ---------------------------
    model.eval()
    total_val_loss = 0
    correct = 0
    total = 0

    with torch.no_grad():
        for batch in val_loader:
            batch = {k: v.to(device) for k, v in batch.items()}

            outputs = model(**batch)
            loss = outputs.loss
            logits = outputs.logits

            total_val_loss += loss.item()

            predictions = torch.argmax(logits, dim=-1)
            correct += (predictions == batch["labels"]).sum().item()
            total += batch["labels"].size(0)

    avg_val_loss = total_val_loss / len(val_loader)
    val_accuracy = correct / total

    print(f"Validation loss: {avg_val_loss:.4f}")
    print(f"Validation accuracy: {val_accuracy:.4f}")

# ---------------------------
# Save model parameters
# ---------------------------
save_path = "sentiment_model.pt"
torch.save(model.state_dict(), save_path)
print(f"Model parameters saved to: {save_path}")