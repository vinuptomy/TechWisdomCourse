# Cache Clearing Guide

If you're not seeing the latest changes (like the Position field, Downloads note, or Edit buttons), follow these steps:

## Method 1: Hard Refresh (Recommended)
- **Windows/Linux:** Press `Ctrl + Shift + R` or `Ctrl + F5`
- **Mac:** Press `Cmd + Shift + R`
- This forces the browser to reload all assets from the server

## Method 2: Clear Browser Cache
1. Open Developer Tools (F12)
2. Right-click on the refresh button
3. Select "Empty Cache and Hard Reload"

## Method 3: Clear All Site Data
1. Open Developer Tools (F12)
2. Go to the "Application" tab (Chrome) or "Storage" tab (Firefox)
3. Click "Clear site data" or "Clear storage"
4. Check all boxes and click "Clear"

## Method 4: Incognito/Private Window
- Open the app in an incognito/private window to bypass cache entirely
- **Chrome:** `Ctrl + Shift + N` (Windows) or `Cmd + Shift + N` (Mac)
- **Firefox:** `Ctrl + Shift + P` (Windows) or `Cmd + Shift + P` (Mac)

## Method 5: Restart Dev Server
If you're running a development server:
1. Stop the server (Ctrl + C)
2. Delete the `dist` folder (if it exists)
3. Delete `node_modules/.vite` folder (if it exists)
4. Restart the server: `npm run dev`

## What to Look For After Clearing Cache:
✅ **Position field** should appear in the "Add New Chapter" form
✅ **Downloads note** should appear below the Position field
✅ **Edit button** should appear next to each chapter in the list
✅ **Downloads button** should appear next to each chapter showing the count

## If Still Not Working:
1. Check the browser console (F12) for any errors
2. Verify you're running the latest code: `git pull` (if using git)
3. Rebuild the project: `npm run build` then `npm run dev`
4. Try a different browser to rule out browser-specific issues

