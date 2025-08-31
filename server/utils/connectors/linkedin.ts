export interface LinkedInAuth {
  accessToken: string
  providerUserId: string
}

export async function linkedinPublishText(auth: LinkedInAuth, text: string) {
  const author = `urn:li:person:${auth.providerUserId}`
  const body = {
    author,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text },
        shareMediaCategory: 'NONE'
      }
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
  }
  const res = await $fetch<any>('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    body,
    headers: { Authorization: `Bearer ${auth.accessToken}`, 'Content-Type': 'application/json' }
  })
  return res
}

// Register an image upload and return the asset URN and upload URL
export async function linkedinRegisterImageUpload(auth: LinkedInAuth, mimeType: string): Promise<{ asset: string; uploadUrl: string }> {
  const owner = `urn:li:person:${auth.providerUserId}`
  const body = {
    registerUploadRequest: {
      recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
      owner,
      serviceRelationships: [
        { relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' }
      ],
      supportedUploadMechanism: ['SYNCHRONOUS_UPLOAD']
    }
  }
  const res = await $fetch<any>('https://api.linkedin.com/v2/assets?action=registerUpload', {
    method: 'POST',
    body,
    headers: { Authorization: `Bearer ${auth.accessToken}`, 'Content-Type': 'application/json' }
  })
  const asset = res?.value?.asset as string
  const uploadUrl = res?.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl as string
  if (!asset || !uploadUrl) throw new Error('LinkedIn registerUpload failed')
  return { asset, uploadUrl }
}

export async function linkedinUploadBinaryToUrl(uploadUrl: string, buffer: Buffer, mimeType: string) {
  await $fetch(uploadUrl, {
    method: 'PUT',
    body: buffer as any,
    headers: { 'Content-Type': mimeType, 'Content-Length': String(buffer.length) }
  })
}

export async function linkedinPublishImage(auth: LinkedInAuth, text: string, assetUrn: string) {
  const author = `urn:li:person:${auth.providerUserId}`
  const body = {
    author,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text },
        shareMediaCategory: 'IMAGE',
        media: [
          {
            status: 'READY',
            media: assetUrn
          }
        ]
      }
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
  }
  const res = await $fetch<any>('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    body,
    headers: { Authorization: `Bearer ${auth.accessToken}`, 'Content-Type': 'application/json' }
  })
  return res
}


