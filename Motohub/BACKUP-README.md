# Free Firestore Backup Solution

This is a completely FREE backup solution for your MotoHub Firestore database.

## Setup Instructions

### 1. Get Firebase Service Account Key

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Go to **Project Settings** (gear icon)
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save the file as `firebaseServiceAccountKey.json` in this project folder
7. **IMPORTANT:** Add to `.gitignore` to keep it secure!

### 2. Install Dependencies

```bash
npm install firebase-admin
```

### 3. Manual Backup (Run Anytime)

```bash
node backup-script.js
```

This will create a backup in `backups/[timestamp]/firestore-backup.json`

### 4. Setup Automatic Daily Backups at 8 PM

#### Windows:

1. Open **Task Scheduler**
2. Click **Create Basic Task**
3. Name: "Firestore Daily Backup"
4. Trigger: **Daily** at **8:00 PM**
5. Action: **Start a program**
   - Program: `C:\Projects\Capstone\Capstone-Project\run-backup.bat`
6. Click **Finish**

#### Mac/Linux:

1. Open terminal
2. Run: `crontab -e`
3. Add this line:
   ```
   0 20 * * * cd /path/to/Capstone-Project && node backup-script.js >> backup-log.txt 2>&1
   ```
4. Save and exit

### 5. Restore from Backup

```bash
node restore-script.js backups/2025-12-04_20-00-00/firestore-backup.json
```

## Backup Storage

- **Location:** `backups/` folder in your project
- **Format:** JSON (human-readable)
- **Cost:** $0 (stored on your local computer)
- **Size:** Typically 1-50 MB depending on data

## Additional Free Storage Options

### Option A: Upload to GitHub (Free)

```bash
# After backup runs
git add backups/
git commit -m "Daily backup $(date)"
git push origin main
```

⚠️ **Note:** Only if your repo is private!

### Option B: Upload to Google Drive (Free 15 GB)

Install rclone: https://rclone.org/

```bash
# Configure Google Drive
rclone config

# Upload backups
rclone copy backups/ gdrive:MotoHub-Backups/
```

### Option C: Upload to Dropbox (Free 2 GB)

Use Dropbox desktop app - just save backups to your Dropbox folder!

## Backup Schedule

- **Daily:** 8:00 PM (closing time)
- **Retention:** Keep all backups (you can manually delete old ones)
- **Duration:** Takes 1-5 minutes depending on data size

## What Gets Backed Up

✅ All users and their profiles  
✅ All vehicles and service history  
✅ All promotions  
✅ All inventory items  
✅ All service reports  
✅ All system logs  
✅ All subcollections (cars under users, etc.)

## Security Notes

1. **Never commit** `firebaseServiceAccountKey.json` to git
2. Keep backups in a **secure location**
3. Backups contain **all user data** - treat as sensitive
4. Consider **encrypting** backup files for extra security

## Troubleshooting

### "Cannot find module 'firebase-admin'"
```bash
npm install firebase-admin
```

### "Permission denied"
Make sure `run-backup.bat` has execute permissions

### "Service account key not found"
Download the key from Firebase Console and save as `firebaseServiceAccountKey.json`

## Cost Analysis

| Solution | Monthly Cost |
|----------|--------------|
| This Free Solution | **$0** |
| Google Cloud Storage | ~$0.20-$2.00 |
| Firebase Scheduled Exports | ~$0.20-$2.00 |

## Support

For issues or questions, contact the development team.
