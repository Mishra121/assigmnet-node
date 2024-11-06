
class GeneralController {
    static async healthCheck(req, res) {
        return res.json({
            status: 200,
            message: "health fine, running.",
        });
    }
}

export default GeneralController;