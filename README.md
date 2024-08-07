# Cloud Computing Project - Alexander Dujardin

## Prerequisites

- Docker installed and running
- Minikube installed and running
- Node.js and npm installed

In each directory:
```
npm init -y
npm install 
in all
```
-------------------------------------------------------------------------------------
## RUNNING JUST WITH DOCKER
-------------------------------------------------------------------------------------
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
-------------------------------------------------------------------------------------
### RUNNING IN KUBERNETES CLUSTER
-------------------------------------------------------------------------------------
```
minikube start

cd mysql-kube
kubectl apply -f mysql-pv.yaml
kubectl apply -f mysql-pvc.yaml
kubectl apply -f mysql-configmap.yaml
kubectl apply -f mysql-deployment.yaml
kubectl apply -f mysql-service.yaml
kubectl get po
kubectl exec -it <pod name> -- mysql -uroot -p
USE images;
CREATE TABLE images_table (
    id INT PRIMARY KEY AUTO_INCREMENT,
    image LONGTEXT NOT NULL,
    creation_date DATETIME NOT NULL,
    upload_zone INT NOT NULL,
    head_count INT NOT NULL
);
cd ..

cd image-predict
REM @FOR /f "tokens=*" %i IN ('minikube -p minikube docker-env --shell cmd') DO @%i
docker build -t predict-image .
kubectl apply -f image-predict-deployment.yaml
cd ..

cd frontend-backend
REM @FOR /f "tokens=*" %i IN ('minikube -p minikube docker-env --shell cmd') DO @%i
docker build -t front-backend-image .
kubectl apply -f frontend-backend-deployment.yaml
cd ..

kubectl get all

minikube addons enable metrics-server

kubectl autoscale deployment frontend-backend --max=10 --min=1 --cpu-percent=70
kubectl autoscale deployment image-predict --max=10 --min=1 --cpu-percent=30

minikube service --all (minikube tunnel)
```

for testing:
```
autocannon -c 100 -d 60 http://127.0.0.1:15162/
```