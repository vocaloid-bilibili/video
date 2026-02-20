// server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs-extra");

const {
  PORT,
  DIR_DATA,
  DIR_DOWNLOADS,
  DIR_IMAGES,
  DIR_VIDEO_ROOT,
  DIR_AUDIO_CACHE,
  DIR_FULL_VIDEO,
  DIR_AVATAR,
  DIR_STAFF,
} = require("./config");
const apiRoutes = require("./routes/api");

fs.ensureDirSync(DIR_DATA);
fs.ensureDirSync(DIR_DOWNLOADS);
fs.ensureDirSync(DIR_IMAGES);
fs.ensureDirSync(DIR_VIDEO_ROOT);
fs.ensureDirSync(DIR_AUDIO_CACHE);
fs.ensureDirSync(DIR_AVATAR);
fs.ensureDirSync(DIR_STAFF);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/downloads", express.static(DIR_DOWNLOADS));
app.use("/downloads/full_videos", express.static(DIR_FULL_VIDEO));
app.use("/video", express.static(DIR_VIDEO_ROOT));
app.use("/config/avatar", express.static(DIR_AVATAR));
app.use("/config/staff", express.static(DIR_STAFF));

app.use("/api", apiRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
