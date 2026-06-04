const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { Proofs } = require("../db");
const { adminAuth } = require("../middleware/adminAuth");

const router = express.Router();

const UPLOAD_DIR = path.resolve(__dirname, "..", "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, safe);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (!/^image\//.test(file.mimetype)) {
      return cb(new Error("Chỉ chấp nhận file ảnh."));
    }
    cb(null, true);
  },
});

const fileToUrl = (req, filename) => {
  const host = `${req.protocol}://${req.get("host")}`;
  return `${host}/uploads/${filename}`;
};

router.get("/", (_req, res) => {
  res.json(Proofs.list());
});

router.post("/upload", adminAuth, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Không có file." });
  res.status(201).json({ url: fileToUrl(req, req.file.filename) });
});

router.post("/", adminAuth, (req, res) => {
  const { title, description, imageUrl, withdrawalId } = req.body || {};
  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: "Vui lòng nhập tiêu đề." });
  }
  const item = Proofs.create({
    title: String(title).trim(),
    description: description ? String(description).trim() : null,
    imageUrl: imageUrl ? String(imageUrl).trim() : null,
    withdrawalId: withdrawalId || null,
  });
  res.status(201).json(item);
});

router.delete("/:id", adminAuth, (req, res) => {
  const proof = Proofs.get(req.params.id);
  if (!proof) {
    return res.status(404).json({ error: "Không tìm thấy minh chứng." });
  }
  if (proof.imageUrl && proof.imageUrl.includes("/uploads/")) {
    const filename = proof.imageUrl.split("/uploads/").pop();
    const fp = path.join(UPLOAD_DIR, filename);
    if (filename && fs.existsSync(fp)) {
      try {
        fs.unlinkSync(fp);
      } catch (err) {
        console.warn("Could not remove upload file:", err.message);
      }
    }
  }
  Proofs.delete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
