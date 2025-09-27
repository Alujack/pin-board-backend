exports.login = (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "1234") {
    return res.json({ token: "fake-jwt-token" });
  }
  res.status(401).json({ message: "Invalid credentials" });
};
