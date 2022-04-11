import Router from '@koa/router'

import { ReportController } from '../controllers/ReportController'

export function createReportRouter(reportController: ReportController) {
  const router = new Router()

  router.get('/api/data', async (ctx) => {
    ctx.body = await reportController.getDaily()
  })

  return router
}
