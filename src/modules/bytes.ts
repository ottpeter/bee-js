import type { BatchId, BeeRequestOptions, Data, Reference, ReferenceOrEns, UploadOptions } from '../types'
import { UploadResult } from '../types'
import { wrapBytesWithHelpers } from '../utils/bytes'
import { extractUploadHeaders } from '../utils/headers'
import { http } from '../utils/http'
import { makeTagUid } from '../utils/type'

const endpoint = 'bytes'

/**
 * Upload data to a Bee node
 *
 * @param kyOptions Ky Options for making requests
 * @param data            Data to be uploaded
 * @param postageBatchId  Postage BatchId that will be assigned to uploaded data
 * @param options         Additional options like tag, encryption, pinning
 */
export async function upload(
  requestOptions: BeeRequestOptions,
  data: string | Uint8Array,
  postageBatchId: BatchId,
  options?: UploadOptions,
): Promise<UploadResult> {
  const response = await http<{ reference: Reference }>(requestOptions, {
    url: endpoint,
    method: 'post',
    responseType: 'json',
    data,
    headers: {
      'content-type': 'application/octet-stream',
      ...extractUploadHeaders(postageBatchId, options),
    },
  })

  return {
    reference: response.data.reference,
    tagUid: response.headers['swarm-tag'] ? makeTagUid(response.headers['swarm-tag']) : undefined,
  }
}

/**
 * Download data as a byte array
 *
 * @param ky
 * @param hash Bee content reference
 */
export async function download(requestOptions: BeeRequestOptions, hash: ReferenceOrEns): Promise<Data> {
  const response = await http<ArrayBuffer>(requestOptions, {
    responseType: 'arraybuffer',
    url: `${endpoint}/${hash}`,
  })

  return wrapBytesWithHelpers(new Uint8Array(response.data))
}

/**
 * Download data as a readable stream
 *
 * @param ky
 * @param hash Bee content reference
 */
export async function downloadReadable(
  requestOptions: BeeRequestOptions,
  hash: ReferenceOrEns,
): Promise<ReadableStream<Uint8Array>> {
  const response = await http<ReadableStream<Uint8Array>>(requestOptions, {
    responseType: 'stream',
    url: `${endpoint}/${hash}`,
  })

  return response.data
}
