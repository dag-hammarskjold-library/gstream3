import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm"
import axios from "axios"
import dayjs from 'dayjs'
import AdmZip from 'adm-zip'

export default defineEventHandler(async (event) => {
    // First get the data we need from the Parameter Store
    console.log("Authenticating with AWS and getting parameters.")
    const config = useRuntimeConfig()

    const credentials = () => {
        if (process.env.AMP) {
            // We're in an Amplify deploy
            return {
                roleArn: `arn:aws:iam::${process.env.ACCOUNT}:role/service-role/AmplifySSRLoggingRole-3c3b924d-4fbc-4925-bb44-215e447c8bb7`
            }
        } else {
            return {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        }
    }

    const ssm = new SSMClient({
        region: process.env.AWS_DEFAULT_REGION,
        credentials: credentials
    })

    const command = new GetParameterCommand({
        Name:`gdoc-${config.public.GDOC_ENV}-api-secrets`,
        WithDecryption: false
    })

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

    // Construct the API request, from which we expect a binary file, signified by arraybuffer
    console.log(`Fetching zip file from gDoc API at ${gdocSecrets.api_url} for ${date} and ${dutyStation}`)
    const symbolsUrl = `${gdocSecrets.api_url}?dateFrom=${date}&dateTo=${date}&dutyStation=${dutyStation}`
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
        returnData.push(symbolObjects[k])
    }

    console.log(`Found ${filesList.length} files across ${foundSymbols.length} symbols.`)
    return returnData
})