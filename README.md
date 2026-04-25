# ThunderBolt CRM - Deployment Guide (Ubuntu VM)

This guide provides step-by-step instructions for deploying the ThunderBolt CRM (Django Backend + React Frontend) on an Ubuntu 22.04+ Virtual Machine.

---

## 1. System Preparation
Update the system and install core dependencies:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv nginx git
```

---

## 2. Clone and Setup Environment
Clone the repository and create a virtual environment:
```bash
git clone https://github.com/aunikml/thunderboltcrm.git
cd thunderboltcrm
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## 3. Configuration (.env)
Create a `.env` file in the root directory:
```bash
cp .env.example .env  # Or create a new one
nano .env
```
Ensure your `GOOGLE_API_KEY` and `SECRET_KEY` are set.

---

## 4. Database & Static Files
Run migrations and prepare the AI Brain:
```bash
python manage.py migrate
python manage.py seed_agents  # Populate AI instructions
python manage.py collectstatic --no-input
```

---

## 5. Frontend Build (Vite)
Build the React production bundle:
```bash
cd frontend
npm install
npm run build
cd ..
```

---

## 6. Gunicorn Configuration (Service)
Create a systemd service file to keep the backend running:
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

## 7. Nginx Configuration
Create an Nginx configuration to serve the frontend and proxy the backend:
```bash
sudo nano /etc/nginx/sites-available/thunderbolt
```
Paste the following:
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

    # Static Files (Django Admin/Assets)
    location /static/ {
        alias /home/ubuntu/thunderboltcrm/staticfiles/;
    }

    # Backend API (Gunicorn Proxy)
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
Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/thunderbolt /etc/nginx/sites-enabled
sudo nginx -t
sudo systemctl restart nginx
```

---

## 8. Final Verification
1. Open your browser and navigate to the VM IP.
2. Login with your admin credentials.
3. Test the **AI Agent Tuning** to ensure the brain is connected.
