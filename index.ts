import express, { Request } from 'express'
import NodeCache from 'node-cache'
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'

const APP_NAME = 'Local AWS Secrets Extension'

/**
 * NOOP cache, if caching is not enabled.
 */
const noopCache = {
  get: (key: string) => {
    console.debug(`${APP_NAME} cache not enabled, skipping get for key '${key}'`)
    return undefined
  },
  set: (key: string) => {
    console.debug(`${APP_NAME} cache not enabled, skipping set for key '${key}'`)
  }
}

/**
 * Pull environment variables.
 */
const AWS_REGION = process.env.AWS_REGION
const AWS_ENDPOINT = process.env.AWS_ENDPOINT
const PARAMETERS_SECRETS_EXTENSION_HTTP_PORT = process.env.PARAMETERS_SECRETS_EXTENSION_HTTP_PORT ?? 2773
const PARAMETERS_SECRETS_EXTENSION_CACHE_ENABLED = process.env.PARAMETERS_SECRETS_EXTENSION_CACHE_ENABLED !== 'false'
const PARAMETERS_SECRETS_EXTENSION_CACHE_SIZE = process.env.PARAMETERS_SECRETS_EXTENSION_CACHE_SIZE ? parseInt(process.env.PARAMETERS_SECRETS_EXTENSION_CACHE_SIZE) : 1000
const SECRETS_MANAGER_TTL = process.env.SECRETS_MANAGER_TTL ? parseInt(process.env.SECRETS_MANAGER_TTL) : 300

/**
 * Setup express server and cache instance.
 */
const app = express()
const secretsManagerClient = new SecretsManagerClient({ region: AWS_REGION, endpoint: AWS_ENDPOINT })
const secretsCache = PARAMETERS_SECRETS_EXTENSION_CACHE_ENABLED
  ? new NodeCache({
      maxKeys: PARAMETERS_SECRETS_EXTENSION_CACHE_SIZE,
      stdTTL: SECRETS_MANAGER_TTL
    })
  : noopCache

/**
 * Emulate the main endpoint to fetch secrets by secretId.
 */
app.get('/secretsmanager/get', async (req: Request<undefined, { SecretString: string }, undefined, { secretId: string }>, res) => {
  const secretId = req.query.secretId

  console.log(`${APP_NAME} fetching secret: '${secretId}'`)

  const cachedSecret = secretsCache.get<string>(secretId)

  if (cachedSecret) {
    console.debug(`Returning cached secret for ID '${secretId}'`)

    return res.send({
      SecretString: cachedSecret
    })
  }

  console.debug(`Cache miss for secret ID '${secretId}'`)

  const response = await secretsManagerClient.send(
    new GetSecretValueCommand({
      SecretId: secretId
    })
  )

  if (!response.SecretString) {
    throw new Error(`No secret string defined in secret '${secretId}'`)
  }

  secretsCache.set(secretId, response.SecretString)

  res.setHeader('Content-Type', 'application/json')
  res.send({ SecretString: response.SecretString })
})

app.listen(PARAMETERS_SECRETS_EXTENSION_HTTP_PORT, () => {
  console.log(`${APP_NAME} listening on port ${PARAMETERS_SECRETS_EXTENSION_HTTP_PORT}`)
})
