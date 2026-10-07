const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Sends a track image to the backend for YOLO11 inference.
 * @param {File} file - The image file to analyze
 * @param {number|null} [confidence] - Optional confidence threshold (0.01 - 1.0)
 * @returns {Promise<Object>} Detection response
 */
export async function detectImage(file, confidence = null) {
  const formData = new FormData();
  formData.append("image", file);
  if (confidence !== null && confidence !== undefined) {
    formData.append("confidence", confidence.toString());
  }

  let response;
  try {
    response = await fetch(`${API_URL}/api/detect`, {
      method: "POST",
      body: formData,
    });
  } catch (err) {
    throw new Error(
      "Unable to connect to RailGuard backend service. Please verify that the server is running on " + API_URL
    );
  }

  if (!response.ok) {
    let errorDetail = "Detection failed. Please check the uploaded image and try again.";
    try {
      const errorJson = await response.json();
      if (errorJson && errorJson.detail) {
        errorDetail = errorJson.detail;
      }
    } catch (_) {
      // Fallback to HTTP status text
      errorDetail = `Server returned status ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

/**
 * Checks backend health and YOLO11 model readiness.
 * @returns {Promise<Object>}
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${API_URL}/api/health`);
    if (!response.ok) {
      return { status: "unhealthy", model_loaded: false };
    }
    return await response.json();
  } catch (err) {
    return { status: "offline", model_loaded: false, error: err.message };
  }
}

/**
 * Resolves full URL for an annotated image path or ID.
 * @param {string} pathOrId
 * @returns {string}
 */
export function getResultImageUrl(pathOrId) {
  if (!pathOrId) return "";
  if (pathOrId.startsWith("http://") || pathOrId.startsWith("https://")) {
    return pathOrId;
  }
  if (pathOrId.startsWith("/")) {
    return `${API_URL}${pathOrId}`;
  }
  return `${API_URL}/api/result/${pathOrId}`;
}
