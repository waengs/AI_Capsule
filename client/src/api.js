async function request(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message = (data && data.error) || res.statusText || 'Request failed';
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return data;
}

export function getMe() {
  return request('/auth/me');
}

export function logout() {
  return request('/auth/logout', { method: 'POST' });
}

export function listCapsules() {
  return request('/api/capsules');
}

export function createCapsule(body) {
  return request('/api/capsules', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export function updateCapsule(id, body) {
  return request(`/api/capsules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
}

export function deleteCapsule(id) {
  return request(`/api/capsules/${id}`, {
    method: 'DELETE'
  });
}
