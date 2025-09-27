const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const app = express();


app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({ message: "Hello team if you see this on your browser it means setup success!" });
});

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

module.exports = app;


module.exports = app;
