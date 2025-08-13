@echo off
echo Installing recharts dependency...
call npm install

echo.
echo Adding changes to git...
call git add .

echo.
echo Committing changes...
call git commit -m "Add recharts dependency to fix chart components"

echo.
echo Pushing to GitHub...
call git push origin main

echo.
echo Done! Now go to Vercel and redeploy the project.
echo The recharts dependency has been added and pushed to GitHub.
pause
