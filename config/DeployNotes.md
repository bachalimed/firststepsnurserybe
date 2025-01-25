

 notes on deploying back end
1. allowed origins: remove local host and add the website address
2. corsoptions: remove !origin
3. env file should be on the gitignore and not published to github
4. check multer save file ./uploads for productin and ../uploads for dev
5. in authcontroller: secure true for production