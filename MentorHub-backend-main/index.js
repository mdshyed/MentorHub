const app = require("./app");
const config = require("./config");
require("./services/email.service"); // Loads and verifies SMTP on startup

app.listen(config.PORT, () => {
  console.log(`Server is running on ${config.PORT}`);
});
