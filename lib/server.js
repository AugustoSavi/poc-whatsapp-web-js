"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const _1 = __importStar(require("."));
const logger_1 = __importDefault(require("./Utils/logger"));
const logger = logger_1.default.child({});
logger.level = 'trace';
const port = process.env.PORT || 8000;
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// the store maintains the data of the WA connection in memory
// can be written out to a file & read from it
const store = (0, _1.makeInMemoryStore)({ logger });
store.readFromFile('./baileys_store_multi.json');
// save every 10s
setInterval(() => {
    store.writeToFile('./baileys_store_multi.json');
}, 10000);
const { state, saveState } = (0, _1.useSingleFileAuthState)('./auth_info_multi.json');
// start a connection
const startSock = async () => {
    // fetch latest version of WA Web
    const { version, isLatest } = await (0, _1.fetchLatestBaileysVersion)();
    console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`);
    const sock = (0, _1.default)({
        version,
        logger,
        printQRInTerminal: true,
        auth: state,
    });
    store.bind(sock.ev);
    sock.ev.on('connection.update', (update) => {
        var _a, _b;
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            // reconnect if not logged out
            if (((_b = (_a = lastDisconnect.error) === null || _a === void 0 ? void 0 : _a.output) === null || _b === void 0 ? void 0 : _b.statusCode) !== _1.DisconnectReason.loggedOut) {
                startSock();
            }
            else {
                console.log('Connection closed. You are logged out.');
            }
        }
        // console.log('connection update', update)
    });
    // listen for when the auth credentials is updated
    sock.ev.on('creds.update', saveState);
    app.post('/send-message', async (req, res) => {
        const number = req.body.number + '@s.whatsapp.net';
        const message = req.body.message;
        // console.log(number, message)
        sock.sendMessage(number, { text: message }).then(response => {
            res.status(200).json({
                status: true,
                response: response
            });
        }).catch(err => {
            res.status(500).json({
                status: false,
                response: err
            });
        });
    });
    return sock;
};
startSock();
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
