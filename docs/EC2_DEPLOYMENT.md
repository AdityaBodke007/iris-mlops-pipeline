# Experiment 8: Deploying Docker to AWS EC2

This guide walks you through deploying your containerized FastAPI application on a public AWS EC2 instance.

## 1. Launching the EC2 Instance

1. Log in to the [AWS Management Console](https://aws.amazon.com/console/).
2. Navigate to **EC2** and click **Launch Instance**.
3. **Name:** `mlops-api-server`
4. **AMI:** Choose **Ubuntu 24.04 LTS** (Free Tier eligible).
5. **Instance Type:** `t2.micro` (Free Tier eligible).
6. **Key Pair:** Create a new key pair or select an existing one (e.g., `mlops-key.pem`). Safely store it on your computer.
7. **Network Settings (Security Groups):**
   - Click **Allow SSH traffic** from **Anywhere (0.0.0.0/0)**.
   - Click **Edit** and add a **Custom TCP Rule** for Port `8000` from `0.0.0.0/0`.
8. Click **Launch Instance**.

## 2. Connect to Your EC2 Instance

Open PowerShell or Terminal on your local machine and navigate to the folder containing your key pair:

```bash
# Correct permissions on the Key Pair (Linux/Mac only, Windows can skip this)
chmod 400 mlops-key.pem

# Connect via SSH
ssh -i "mlops-key.pem" ubuntu@<YOUR-EC2-PUBLIC-IP>
```

> **Note**: You can find your Public IP Address by selecting your running instance in the EC2 Console.

## 3. Install Docker on EC2

Run these commands on your EC2 terminal to install Docker and start the service:

```bash
# Update package list
sudo apt-get update -y

# Install Docker
sudo apt-get install docker.io -y

# Start Docker daemon
sudo systemctl start docker

# Enable Docker to start on reboot
sudo systemctl enable docker

# Give the 'ubuntu' user permissions to run Docker commands
sudo usermod -aG docker ubuntu
```

> **Important**: You must exit your SSH session (`exit`) and log back in for the user permissions to take effect. Log back in with the same `ssh` command.

## 4. Deploy Your Application

If your GitHub Actions pipeline successfully pushed your image to DockerHub, you can just pull it!

```bash
# Pull the latest image
docker pull your-dockerhub-username/iris-ml-api:latest

# Run the container in detached mode on Port 8000
docker run -d -p 8000:8000 your-dockerhub-username/iris-ml-api:latest
```

## 5. Test Live Application!

Your API is now live on the internet! From your local computer, open Postman and create a new request:
- **URL**: `http://<YOUR-EC2-PUBLIC-IP>:8000/predict`
- **Method**: POST
- **Headers**:
  - `X-API-Key: supersecretapikey`
  - `Content-Type: application/json`
- **Body** (raw JSON):
  ```json
  {
      "features": [5.1, 3.5, 1.4, 0.2]
  }
  ```

If you receive a predicted class, **CONGRATULATIONS! You have successfully deployed to the cloud!**
