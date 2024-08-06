# cloud_computing
-------------------------------------------------------------------------------------
RUNNING JUST WITH NODE
-------------------------------------------------------------------------------------
npm init -y voor package json
npm install voor package json lock
node server.js run app
-------------------------------------------------------------------------------------
RUNNING JUST WITH DOCKER
-------------------------------------------------------------------------------------
docker network create cloud-computing-network
cd frontend-backend
docker build -t front-backend-image .
docker run --network=cloud-computing-network --name=front-backend-container -e TZ=Europe/Brussels -p 3000:3000 front-backend-image

cd image-predict
docker build -t predict-image .
docker run --network=cloud-computing-network --name=image-predict-container -p 8002:8002 predict-image

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
-------------------------------------------------------------------------------------
C:\Users\alexa\Desktop\cloud-computing\frontend-backend>minikube docker-env
SET DOCKER_TLS_VERIFY=1
SET DOCKER_HOST=tcp://127.0.0.1:18712
SET DOCKER_CERT_PATH=C:\Users\alexa\.minikube\certs
SET MINIKUBE_ACTIVE_DOCKERD=minikube
REM To point your shell to minikube's docker-daemon, run:
REM @FOR /f "tokens=*" %i IN ('minikube -p minikube docker-env --shell cmd') DO @%i

C:\Users\alexa\Desktop\cloud-computing\frontend-backend>@FOR /f "tokens=*" %i IN ('minikube -p minikube docker-env --shell cmd') DO @%i
-------------------------------------------------------------------------------------
docker desktop running & minikube start

cd mysql-kube
kubectl apply -f mysql-pv.yaml
kubectl apply -f mysql-pvc.yaml
kubectl apply -f mysql-configmap.yaml
kubectl apply -f mysql-deployment.yaml
kubectl apply -f mysql-service.yaml

kubectl get all

kubectl exec -it mysql-68fc744f69-qf7l4 -- mysql -uroot -p

USE images;
CREATE TABLE images_table (
    id INT PRIMARY KEY AUTO_INCREMENT,
    image LONGTEXT NOT NULL,
    creation_date DATETIME NOT NULL,
    upload_zone INT NOT NULL,
    head_count INT NOT NULL
);

cd image-predict
docker build -t predict-image .
kubectl apply -f image-predict-deployment.yaml

kubectl get all

cd frontend-backend
docker build -t front-backend-image .
kubectl apply -f frontend-backend-deployment.yaml

kubectl get all

minikube service --all (minikube tunnel)
-------------------------------------------------------------------------------------
minikube addons enable metrics-server

kubectl autoscale deployment frontend-backend --max=10 --min=1 --cpu-percent=70
kubectl autoscale deployment image-predict --max=10 --min=1 --cpu-percent=30

autocannon -c 100 -d 60 http://127.0.0.1:15162/