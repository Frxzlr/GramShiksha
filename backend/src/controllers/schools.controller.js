import * as schools from '../services/schools.service.js'

export async function list(req, res) {
  res.json(await schools.listSchools())
}

export async function getOne(req, res) {
  res.json(await schools.getSchoolWithResources(req.valid.params.id))
}
