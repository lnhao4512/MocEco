const mongoose = require('mongoose');
const Models = require('./Models');

const SkinAnalysisDAO = {
  async insert(data) {
    try {
      const _id = new mongoose.Types.ObjectId();
      const analysis = new Models.SkinAnalysis({
        _id,
        userId: data.userId,
        image: data.image,
        skinType: data.skinType,
        concerns: data.concerns,
        reasons: data.reasons, // Mapping reasons
        recommendations: data.recommendations,
        createdAt: data.createdAt || new Date()
      });
      await analysis.save();
      return analysis;
    } catch (error) {
      console.error('SkinAnalysisDAO.insert error:', error);
      throw error; // Throwing error so the calling side knows it failed
    }
  },

  async selectByUserId(userId) {
    try {
      const query = { userId: userId };
      const analyses = await Models.SkinAnalysis.find(query).sort({ createdAt: -1 }).exec();
      return analyses;
    } catch (error) {
      console.error('SkinAnalysisDAO.selectByUserId error:', error);
      return [];
    }
  },

  async deleteById(_id) {
    try {
      const result = await Models.SkinAnalysis.findByIdAndDelete(_id);
      return result;
    } catch (error) {
      console.error('SkinAnalysisDAO.deleteById error:', error);
      throw error;
    }
  },

  async deleteByUserId(userId) {
    try {
      const result = await Models.SkinAnalysis.deleteMany({ userId: userId });
      return result;
    } catch (error) {
      console.error('SkinAnalysisDAO.deleteByUserId error:', error);
      throw error;
    }
  }
};

module.exports = SkinAnalysisDAO;
