# ThunderBolt CRM - Deployment Guide (Ubuntu VM)

This guide provides step-by-step instructions for deploying the ThunderBolt CRM (Django Backend + React Frontend) on an Ubuntu 22.04+ Virtual Machine with **PostgreSQL**.

---

## 1. System Preparation
Update the system and install core dependencies:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv nginx git postgresql postgresql-contrib libpq-dev
```

---

## 2. PostgreSQL Database Setup
Create a dedicated database and user for the CRM:
```bash
sudo -u postgres psql
```
Inside the prompt:
```sql
CREATE DATABASE thunderbolt;
CREATE USER thunderadmin WITH PASSWORD 'your_secure_password';
ALTER ROLE thunderadmin SET client_encoding TO 'utf8';
ALTER ROLE thunderadmin SET default_transaction_isolation TO 'read committed';
ALTER ROLE thunderadmin SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE thunderbolt TO thunderadmin;
\q
```

---

## 3. Clone and Setup Environment
Clone the repository and create a virtual environment:
```bash
git clone https://github.com/aunikml/thunderboltcrm.git
cd thunderboltcrm
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## 4. Configuration (.env)
Create a `.env` file in the root directory:
```bash
cp .env.example .env
nano .env
```
Ensure `GOOGLE_API_KEY`, `SECRET_KEY`, and all `DATABASE_*` fields are filled correctly.

---

## 5. Database & Static Files
Run migrations and prepare the AI Brain:
```bash
python manage.py migrate
python manage.py seed_agents  # Populate AI instructions
python manage.py collectstatic --no-input
```

---

## 6. Frontend Build (Vite)
Build the React production bundle:
```bash
cd frontend
npm install
npm run build
cd ..
```

---

## 7. Gunicorn Configuration (Service)
Create a systemd service file:
```bash
sudo nano /etc/systemd/system/thunderbolt.service
```
Paste the following (adjust paths to your user):
```ini
[Unit]
Description=Gunicorn instance for ThunderBolt CRM
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/thunderboltcrm
Environment="PATH=/home/ubuntu/thunderboltcrm/venv/bin"
ExecStart=/home/ubuntu/thunderboltcrm/venv/bin/gunicorn \
          --workers 3 \
          --bind unix:thunderbolt.sock \
          core.wsgi:application

[Install]
WantedBy=multi-user.target
```
Start the service:
```bash
sudo systemctl start thunderbolt
sudo systemctl enable thunderbolt
```

---

## 8. Nginx Configuration
Create an Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/thunderbolt
```
Paste the following (Replace `your_domain_or_ip`):
```nginx
server {
    listen 80;
    server_name your_domain_or_ip;

    # Frontend (React Build)
    location / {
        root /home/ubuntu/thunderboltcrm/frontend/dist;
        index index.html;
        try_files $uri /index.html;
    }

    # Static Files
    location /static/ {
        alias /home/ubuntu/thunderboltcrm/staticfiles/;
    }

    # Backend API
    location /api/ {
        include proxy_params;
        proxy_pass http://unix:/home/ubuntu/thunderboltcrm/thunderbolt.sock;
    }

    # Admin Panel
    location /admin/ {
        include proxy_params;
        proxy_pass http://unix:/home/ubuntu/thunderboltcrm/thunderbolt.sock;
    }
}
```
Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/thunderbolt /etc/nginx/sites-enabled
sudo nginx -t
sudo systemctl restart nginx
```
