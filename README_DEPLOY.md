# Notary Dashboard Deployment Guide

This project is a bilingual (EN/ID) Banking Notary Dashboard.

## Features
- **Bilingual**: English and Bahasa Indonesia support.
- **Role-based UI**: Different views for Notary (Admin) and Team Members.
- **Workflow**: Task assignment (mock), result uploading, and approval/rejection cycle.
- **Notifications**: Simulated email notifications and UI toasts.

## Deployment Instructions (Ubuntu 22.04)

1. **Connect to your server** via SSH.
2. **Transfer the files** or clone the repository (if already pushed):
   ```bash
   git clone https://github.com/sulhanrohman/notary.git
   cd notary
   ```
3. **Run the deployment script**:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```
   *Note: Edit `deploy.sh` first to change the database password.*

## GitHub Push Instructions

To push this code to your repository `https://github.com/sulhanrohman/notary`, run these commands in your local terminal:

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "feat: initial notary dashboard with bilingual support and deployment scripts"

# Add remote
git remote add origin https://github.com/sulhanrohman/notary.git

# Push
# You will need a Personal Access Token (PAT) for this
git branch -M main
git push -u origin main
```

## Tech Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Animation**: Motion (motion/react)
- **i18n**: i18next
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Server (Deployment)**: Nginx (Static Serving)
- **Database**: PostgreSQL (Provisioned in script)
