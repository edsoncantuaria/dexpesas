// backend/src/controllers/categoryMaintenanceController.js
import { resetCategoriesData } from '../services/categoryMaintenanceService.js';

class CategoryMaintenanceController {
  async resetCategories(req, res, next) {
    try {
      const summary = await resetCategoriesData();
      res.json({
        message: 'Categorias padronizadas com sucesso.',
        summary,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CategoryMaintenanceController();
