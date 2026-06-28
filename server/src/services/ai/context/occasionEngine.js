const UserPreference = require('../../../models/UserPreference');
const { eventBus, EVENTS } = require('../../ai/utils/eventBus');

class OccasionEngine {
  constructor() {
    // Map of common keywords to occasions
    this.occasionKeywords = {
      'birthday': 'Birthday',
      'anniversary': 'Anniversary',
      'wedding': 'Wedding',
      'graduation': 'Graduation',
      'valentine': 'Valentines Day',
      'father': 'Fathers Day',
      'mother': 'Mothers Day',
      'christmas': 'Christmas',
      'holiday': 'Holiday',
      'investment': 'Investment',
      'daily': 'Daily Wear',
      'business': 'Business Attire',
    };
  }

  /**
   * Scans chat messages for occasion keywords and persists them to the user profile
   */
  async detectOccasion(userId, sessionId, userMessage) {
    if (!userMessage) {return;}

    const lowerMsg = userMessage.toLowerCase();
    const detectedOccasions = [];

    for (const [keyword, occasion] of Object.entries(this.occasionKeywords)) {
      if (lowerMsg.includes(keyword)) {
        detectedOccasions.push(occasion);
      }
    }

    if (detectedOccasions.length > 0) {
      const query = userId ? { userId } : { sessionId };
      let prefs = await UserPreference.findOne(query);
      if (!prefs) {
        prefs = new UserPreference({ userId, sessionId, occasions: [] });
      }

      // Add unique occasions
      detectedOccasions.forEach(occ => {
        if (!prefs.occasions.includes(occ)) {
          prefs.occasions.push(occ);
        }
      });

      await prefs.save();
    }
  }

  /**
   * Provides the active occasions to the Context Builder
   */
  async getActiveOccasions(userId, sessionId) {
    const query = userId ? { userId } : { sessionId };
    const prefs = await UserPreference.findOne(query).lean();
    if (!prefs) {return [];}

    return prefs.occasions || [];
  }
}

module.exports = new OccasionEngine();
