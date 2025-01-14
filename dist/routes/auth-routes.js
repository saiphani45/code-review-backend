"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const middleware_1 = require("../middleware/middleware");
const user_model_1 = __importDefault(require("../models/user-model"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = express_1.default.Router();
router.post("/github", async (req, res) => {
    try {
        const { github_id, username, email, access_token } = req.body;
        let user = await user_model_1.default.findOne({ github_id });
        if (!user) {
            user = await user_model_1.default.create({
                github_id,
                username,
                email,
                access_token,
            });
        }
        else {
            user.access_token = access_token;
            await user.save();
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: "24h",
        });
        res.json({ user, token });
    }
    catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});
// Fixed route handler with proper type annotations
router.get("/user", middleware_1.authMiddleware, async (req, res) => {
    var _a;
    try {
        const user = await user_model_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});
exports.default = router;
