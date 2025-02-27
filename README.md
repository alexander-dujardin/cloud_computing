# Cloud Computing

## Author

Alexander Dujardin - 0592036

## Project Overview

Crowdy is a startup aiming to help citizen science analysts by providing them with next-gen software to analyze crowded areas in cities. It offers real-time "privacy-aware" head counting software by providing a monitoring dashboard with aggregated results originating from picture processing. Cameras are deployed in specific areas to capture images of crowds, which are then uploaded to a server for further processing and analysis, i.e., head counting. The images, along with their creation time and head count, are stored in a database for future analysis. The dashboard includes per city camera: the latest image, the latest head count, and a global head count per camera. It also provides a real-time global head count chart. The image head counting software uses object detection techniques to identify and count humans. This head counting software runs on a server in the US, which means the data crosses European borders, raising privacy concerns (blurring heads).

Also important besides the functionalities:
1. Fault-tolerant, ensuring continuous operation and isolation of failures.
2. Optimized for resource allocation, considering the predictability of camera numbers and the CPU-intensive nature of edge detection.

## Technology Stack

- Frontend & Backend: HTML, CSS, JavaScript, Node.js
- Machine Learning: TensorFlow for image-based head count predictions
- Databases: MySQL with persistent volume storage
- Real-time: Socket.IO for live data streaming
- Containerization & Orchestration: Docker and Kubernetes (Minikube for local testing)


## Instructions

### Prerequisites

Install Docker, Kubernetes add-on, Minikube, node.js and npm

### Running

1. Ensure Docker is running
2. Start minikube
```
minikube start
```
3. Deploy MySQL
```
cd mysql-kube
kubectl apply -f mysql-pv.yaml
kubectl apply -f mysql-pvc.yaml
kubectl apply -f mysql-configmap.yaml
kubectl apply -f mysql-deployment.yaml
kubectl apply -f mysql-service.yaml
```
4. Set up the database (pw: root)
```
kubectl exec -it <mysql-pod-name> -- mysql -uroot -p
USE images;
CREATE TABLE images_table (
    id INT PRIMARY KEY AUTO_INCREMENT,
    image LONGTEXT NOT NULL,
    creation_date DATETIME NOT NULL,
    upload_zone INT NOT NULL,
    head_count INT NOT NULL
);
```
5. Deploy the image prediction service
```
cd ../image-predict
docker build -t predict-image .
kubectl apply -f image-predict-deployment.yaml
```
6. Deploy the frontend-backend services:
```
cd ../frontend-backend
@FOR /f "tokens=*" %i IN ('minikube -p minikube docker-env --shell cmd') DO @%i
docker build -t front-backend-image .
kubectl apply -f frontend-backend-deployment.yaml
```
7. Enable autoscaling (HPA)
```
minikube addons enable metrics-server
kubectl autoscale deployment frontend-backend --max=10 --min=1 --cpu-percent=70
kubectl autoscale deployment image-predict --max=10 --min=1 --cpu-percent=30
```
8. Start the application
```
minikube service -all
```
For testing the autoscaling:
```
autocannon -c 100 -d 60 http://127.0.0.1:15162/
```

## Extra for running only with Docker:
```
docker network create cloud-computing-network
cd frontend-backend
docker build -t front-backend-image .
docker run --network=cloud-computing-network --name=front-backend-container -e TZ=Europe/Brussels -p 3000:3000 front-backend-image
cd ..
cd image-predict
docker build -t predict-image .
docker run --network=cloud-computing-network --name=image-predict-container -p 8002:8002 predict-image
cd ..
docker pull mysql
docker run --network=cloud-computing-network --name mysql-container -e TZ=Europe/Brussels -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=images -p 3306:3306 -d mysql:latest
docker exec -it mysql-container mysql -uroot -p
USE images;
CREATE TABLE images_table (
    id INT PRIMARY KEY AUTO_INCREMENT,
    image LONGTEXT NOT NULL,
    creation_date DATETIME NOT NULL,
    upload_zone INT NOT NULL,
    head_count INT NOT NULL
);
```