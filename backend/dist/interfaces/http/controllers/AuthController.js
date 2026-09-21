"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
class AuthController {
    authUseCase;
    constructor(authUseCase) {
        this.authUseCase = authUseCase;
    }
    login = async (req, res) => {
        try {
            const { username, password } = req.body;
            const result = await this.authUseCase.login(username, password);
            if (!result.success) {
                res.status(401).json({
                    error: 'Unauthorized',
                    message: result.message
                });
                return;
            }
            res.status(200).json({
                status: 'success',
                message: result.message,
                token: result.token,
                user: result.user
            });
        }
        catch (err) {
            res.status(500).json({
                error: 'InternalServerError',
                message: err.message
            });
        }
    };
    getMe = async (req, res) => {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized', message: 'No active session.' });
            return;
        }
        res.status(200).json({
            status: 'success',
            user: {
                username: req.user.username,
                role: req.user.role,
                fullName: req.user.fullName
            }
        });
    };
}
exports.AuthController = AuthController;
//# sourceMappingURL=AuthController.js.map