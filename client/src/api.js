export async function api(path, { method = 'GET', body } = {}) {
  let response
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new Error('서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.')
  }

  if (response.status === 204) return
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.message || '요청을 처리하지 못했습니다. 서버가 실행 중인지 확인해 주세요.')
  return data
}
