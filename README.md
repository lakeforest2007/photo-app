# Photo-sharing Web Application

## App Walkthrough
Watch this to see key features of the app: https://www.youtube.com/watch?v=X7yAoOcIoNg&ab_channel=JiahongWang

## Project overview

My goal was to develop a full-stack web application that allows users to upload and share photos and directly interact with other users through commenting and mentions. 
This was a 3-week long, individual project that taught me a lot about how to set up backend database and web servers such that they seamlessly interact with the frontend UI to create a single-page app that loads everything programatically.

## Application architecture

- Frontend frameworks/libraries: ReactJS, Material-UI
- Backend frameworks: MongoDB, Node.js with Express
  (note: initially, API calls were handled by AJAX)

I used ReactJS because I wanted to create reusable UI components since the project requires that it is a single-page web application. A tradeoff using React is that page loading might be slower than if we were to use pure HTML/CSS. I used Node.js because the open-source script has less overhead than other frameworks. Also, Node.js handles client requests asynchronously, suitable for data-intensive applications like this project. I used MongoDB because it provides a easy way to store data models in a JSON format, which can be then mapped to native objects with Javascript.

## How you can interact with the project

1. Clone this git repository
2. Open the project in your favorite IDE and use `npm install` to fetch the dependant software packages
3. Install MongoDB and run it with `mongod [arguments]`
4. Load the photo app dataset into the data server with the command `node loadDatabase.js`
5. And start the Node.js web server with `node webServer.js` 

## Future stories

If I had more time I would:
- Use feature branches
- Have pop-up alerts be integrated into the actual UI
- Use salted passwords for better security
- Enhance app speed with lazy loading photos/images
- Write my own unit tests
- Deploy the app to Heroku

## Lessons learned

- Must validate session state in both the frontend and the backend in case of man in the middle attacks
- Check user input errors as early and as frequently as possible - this provides a better user experience

