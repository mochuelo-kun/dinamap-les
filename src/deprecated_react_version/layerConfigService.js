import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'

const S3_REGION = 'ap-southeast-1'
const BUCKET_NAME = 'dinamap-les'
const BUCKET_PREFIX = 'metadata/'

const s3Client = new S3Client({
    region: S3_REGION,
    // hack: client requires credentials but the bucket is public for read actions
    credentials: { accessKeyId: '', secretAccessKey: '' },
    signer: { sign: async (req) => req },
})

const getS3FileContent = async (key) => {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    })

    const response = await s3Client.send(command)
    const str = await response.Body.transformToString()
    return JSON.parse(str)
}

export const getLatestLayerConfig = async () => {
    const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: BUCKET_PREFIX,
    })

    const response = await s3Client.send(command)
    const jsonFiles = response.Contents.filter((item) => item.Key.endsWith('.json'))

    if (jsonFiles.length === 0) {
        throw new Error('No JSON configuration files found in S3.')
    }

    let latestConfig = null
    let latestDate = null

    for (const file of jsonFiles) {
        const content = await getS3FileContent(file.Key)
        const updatedAt = new Date(content.updatedAt.replace(/'/g, ''))

        if (!latestDate || updatedAt > latestDate) {
            latestDate = updatedAt
            latestConfig = content
        }
    }

    return latestConfig
}
