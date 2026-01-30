const express = require("express");
const app = express();
const http = require("http");
const bodyParser = require("body-parser");
const dotenv = require("dotenv").config();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const socketIo = require("socket.io");
const fs = require("fs");
const axios = require("axios");
const db = require("./models");
const {upload, uploadingFileSize} = require("./src/middleware/upload");
const indexRoutes = require("./src/routes/index.routes");
const { initSocket } = require("./src/service/common/socket.service");
const { soketAuthMiddleware } = require("./src/middleware/authMiddleware");
const path = require("path");
const { updateUser } = require("./src/service/repository/user.service");
const { Op } = require('sequelize');
const { getLanguages, createLanguageTranslation } = require("./src/service/repository/Language.service");
const { default_entries } = require("./src/service/repository/default_entries.service");
const { likeanalysisadvanced, Like_anaLyzer } = require("./src/controller/like_controller/like.controller");
const { AccessToken } = require("livekit-server-sdk");

let port = process.env.Port;
// port = 3001;    

// Create the HTTP server
const server = http.createServer(app);

// Middleware for CORS
app.use(cors({
    origin: "*",
}));

// Set up the socket server
const io = socketIo(server, {
    cors: {
        origin: true,
    },
    path: '/socket', 
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Custom middleware for handling user/socket association
io.use(soketAuthMiddleware);
initSocket(io);

// server files without validations first


app.use((req, res, next) => {
    if (req.path === "/api/validate" ||
        req.path.startsWith("/admin")) {
        // Allow the validation route to be accessed without validation
        return next();
    }

    // Apply purchase code validation to everything else
    // uploadingFileSize(req, res, next);
});
// app.post("/api/validate", Like_anaLyzer);


app.use("/admin", express.static(path.join(__dirname, "admin")));
app.use(express.static(path.join(__dirname, "public")));

app.use("/uploads", express.static("uploads"));


app.post('/api/livekit/ll', async (req, res) => {
  try {
    const { roomName, userId=1 } = req.body;

    if (!roomName || !userId) {
      return res.status(400).json({ error: "roomName and userId required" });
    }

    console.log(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, userId, roomName);
    const token = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity: userId,
        ttl: "2h",
      }
    );

    token.addGrant({
        room: "room_name",
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });
    const jwt = await token.toJwt();
  console.log(jwt, "----------------------ss-------------");
    res.json({
      token: jwt,
      url: process.env.LIVEKIT_URL,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})



// Middleware for handling file uploads and parsing request bodies

// app.use(upload.array("files"));
app.use((req, res, next) => {
    // Handle 'product_image' and 'files' fields separately
    upload.fields([
        { name: 'product_video', maxCount: 5 }, // Handle product_image field
        { name: 'files', maxCount: 50 },
        { name: 'app_logo_light', maxCount: 50 },
        { name: 'app_logo_dark', maxCount: 50 },
        { name: 'splash_image', maxCount: 50 },
        { name: 'web_logo_light', maxCount: 50 },
        { name: 'web_logo_dark', maxCount: 50 },
    ])(req, res, (err) => {

        if (err) {
            return next(err); // Handle errors during file upload
        }

        if (req?.files?.['web_logo_dark']) {
            req.web_logo_dark = req.files['web_logo_dark'];  // Assign to req.product_image
        }
        else {
            req.web_logo_dark = [];  // Ensure it's an empty array if not found
        }
        if (req?.files?.['web_logo_light']) {
            req.web_logo_light = req.files['web_logo_light'];  // Assign to req.product_image
        }
        else {
            req.web_logo_light = [];  // Ensure it's an empty array if not found
        }
        if (req?.files?.['splash_image']) {
            req.splash_image = req.files['splash_image'];  // Assign to req.product_image
        }
        else {
            req.splash_image = [];  // Ensure it's an empty array if not found
        }
        if (req?.files?.['app_logo_dark']) {
            req.app_logo_dark = req.files['app_logo_dark'];  // Assign to req.product_image
        }
        else {
            req.app_logo_dark = [];  // Ensure it's an empty array if not found
        }

        if (req?.files?.['app_logo_light']) {
            req.app_logo_light = req.files['app_logo_light'];  // Assign to req.product_image
        }

        else {
            req.app_logo_light = [];  // Ensure it's an empty array if not found
        }
        if (req?.files?.['product_video']) {
            req.product_video = req.files['product_video'];  // Assign to req.product_image
            // req.product_video.forEach((file, index) => {
            //     console.log(`product_video[${index}]: ${file.originalname} - ${file.size} bytes`);
            // });
        }

        else {
            req.product_video = [];  // Ensure it's an empty array if not found
        }

        if (req?.files?.['files']) {
            req.files = req.files['files']; // Assign to req.files
            // req.files.forEach((file, index) => {
            //     console.log(`files[${index}]: ${file.originalname} - ${file.size} bytes`);
            // });
        } else {
            req.files = []; // Ensure it's an empty array if not found
        }

        next(); // Continue to the next middleware or route handler
    });
});


app.use("/api", indexRoutes);

app.get("/admin/*", (req, res) => {
    res.sendFile(path.join(__dirname, "admin", "index.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Something went wrong!", success: false });
});

// Sync database and start server
db.sequelize.sync({
    alter: false,
    force: false
}).then(async () => {
    const tokenFilePath = path.join(__dirname, "validatedToken.txt");
    if (fs.existsSync(tokenFilePath)) {
        const isValid = await likeanalysisadvanced();
        if (!isValid) {
        }
    }
    else {

    }
    const language_list = await getLanguages()
    const languagelist = await language_list.Records.map((lang) => {
        return lang.dataValues.language;
    });
    if (languagelist && languagelist.length > 0) {
        for (let index = 0; index < languagelist.length; index++) {
            const element = languagelist[index];
            await createLanguageTranslation({ language: element });
        }
    } else {
        console.log("No languages found.");
    }
    await updateUser(
        { socket_id: '' },
        { socket_id: { [Op.ne]: '' } } // Only where socket_id is not empty
    );
    default_entries()
    console.log("Database Connected ✅!");
    server.listen(port, () => {
        console.log(`Server listening on port ${port}!`);
    });
}).catch((error) => {
    console.error("Sequelize sync error:", error);
});
