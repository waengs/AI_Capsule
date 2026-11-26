// Thin fetch wrapper used by every API call in the app.
// Sends cookies, sets JSON headers, parses the response, and throws on non-2xx.
async function request(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'include', // Send the HttpOnly session cookie with each request.
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  // Parse the body as JSON when possible, otherwise keep it as raw text.
  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  // Turn HTTP errors into thrown Errors so callers can use try/catch.
  if (!res.ok) {
    const message = (data && data.error) || res.statusText || 'Request failed';
    const error = new Error(message);
    error.status = res.status; // Expose status (e.g. 401) for callers that care.
    throw error;
  }

  return data;
}

// Fetch the currently logged-in user (401 if not authenticated).
export function getMe() {
  return request('/auth/me');
}

// End the session by clearing the auth cookie.
export function logout() {
  return request('/auth/logout', { method: 'POST' });
}

// List the current user's saved capsules.
export function listCapsules() {
  return request('/api/capsules');
}

// Create a new capsule from the given form body.
export function createCapsule(body) {
  return request('/api/capsules', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

// Update the capsule with the given id.
export function updateCapsule(id, body) {
  return request(`/api/capsules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
}

// Delete the capsule with the given id.
export function deleteCapsule(id) {
  return request(`/api/capsules/${id}`, {
    method: 'DELETE'
  });
}
