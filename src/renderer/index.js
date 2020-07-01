import fs from "fs";
import "./index.css";

console.log(fs.readlinkSync);

const app = document.getElementById("app");
app.classList.add("App");
app.innerHTML = "<h2>Portainer Desktop</h2><p>Loading</p>";
document.title = "Portainer Desktop";
