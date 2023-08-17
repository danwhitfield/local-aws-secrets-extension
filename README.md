# local-aws-secrets-extension

Emulation of the AWS Parameters and Secrets Lambda Extension for local development

## Usage

### Docker Build

```bash
docker build -t local-aws-secrets-extension:1.0 .
```

### Docker Compose

```yaml
  aws-secrets-extension:
    image: local-aws-secrets-extension:1.0
    environment:
      - AWS_REGION=ap-southeast-2
      - AWS_ACCESS_KEY_ID=local
      - AWS_SECRET_ACCESS_KEY=local
      - AWS_ENDPOINT=http://localstack:4566
    depends_on:
      - localstack
    networks:
      - default
```
