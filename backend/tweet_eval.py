import torch
from datasets import load_dataset
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from torch.utils.data import DataLoader

def tokenize_function(example):
    return tokenizer(example["text"], truncation=True, padding="max_length", max_length=128)

model_name = "cardiffnlp/twitter-roberta-base-sentiment"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name)
dataset = load_dataset("tweet_eval", "sentiment")

tokenized_dataset = dataset.map(tokenize_function, batched=True)

from torch.utils.data import DataLoader

def collate_fn(batch):
    return {
        'input_ids': torch.tensor([item['input_ids'] for item in batch]),
        'attention_mask': torch.tensor([item['attention_mask'] for item in batch]),
        'labels': torch.tensor([item['label'] for item in batch])
    }

batch_size = 16
train_loader = DataLoader(tokenized_dataset['train'], batch_size=batch_size, shuffle=True, collate_fn=collate_fn)

num_epochs = 3  # You can change this number

for epoch in range(num_epochs):
    print(f"Epoch {epoch+1}/{num_epochs}")
    for batch in train_loader:
        input_ids = batch['input_ids']
        attention_mask = batch['attention_mask']
        labels = batch['labels']

        outputs = model(input_ids=input_ids, attention_mask=attention_mask, labels=labels)
        loss = outputs.loss
        
        print(f"Loss: {loss.item()}")


saved_model_path = "sentiment_model.pt"
torch.save(model.state_dict(), saved_model_path)