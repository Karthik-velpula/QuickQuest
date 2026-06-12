import "./env.js";
import { app } from "./app.js";

const port = Number(process.env.PORT) || 4000;
const mysqlHost = process.env.MYSQL_HOST ?? "(unset)";
const mysqlUser = process.env.MYSQL_USER ?? "(unset)";
const mysqlDb = process.env.MYSQL_DATABASE ?? "(unset)";
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
  console.log(`MySQL config host=${mysqlHost} user=${mysqlUser} database=${mysqlDb} ssl=${process.env.MYSQL_SSL ?? "true"} ca=${process.env.MYSQL_CA_CERT ? "set" : "unset"}`);
});
