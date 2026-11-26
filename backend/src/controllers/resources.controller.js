import * as resources from '../services/resources.service.js'

export async function list(req, res) {
  res.json(await resources.listResources(req.valid.query))
}

export async function update(req, res) {
  res.json(await resources.updateResource(req.valid.params.id, req.valid.body))
}
