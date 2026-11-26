import * as results from '../services/results.service.js'

export async function create(req, res) {
  const body = req.valid.body
  const items = Array.isArray(body) ? body : [body]
  const outcome = await results.createResults(items, req.user?.id)
  // 201 when something new was stored; 200 when every item was a repeat.
  res.status(outcome.created > 0 ? 201 : 200).json(outcome)
}

export async function list(req, res) {
  res.json(await results.listResults(req.valid.query))
}

export async function listMine(req, res) {
  res.json(await results.listResults(req.valid.query, { onlyUserId: req.user.id }))
}

export async function getOne(req, res) {
  res.json(await results.getResult(req.valid.params.id, req.user))
}
