const mongoose = require('mongoose');
const Models = require('./Models');

const AboutDAO = {
  async select() {
    try {
      let about = await Models.About.findOne().exec();
      if (!about) {
        // Nếu chưa có thì tạo mới một bản ghi mặc định
        const _id = new mongoose.Types.ObjectId();
        about = new Models.About({ _id });
        await about.save();
      }
      return about;
    } catch (error) {
      console.error('AboutDAO.select error:', error);
      return null;
    }
  },

  async update(aboutData) {
    try {
      const current = await this.select();
      if (current) {
        // Chỉ cập nhật các field có trong aboutData
        if (aboutData.title !== undefined) current.title = aboutData.title;
        if (aboutData.description !== undefined) current.description = aboutData.description;
        if (aboutData.image !== undefined) current.image = aboutData.image;
        if (aboutData.logo !== undefined) current.logo = aboutData.logo;
        if (aboutData.navbarLogo !== undefined) current.navbarLogo = aboutData.navbarLogo;
        if (aboutData.video !== undefined) current.video = aboutData.video;
        if (aboutData.philosophy !== undefined) current.philosophy = aboutData.philosophy;
        if (aboutData.mission !== undefined) current.mission = aboutData.mission;
        if (aboutData.vision !== undefined) current.vision = aboutData.vision;
        if (aboutData.values !== undefined) current.values = aboutData.values;
        
        const result = await current.save();
        return result;
      }
      return null;
    } catch (error) {
      console.error('AboutDAO.update error:', error);
      return null;
    }
  }
};

module.exports = AboutDAO;
