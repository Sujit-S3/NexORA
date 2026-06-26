const UserPreference = require('../../../models/UserPreference');

class PreferenceContext {
  async build(userId) {
    if (!userId) return null;
    const prefs = await UserPreference.findOne({ user: userId });
    
    if (!prefs) return null;

    return {
      brands: prefs.favoriteBrands,
      categories: prefs.favoriteCategories,
      budget: prefs.budget,
      style: prefs.style,
      materials: prefs.preferredMaterials,
      metals: prefs.preferredMetals
    };
  }
}

module.exports = new PreferenceContext();
