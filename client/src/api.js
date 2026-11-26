// all the api calls go through this
// send the session cookie and turn failed responses into errors
async function request(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'include', // include the session cookie
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  // keep the response as text if it isnt json
  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  // let callers handle failed requests with try/catch
  if (!res.ok) {
    const message = (data && data.error) || res.statusText || 'Request failed';
    const error = new Error(message);
    error.status = res.status; // keep the status so callers can check for a 401
    throw error;
  }

  return data;
}

// check whos signed in
export function getMe() {
  return request('/auth/me');
}

// clear the session cookie
export function logout() {
  return request('/auth/logout', { method: 'POST' });
}

// load the users saved capsules
export function listCapsules() {
  return request('/api/capsules');
}

// save a new capsule
export function createCapsule(body) {
  return request('/api/capsules', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

// save changes to this capsule
export function updateCapsule(id, body) {
  return request(`/api/capsules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
}

// remove this capsule
export function deleteCapsule(id) {
  return request(`/api/capsules/${id}`, {
    method: 'DELETE'
  });
}
