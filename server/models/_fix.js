const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "ProductDAO.js");
let content = fs.readFileSync(filePath, "utf8");

content = content.replace(
  "{ $regex: keyword, $options: 'i' }",
  '{ $regex: new RegExp(keyword, "i") }',
);

fs.writeFileSync(filePath, content);
console.log("ProductDAO.js updated successfully");
