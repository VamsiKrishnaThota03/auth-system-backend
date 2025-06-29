"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
exports.authRouter = (0, express_1.Router)();
// Public routes
exports.authRouter.post('/signup', auth_controller_1.AuthController.signup);
exports.authRouter.post('/login', auth_controller_1.AuthController.login);
// Protected routes
exports.authRouter.get('/me', auth_middleware_1.authenticateToken, auth_controller_1.AuthController.getCurrentUser);
