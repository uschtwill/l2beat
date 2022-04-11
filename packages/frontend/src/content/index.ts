import { HttpClient } from '@l2beat/common'
import { projects } from '@l2beat/config'

import { createApi } from './api'
import { renderPages } from './pages'

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

async function main() {
  const http = new HttpClient()
  const response = await http.fetch('https://api.l2beat.com/api/data')
  const l2Data = await response.json()
  createApi(projects, l2Data)
  await renderPages(projects, l2Data)
}
