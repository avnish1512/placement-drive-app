# VS Code Web Debugging Setup

## 🚀 How to Run the App in Web Inside VS Code

### Method 1: Using Debug Launch (Recommended)

1. **Open VS Code's Run and Debug Panel**
   - Press `Ctrl+Shift+D` (Windows/Linux) or `Cmd+Shift+D` (Mac)
   - Or click the Run icon on the left sidebar

2. **Select a Configuration**
   - Click the dropdown showing "Run Web App" or choose:
     - `Launch Web App (Chrome)` - Opens in Chrome
     - `Launch Web App (Firefox)` - Opens in Firefox  
     - `Launch Web App (Edge)` - Opens in Edge Browser

3. **Click "Start Debugging"**
   - Press `F5` or click the green play button
   - This will:
     - Start the Expo web server automatically
     - Open your browser to `http://localhost:8081`
     - Attach the debugger for debugging

4. **Debug Your App**
   - Set breakpoints by clicking in the gutter
   - Use the debug toolbar to step through code
   - View variables in the left sidebar

### Method 2: Manual Web Server Start

If you prefer to start it manually:

```bash
npm run start-web
```

Then:
1. Open browser to `http://localhost:8081`
2. Attach debugger via VS Code Run menu

### Method 3: In Integrated Terminal

1. **Open Terminal in VS Code**
   - Press `Ctrl+Backtick` (or View > Terminal)

2. **Run the web server**
   ```bash
   npm run start-web
   ```

3. **Open in Browser**
   - Ctrl+Click on the URL in terminal output
   - Or manually visit `http://localhost:8081`

## 📋 Available Commands

### Start Web Server
```bash
npm run start-web
```
Starts web server on `http://localhost:8081`

### Start Web with Debug Output
```bash
npm run start-web-dev
```
Enhanced debug logging version

### Regular Dev Server
```bash
npm start
```
Universal dev server (interactive menu for iOS/Android/Web)

## 🔧 Debugging Features

### Breakpoints
- Click in the left gutter to set breakpoints
- Code execution pauses when breakpoint is reached
- Inspect variables in the Variables panel

### Console
- Use `console.log()` in your code
- Output appears in VS Code's Debug Console
- Can log objects and arrays

### Watch Expressions
- Right-click variables to "Add to Watch"
- Monitor variable changes in real-time

### Conditional Breakpoints
- Right-click breakpoint → Edit Breakpoint
- Set conditions (e.g., `count > 5`)
- Only pause when condition is true

## 🌐 Web App Routes

Once running, access these routes:

- **Home**: `http://localhost:8081/`
- **Login**: `http://localhost:8081/unified-login`
- **Student Dashboard**: `http://localhost:8081/(tab)`
- **Admin Dashboard**: `http://localhost:8081/admin-dashboard`
- **Messages**: `http://localhost:8081/(tab)/messages`
- **Jobs**: `http://localhost:8081/(tab)/jobs`

## ⚙️ Configuration Files

### `.vscode/tasks.json`
Defines the "Start Expo Web Server" task that launches the dev server

### `.vscode/launch.json`
Defines browser launch configurations:
- Chrome, Firefox, and Edge support
- Auto-starts web server via `preLaunchTask`
- Connects debugger to running browser

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9  # Mac/Linux
netstat -ano | findstr :8081   # Windows
```

### Browser Won't Open
- Manual URL: `http://localhost:8081`
- Check if server started (look for "Expo" output)
- Look for errors in Debug Console

### Debugger Not Attaching
- Ensure Chrome/Firefox is running
- Check firewall settings
- Restart VS Code's debug session

### Hot Reload Not Working
- Ensure you see "Watching files..." in terminal
- Try manual refresh in browser (F5)
- Check file permissions

## 📱 Testing Across Devices

Once web server is running, test on:

**Local Devices**
- Same machine: `http://localhost:8081`
- Other machine on network: `http://<YOUR-IP>:8081`
  (Find IP: `ipconfig` on Windows, `ifconfig` on Mac/Linux)

**Mobile Testing**
- Use browser's DevTools to test responsive design
- Chrome DevTools: `F12` → Device toolbar

## 💡 Tips

1. **Keep Debug Console Open** - Easier to see logs and errors
2. **Use Watch Expressions** - Monitor store state in real-time
3. **Test Responsiveness** - Use Chrome DevTools device emulation
4. **Hot Reload** - Changes auto-reload without restarting
5. **Props/State Inspection** - React DevTools extension recommended

---

**Ready?** Press `F5` to start debugging! 🚀
