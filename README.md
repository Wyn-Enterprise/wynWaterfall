# wynWaterfall
Waterfall Chart custom data visualization for WynDashboards

------------------------------------------------------
Steps to run the sample:
1. Install wyn-visual-tools globally. Run 'npm install @grapecity/wyn-visual-tools -g ' from command prompt.
2. Change directory to the sample's location and run 'npm install' to install all required modules.
3. Run 'wyn-visual-tools develop' to start the development server.
4. Open Wyn Enterprise portal in your browser. Go to Admin Portal > Dashboards Settings and enable the developer mode.
5. Go back to Document Portal, open an existing Dashboard or create a new one. Then add a dev tools scenario from Custom Visualization tab on to the Dashboard Designer.
6. Develop the custom visual using visual api. We suggest to develop it using typescript and less as we have prepared the work flow to make it easy to build.
7. Click Refresh button on action bar of the visual to reload the visual.

Steps to generate .viz file:
1. Update the version in package.json and visual.json before release.
2. Pack the visual by build tools. Run 'wyn-visual-tools package' command. This command will generate a file with extension 'viz'.
3. Upload the viz file to your Wyn Enterprise server using the Resource Portal.
4. The visual will appear under the Custom Visualization tab on the Dashboard Designer.

Optional Steps:
1. Edit the visual.json to include some meta info about this visual.
2. Edit the capabilities.json to add configuration about data bind, inspector, action bar.
3. Add i18n resource to i18nResources folder.
4. Add image to assets folder.