const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { v2: cloudinary } = require("cloudinary");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));

// MongoDB Schema
const SongSchema = new mongoose.Schema({
  title: String,
  artist: String,
  cover: String,
  url: String,
  duration: String,
  genre: String,
  language: String,
  public_id: String, // 🔑 Required for deletion from Cloudinary
});
const Song = mongoose.model("Song", SongSchema);

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET
});

// Routes

// Get all songs
app.get("/songs", async (req, res) => {
  const songs = await Song.find().sort({ _id: -1 });
  res.json(songs);
});

// Delete song
app.delete("/songs/:id", async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return res.status(404).json({ error: "Song not found" });

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(song.public_id, { resource_type: "video" });

    // Delete from MongoDB
    await Song.findByIdAndDelete(req.params.id);

    res.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
