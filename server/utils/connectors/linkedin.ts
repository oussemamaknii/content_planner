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


