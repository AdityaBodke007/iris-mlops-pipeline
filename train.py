import pickle
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

def main():
    print("Loading Iris dataset...")
    data = load_iris()
    X, y = data.data, data.target
    
    # Split the dataset
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training RandomForest model...")
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate
    predictions = model.predict(X_test)
    accuracy = accuracy_score(y_test, predictions)
    print(f"Model accuracy: {accuracy:.4f}")
    
    # Expt 1: Save the model using Pickle
    model_filename = "model.pkl"
    print(f"Saving model to {model_filename}...")
    with open(model_filename, "wb") as f:
        pickle.dump(model, f)
        
    # Expt 1: Verify the model loads
    print("Verifying model can be loaded...")
    with open(model_filename, "rb") as f:
        loaded_model = pickle.load(f)
        
    test_prediction = loaded_model.predict(X_test[:1])
    print(f"Loaded model prediction for first test sample: {test_prediction[0]} (Expected: {y_test[0]})")
    print("Experiment 1 complete: Model successfully trained and saved!")

if __name__ == "__main__":
    main()
