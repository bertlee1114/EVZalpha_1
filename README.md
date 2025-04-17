# Plants vs Zombies Clone

## Project Overview
This is a Plants vs Zombies clone game built with HTML, CSS, and JavaScript. The game features plants, zombies, and a cat character that can attack zombies.

## Files in the Project
- `index.html` - The main HTML file that structures the game
- `styles.css` - CSS styles for the game
- `game.js` - JavaScript code that powers the game logic
- `images/` - Directory containing SVG images for game elements

## How to Upload to GitHub

### Prerequisites
1. **Install Git**: Download and install Git from [git-scm.com](https://git-scm.com/downloads)
2. **Create a GitHub Account**: If you don't have one, sign up at [github.com](https://github.com/)

### Steps to Upload to GitHub

1. **Install Git** (if not already installed)
   - Download Git from [git-scm.com](https://git-scm.com/downloads)
   - Follow the installation instructions for your operating system
   - Restart your computer after installation

2. **Initialize Git Repository**
   - Open Command Prompt or PowerShell in your project folder (EVZ)
   - Run: `git init`

3. **Add Files to Git**
   - Run: `git add .`

4. **Commit Changes**
   - Run: `git commit -m "Initial commit of Plants vs Zombies clone"`

5. **Create a New Repository on GitHub**
   - Go to [github.com](https://github.com/) and log in
   - Click the '+' icon in the top right and select 'New repository'
   - Name your repository (e.g., "plants-vs-zombies-clone")
   - Do not initialize with README, .gitignore, or license
   - Click 'Create repository'

6. **Link Local Repository to GitHub**
   - GitHub will show commands to push an existing repository
   - Copy and run the commands that look like:
     ```
     git remote add origin https://github.com/YOUR-USERNAME/plants-vs-zombies-clone.git
     git branch -M main
     git push -u origin main
     ```

7. **Verify Upload**
   - Refresh your GitHub repository page to see your uploaded files

## Additional Tips
- You may need to authenticate with GitHub when pushing for the first time
- Consider adding a `.gitignore` file to exclude unnecessary files
- Update this README with more details about your game as needed