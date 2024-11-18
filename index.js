import { MatrixAuth } from "matrix-bot-sdk";
import express from "express";
import dotenv from "dotenv";
import * as Sentry from "@sentry/node";
import helmet from "helmet";

/**
 * LOGS
 */

export const logController = async (req, res, next) => {
  try {
    const { message, roomId } = req?.body;
    sendLogToTchap(roomId, message);
    res.status(200).json(tva);
  } catch (e) {
    next(e);
  }
};

const sendLogToTchap = async (roomId, message) => {
  const client = await TchapClient.get();

  await client.sendMessage(roomId, {
    msgtype: "m.text",
    body: message,
  });
};

/**
 * Tchap 2000 is a brand new product proudly shipped by DINUM ;)
 */
class Tchap2000 {
  _client = null;

  constructor(serverUrl, username, password) {
    this._serverUrl = serverUrl;
    this._username = username;
    this._password = password;
  }

  initialize = async () => {
    const auth = new MatrixAuth(serverUrl);
    client = await auth.passwordLogin(login, password);
    await client.start();
  };

  get = async () => {
    await this.initialize();
    if (!this._client) {
      throw new Error(`Client not initialized ; could not send message`);
    }
    return this._client;
  };
}

/**
 * SERVER
 */

dotenv.config();

const app = express();

const port = process.env.PORT || 3000;
const useSentry =
  process.env.NODE_ENV === "production" && process.env.SENTRY_DSN;

const TchapClient = new Tchap2000(
  process.env.MATRIX_SERVER_URL,
  process.env.TCHAP_USERNAME,
  process.env.TCHAP_PASSWORD
);

// parse incoming request json body
app.use(express.json());

// https://expressjs.com/fr/advanced/best-practice-security.html
app.use(helmet());

/**
 * Error handling
 */

if (useSentry) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [],
  });

  // The request handler must be the first middleware on the app
  app.use(Sentry.Handlers.requestHandler());
}

/**
 * Up and running
 */
app.get("/", (req, res) => {
  res.json({ message: "Server is up and running" });
});

/**
 * log a message in tchap
 */
app.post("/log", logController);

/**
 * Error handling
 */

if (useSentry) {
  // The error handler must be before any other error middleware and after all controllers
  app.use(Sentry.Handlers.errorHandler());
}

app.use(function (err, _req, res, _next) {
  res
    .status(err.status ?? 500)
    .json({ message: err.message || "Une erreur est survenue" });
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
