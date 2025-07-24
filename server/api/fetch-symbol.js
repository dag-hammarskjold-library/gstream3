import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm"
import axios from "axios"
import dayjs from 'dayjs'
import AdmZip from 'adm-zip'

export default defineEventHandler(async (event) => {
    // First get the data we need from the Parameter Store
    const config = useRuntimeConfig()
    const gdocEnv = config.public.gdocEnv
    console.log("Using GDOC_ENV", gdocEnv)
    const id = config.AwsAcessKeyId
    const key = config.AwsSecretAccessKey


    const credentials = () => {
        return {
            accessKeyId: id,
            secretAccessKey: key
        }
    }

    console.log("Authenticating with AWS")
    const ssm = new SSMClient({
        region: 'us-east-1',
        credentials: credentials
    })

    const parameter = `gdoc-${gdocEnv}-api-secrets`
    const command = new GetParameterCommand({
        Name: parameter,
        WithDecryption: false
    })

    console.log("Getting parameter", parameter)
    const response = await ssm.send(command)
    const gdocSecrets = JSON.parse(response.Parameter.Value)

    // Now we can go fetch our documents
    // We need to authenticate:
    console.log("Authenticating with gDoc API.")
    const token_url = gdocSecrets.token_url
    const tokenResponse = await fetch(token_url, {
        method: 'POST',
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            'client_id': gdocSecrets.client_id,
            'client_secret': gdocSecrets.client_secret,
            'scope': gdocSecrets.scope,
            'grant_type': 'client_credentials'
        })
    })
    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // And now we can grab the list of files for the day in question
    const symbolsRequestHeaders = {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Ocp-Apim-Subscription-Key": gdocSecrets.ocp_apim_subscription_key
    }

    // Set the defaults if we didn't get anything in the URL
    const query = getQuery(event)
    const date = query.date ? query.date : dayjs().subtract(1, 'day').format('YYYY-MM-DD')
    const dutyStation = query.dutyStation ? query.dutyStation : "New York"
    const symbol = query.symbol ? query.symbol : null

    if (!symbol) {
        return {}
    }

    // Construct the API request, from which we expect a binary file, signified by arraybuffer
    console.log(`Fetching zip file from gDoc API at ${gdocSecrets.api_url} for ${date} and ${dutyStation} and ${symbol}`)
    const symbolsUrl = `${gdocSecrets.api_url}?dateFrom=${date}&dateTo=${date}&dutyStation=${dutyStation}&Symbol=${symbol}&DownloadFiles=N`
    const symbolsResponse = await axios.get(symbolsUrl, {
        headers: symbolsRequestHeaders,
        responseType: 'arraybuffer'
    })
    const zipBuffer = Buffer.from(symbolsResponse.data)
    const zip = new AdmZip(zipBuffer)
    const zipEntry = zip.getEntry('export.txt')
    const filesList = JSON.parse(zipEntry.getData().toString('utf8'))

    // Now we need to iterate through this data to organize by symbol
    let foundSymbols = []
    let symbolObjects = {}
    filesList.forEach(f => {
        if (foundSymbols.includes(f.symbol1)) {
            // We'll add to an existing record
            symbolObjects[f.symbol1].files.push({
                "embargo": f.embargo,
                "languageId": f.languageId,
                "odsNo": f.odsNo,
                "registrationDate": f.registrationDate,
                "officialSubmissionDate": f.officialSubmissionDate
            })
        } else {
            // We'll create a new record
            symbolObjects[f.symbol1] = {
                "agendaNo": f.agendaNo,
                "jobId": f.jobId,
                "symbol1": f.symbol1,
                "symbol2": f.symbol2,
                "area": f.area,
                "sessionNo": f.sessionNo,
                "distributionType": f.distributionType,
                "title": f.title,
                "files": [{
                    "embargo": f.embargo,
                    "languageId": f.languageId,
                    "odsNo": f.odsNo,
                    "registrationDate": f.registrationDate,
                    "officialSubmissionDate": f.officialSubmissionDate
                }]
            }
            foundSymbols.push(f.symbol1)
        }
    })

    let returnData = []
    for (let k in symbolObjects) {
        returnData = symbolObjects[k]
    }

    console.log(`Found ${filesList.length} files across ${foundSymbols.length} symbols.`)
    return returnData
})
