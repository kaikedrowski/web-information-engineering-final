const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

app.use(
  express.static(
    path.join(__dirname, "../client")
  )
);

app.listen(80, () => {
  console.log(`Server running`);
});