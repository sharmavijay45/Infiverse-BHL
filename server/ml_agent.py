import os
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"  # Suppress oneDNN warning
import pymongo
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Input
from sklearn.preprocessing import LabelEncoder, StandardScaler
import json
from datetime import datetime
import uuid

# Connect to MongoDB
client = pymongo.MongoClient("mongodb+srv://7819vijaysharma:Ram%402025@cluster0.cvizq.mongodb.net")
db = client["workflow_ai"]
tasks_collection = db["tasks"]
users_collection = db["users"]
departments_collection = db["departments"]

# All possible categories
ALL_CATEGORIES = ["Deadlines", "Dependencies", "Resources", "Workflow"]

# Utility to calculate days between dates
def days_between(date1, date2):
    diff = (date2 - date1).days
    return diff

# Generate synthetic or real dataset
def prepare_dataset():
    tasks = list(tasks_collection.find())
    users = list(users_collection.find())
    departments = list(departments_collection.find())
    print(f"Found {len(tasks)} tasks, {len(users)} users, {len(departments)} departments")

    if not tasks:
        print("No tasks found, returning empty dataset")
        return np.array([]), [], []

    current_date = datetime.now()
    features = []
    labels_category = []
    labels_score = []

    for task in tasks:
        due_date = task["dueDate"]
        days_to_due = days_between(current_date, due_date)
        num_dependencies = len(task.get("dependencies", []))
        assignee_id = str(task.get("assignee"))
        department_id = str(task.get("department"))
        
        assignee_tasks = tasks_collection.count_documents({"assignee": task["assignee"], "status": {"$ne": "Completed"}})
        dept_tasks = tasks_collection.count_documents({"department": task["department"], "status": {"$ne": "Completed"}})
        
        priority_map = {"Low": 0, "Medium": 1, "High": 2}
        status_map = {"Pending": 0, "In Progress": 1, "Completed": 2}
        
        feature_vector = [
            days_to_due,
            num_dependencies,
            assignee_tasks,
            dept_tasks,
            priority_map.get(task["priority"], 1),
            status_map.get(task["status"], 0)
        ]
        
        if days_to_due < 0 and task["status"] != "Completed":
            category = "Deadlines"
            score = 90 + min(abs(days_to_due), 10)
        elif num_dependencies > 1:
            category = "Dependencies"
            score = 70 + num_dependencies * 5
        elif assignee_tasks > 2:
            category = "Resources"
            score = 60 + assignee_tasks * 10
        else:
            category = "Workflow"
            score = 50 + len(tasks) // len(departments) if departments else 50
        
        features.append(feature_vector)
        labels_category.append(category)
        labels_score.append(min(score, 100))

    print(f"Categories found: {set(labels_category)}")
    return np.array(features), labels_category, labels_score

# Train model
def train_model():
    features, labels_category, labels_score = prepare_dataset()
    
    if features.size == 0:
        print("Training skipped: no data")
        return None, None, None

    label_encoder = LabelEncoder()
    # Fit encoder on all possible categories to avoid unseen labels
    label_encoder.fit(ALL_CATEGORIES)
    # Transform only the existing labels
    encoded_labels = label_encoder.transform(labels_category)
    
    scaler = StandardScaler()
    scaled_features = scaler.fit_transform(features)
    
    np.save("label_encoder_classes.npy", label_encoder.classes_)
    np.save("scaler_mean.npy", scaler.mean_)
    np.save("scaler_scale.npy", scaler.scale_)
    
    model = Sequential([
        Input(shape=(features.shape[1],)),
        Dense(64, activation="relu"),
        Dense(32, activation="relu"),
        Dense(16, activation="relu"),
        Dense(2, activation="linear")
    ])
    
    model.compile(optimizer="adam", loss="mse")
    
    model.fit(scaled_features, np.column_stack((encoded_labels, labels_score)), epochs=50, batch_size=32, verbose=1)
    
    model.save("workflow_optimizer.keras")  # Use native Keras format
    return model, label_encoder, scaler

