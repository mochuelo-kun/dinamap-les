import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";

const REGION  = import.meta.env.VITE_AWS_REGION;
const POOL_ID = import.meta.env.VITE_AWS_IDENTITY_POOL_ID;
const BUCKET  = import.meta.env.VITE_S3_BUCKET;

const PUBLIC_PREFIX = import.meta.env.VITE_S3_PUBLIC_PREFIX ?? "public/";
const GEOJSON_PREFIX  = `${PUBLIC_PREFIX}${import.meta.env.VITE_S3_GEOJSON_PREFIX ?? "geojson/"}`;

export const S3_CONFIG = { REGION, BUCKET, GEOJSON_PREFIX };

export const s3 = new S3Client({
  region: REGION,
  credentials: fromCognitoIdentityPool({
    clientConfig: { region: REGION },
    identityPoolId: POOL_ID,
  }),
  requestChecksumCalculation: "WHEN_REQUIRED",
});

// NOTE: removed per-user folders in favor of shared public folder
// const idClient = new CognitoIdentityClient({ region: REGION });
// let cachedIdentityId= null;

// export async function getIdentityId() {
//   if (cachedIdentityId) return cachedIdentityId;
//   const out = await idClient.send(new GetIdCommand({ IdentityPoolId: POOL_ID }));
//   // Example: "ap-southeast-1:12345678-90ab-cdef-1234-567890abcdef"
//   cachedIdentityId = out.IdentityId;
//   return cachedIdentityId;
// }

// // Build a per-user prefix that matches your bucket policy
// async function userPrefix() {
//   const id = await getIdentityId();
//   return `${id}/`;            // => "ap-southeast-1:GUID/"
// }

export async function putRemoteGeoJSON(fileName, featureCollection) {
  const body = new Blob([JSON.stringify(featureCollection, null, 2)], { type: "application/geo+json" });
  const key = fileName;

  const putResults = await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key.startsWith(GEOJSON_PREFIX) ? key : `${GEOJSON_PREFIX}${key}`,
    Body: await body.arrayBuffer(),
    ContentType: "application/geo+json",
    CacheControl: "no-cache"
  }));
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${encodeURIComponent(key.startsWith(GEOJSON_PREFIX)? key : GEOJSON_PREFIX+key)}`;
}

export async function listRemoteGeoJSON() {
  const out = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: GEOJSON_PREFIX }));
  return (out.Contents ?? []).map(o => (o != null && o.Key)).filter(k => k.endsWith(".geojson"));
}

export async function getRemoteGeoJSON(key) {
  const out = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const text = await out.Body.transformToString();
  return JSON.parse(text);
}