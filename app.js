const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'covid19India.db')
let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

const convertDbObjectToResponseObject = DbObject => ({
  stateId: DbObject.state_id,
  stateName: DbObject.state_name,
  population: DbObject.population,
})

app.get('/states/', async (request, response) => {
  const getALlStates = `
    select * from state order by state_id`
  const statesArray = await db.all(getALlStates)
  response.send(
    statesArray.map(eachState => convertDbObjectToResponseObject(eachState)),
  )
})

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getState = `
    select * from state where state_id=${stateId}`
  const state = await db.get(getState)
  const {state_id, state_name, population} = state
  const DbRespose = {
    stateId: state_id,
    stateName: state_name,
    population: population,
  }
  response.send(DbRespose)
})

app.post('/districts/', async (request, response) => {
  const getDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = getDetails
  const addDistrict = `
  Insert into district(district_name,state_id,cases,cured,active,deaths) 
  values('${districtName}','${stateId}','${cases}','${cured}','${active}','${deaths}')`
  await db.run(addDistrict)
  response.send('District Successfully Added')
})

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrict = `
    select * from district where district_id=${districtId}`
  const district = await db.get(getDistrict)
  const {district_id, district_name, state_id, cases, cured, active, deaths} =
    district

  const DbRespose = {
    districtId: district_id,
    districtName: district_name,
    stateId: state_id,
    cases: cases,
    cured: cured,
    active: active,
    deaths: deaths,
  }
  response.send(DbRespose)
})

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getBody = request.body
  const {districtName, stateId, cases, cured, active, deaths} = getBody
  const updateDistrict = `
  update district
  set district_name='${districtName}',
  state_id='${stateId}',
  cases='${cases}',
  cured='${cured}',
  active='${active}',
  deaths='${deaths}'`
  await db.run(updateDistrict)
  response.send('District Details Updated')
})

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrict = `
  delete from district
  where district_id=${districtId}`
  await db.run(deleteDistrict)
  response.send('District Removed')
})

app.get("/states/:stateId/stats/",async(request,response)=>{
  const {stateId}=request.params;
  const getStats=`
  select
  sum(cases),
  sum(cured),
  sum(active),
  sum(deaths)
  from district
  where state_id=${stateId}`;
  const stats=await db.get(getStats);
  response.send({
    totalCases:stats["sum(cases)"],
    totalCured:stats["sum(cured)"],
    totalActive:stats["sum(active)"],
    totalDeaths:stats["sum(deaths)"],
  });
});

app.get("/districts/:districtId/details/",async (request, response) => {
    const { districtId } = request.params;
    const getDistrictIdQuery = `
    select state_id from district
    where district_id = ${districtId};
    `;
    const getDistrictIdQueryResponse =await db.get(getDistrictIdQuery);
    const getStateNameQuery = `
    select state_name as stateName from state
    where state_id = ${getDistrictIdQueryResponse.state_id};
    `;
    const getStateNameQueryResponse =await db.get(getStateNameQuery);
    response.send(getStateNameQueryResponse);});
module.exports = app
