require("./utils/MongooseUtil");
const Models = require("./models/Models");
const mongoose = require("mongoose");

async function createAdmin() {
  try {
    const username = "admin";
    const password = "123";

    // Make the script idempotent: update password if admin exists
    const existing = await Models.Admin.findOne({ username });
    if (existing) {
      if (existing.password !== password) {
        existing.password = password;
        await existing.save();
        console.log("Admin password updated:", existing.username);
      } else {
        console.log(
          "Admin already exists with same password:",
          existing.username,
        );
      }
    } else {
      const admin = new Models.Admin({
        _id: new mongoose.Types.ObjectId(),
        username,
        password,
      });
      await admin.save();
      console.log("Admin created successfully:", admin.username);
    }
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
}

createAdmin();