# Generate insights for a single task
def generate_insight(task, model, label_encoder, scaler):
    current_date = datetime.now()
    days_to_due = days_between(current_date, task["dueDate"])
    num_dependencies = len(task.get("dependencies", []))
    assignee_tasks = tasks_collection.count_documents({"assignee": task["assignee"], "status": {"$ne": "Completed"}})
    dept_tasks = tasks_collection.count_documents({"department": task["department"], "status": {"$ne": "Completed"}})
    priority_map = {"Low": 0, "Medium": 1, "High": 2}
    status_map = {"Pending": 0, "In Progress": 1, "Completed": 2}
    
    features = np.array([[
        days_to_due,
        num_dependencies,
        assignee_tasks,
        dept_tasks,
        priority_map.get(task["priority"], 1),
        status_map.get(task["status"], 0)
    ]])
    
    scaled_features = scaler.transform(features)
    prediction = model.predict(scaled_features)
    category_idx, score = prediction[0]
    category_idx = int(category_idx)
    
    # Validate category index
    if category_idx < 0 or category_idx >= len(label_encoder.classes_):
        print(f"Invalid category index {category_idx}, defaulting to Workflow")
        category = "Workflow"
    else:
        try:
            category = label_encoder.inverse_transform([category_idx])[0]
        except ValueError as e:
            print(f"Error decoding category {category_idx}: {e}, defaulting to Workflow")
            category = "Workflow"
    
    score = min(max(float(score), 0), 100)
    
    if category == "Deadlines":
        title = f"Pending Task with Past Due Date"
        description = f"Task \"{task['title']}\" is {task['status'].lower()} but its due date ({task['dueDate'].strftime('%Y-%m-%d')}) has passed."
        actions = ["Reschedule due date", "Investigate reason for delay", "Prioritize task completion"]
        impact = "High"
    elif category == "Dependencies":
        title = f"Dependency Bottleneck"
        description = f"Task \"{task['title']}\" is blocking {num_dependencies} dependent tasks."
        actions = ["Review dependencies", "Prioritize blocking task", "Communicate potential delays"]
        impact = "Medium"
    elif category == "Resources":
        title = f"Potential Resource Overload"
        description = f"Assignee of task \"{task['title']}\" has {assignee_tasks} active tasks, risking overload."
        actions = ["Review workload", "Reassign tasks if necessary", "Prioritize tasks"]
        impact = "Medium"
    else:
        title = f"Workflow Optimization"
        description = f"Task \"{task['title']}\" could be optimized for better workflow efficiency."
        actions = ["Monitor progress", "Consider alternative workflows"]
        impact = "Low"
    
    return {
        "id": str(uuid.uuid4()),
        "title": title,
        "description": description,
        "impact": impact,
        "category": category,
        "actions": actions,
        "createdAt": datetime.now().isoformat(),
        "score": score
    }

# Main function
def main():
    print("Starting ML agent")
    tasks = list(tasks_collection.find())
    
    if not tasks:
        print("No tasks, returning empty insights")
        print(json.dumps([]))
        return

    print("Checking for existing model")
    if os.path.exists("workflow_optimizer.keras"):
        print("Loading existing model")
        model = tf.keras.models.load_model("workflow_optimizer.keras")
        label_encoder = LabelEncoder()
        label_encoder.classes_ = np.load("label_encoder_classes.npy", allow_pickle=True)
        scaler = StandardScaler()
        scaler.mean_ = np.load("scaler_mean.npy", allow_pickle=True)
        scaler.scale_ = np.load("scaler_scale.npy", allow_pickle=True)
    else:
        print("Training new model")
        model, label_encoder, scaler = train_model()
        if model is None:
            print("Training failed, returning empty insights")
            print(json.dumps([]))
            return
    
    print("Generating insights")
    insights = [generate_insight(task, model, label_encoder, scaler) for task in tasks]
    
    print("Sorting insights")
    insights.sort(key=lambda x: x["score"], reverse=True)
    
    print("Outputting insights")
    print(json.dumps(insights, indent=2))

if __name__ == "__main__":
    main()