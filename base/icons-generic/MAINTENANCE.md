## Update process:

### Download changes from SharePoint

`npm run upgrade -- <SHAREPOINTPATH>`

### Check for breaking changes

`git status`

- a deleted SVG would mean a breaking change
- for all modified SVGs check the visual differences, if they seem breaking, ask visual designers why they did not create a new version of the file
- check if the files got deoptimized (no longer minified)
- may need to wait until visual designers resolve the changes


### Create colored copies of the icons

`npm run color-icons`

### Commit changes

`git add` what's needed and `git commit`

### Bump NPM package version:

`npm version minor/major/patch`