# GitHub Actions Cloud Backup Setup

This will run your Firestore backup **automatically in the cloud** at 8 PM daily using GitHub Actions (FREE).

## Setup Steps:

### 1. Add Firebase Service Account to GitHub Secrets

1. Go to your GitHub repository: https://github.com/D-reev/Capstone-Project
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `FIREBASE_SERVICE_ACCOUNT`
5. Value: Copy the **entire contents** of `firebaseServiceAccountKey.json`
6. Click **Add secret**

### 2. Push These Files to GitHub

```bash
git add .github/workflows/firebase-backup.yml
git add .gitignore
git add Motohub/backup-script.cjs
git add Motohub/restore-script.cjs
git commit -m "Add automated cloud backup with GitHub Actions"
git push
```

### 3. Verify Setup

1. Go to your GitHub repository
2. Click the **Actions** tab
3. You should see "Daily Firebase Backup" workflow
4. Click **Run workflow** to test it manually
5. Wait 2-3 minutes for it to complete

### 4. Download Backups

After the workflow runs:
1. Go to **Actions** tab
2. Click on a completed workflow run
3. Scroll down to **Artifacts**
4. Download `firestore-backup-[timestamp].zip`
5. Extract to see your backup JSON files

## How It Works:

- **When:** Every day at 8:00 PM Philippine Time (12:00 PM UTC)
- **Where:** GitHub's cloud servers (FREE)
- **Storage:** GitHub Artifacts (kept for 30 days)
- **Cost:** $0 (GitHub Actions free tier: 2,000 minutes/month)

## Manual Backup:

To run a backup anytime:
1. Go to **Actions** tab on GitHub
2. Click **Daily Firebase Backup**
3. Click **Run workflow** button
4. Select branch: `main`
5. Click **Run workflow**

## Restore from Cloud Backup:

1. Download backup from GitHub Actions artifacts
2. Extract the ZIP file
3. Run locally:
   ```bash
   cd Motohub
   node restore-script.cjs backups/[timestamp]/firestore-backup.json
   ```

## Advantages:

✅ Runs automatically in the cloud  
✅ No need to keep your computer on  
✅ FREE (GitHub Actions)  
✅ Backups stored for 30 days  
✅ Can be triggered manually anytime  
✅ Works with any push to GitHub  
✅ Independent of Vercel deployment  

## Important Notes:

- ⚠️ **NEVER** commit `firebaseServiceAccountKey.json` to GitHub
- ✅ The key is stored securely in GitHub Secrets
- ✅ Backups are stored in GitHub Artifacts (private to your repo)
- ✅ You can download backups anytime from the Actions tab

## Troubleshooting:

**"Secret not found"**
- Make sure you added `FIREBASE_SERVICE_ACCOUNT` secret correctly

**"Workflow not running"**
- Check if the cron schedule is correct for your timezone
- Try manually triggering it first

**"Backup failed"**
- Check the workflow logs in the Actions tab
- Verify the service account key has proper permissions

Your backups are now automated in the cloud! 🎉
