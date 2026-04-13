const mongoose = require('mongoose');
const Models = require('./Models');

const HeroDAO = {
  async select() {
    try {
      let hero = await Models.Hero.findOne().exec();
      if (!hero) {
        const _id = new mongoose.Types.ObjectId();
        hero = new Models.Hero({ _id });
        await hero.save();
      }
      return hero;
    } catch (error) {
      console.error('HeroDAO.select error:', error);
      return null;
    }
  },

  async update(heroData) {
    try {
      const current = await this.select();
      if (current) {
        if (heroData.video !== undefined) current.video = heroData.video;
        const result = await current.save();
        return result;
      }
      return null;
    } catch (error) {
      console.error('HeroDAO.update error:', error);
      return null;
    }
  }
};

module.exports = HeroDAO;
