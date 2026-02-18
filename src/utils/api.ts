const headers: HeadersInit = {
  'Content-Type': 'application/json',
};

export const GET = async (
  url: string,
  options: RequestInit = {},
  cache: RequestCache = 'default', // Default cache setting
  ...restParams: RequestInit[]
): Promise<any> => {
  try {
    const response = await fetch(`/${url}`, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
      cache, // Include cache option
      ...restParams,
    });

    const result = await response.json();

    // Return the result regardless of status, let caller handle errors
    return result;
  } catch (error) {
    console.error('Error fetching data:', error);
    return { error: 'Network error occurred' };
  }
};

export const POST = async <T>(
  url: string,
  data: T,
  cache: RequestCache = 'default', // Default cache setting
  ...restParams: RequestInit[]
): Promise<any> => {
  try {
    const response = await fetch(`/${url}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      cache, // Include cache option
      ...restParams,
    });

    const result = await response.json();

    // Return the result regardless of status, let caller handle errors
    return result;
  } catch (error) {
    console.error('Error posting data:', error);
    return { error: 'Network error occurred' };
  }
};

export const PUT = async <T>(
  url: string,
  data: T,
  cache: RequestCache = 'default', // Default cache setting
  ...restParams: RequestInit[]
): Promise<any> => {
  try {
    const response = await fetch(`/${url}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
      cache, // Include cache option
      ...restParams,
    });

    const result = await response.json();

    // Return the result regardless of status, let caller handle errors
    return result;
  } catch (error) {
    console.error('Error updating data:', error);
    return { error: 'Network error occurred' };
  }
};

export const PATCH = async <T>(
  url: string,
  data: T,
  cache: RequestCache = 'default', // Default cache setting
  ...restParams: RequestInit[]
): Promise<any> => {
  try {
    const response = await fetch(`/${url}`, {
      method: 'PATCH',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      cache,
      ...restParams,
    });

    const result = await response.json();

    // Return the result regardless of status, let caller handle errors
    return result;
  } catch (error) {
    console.error('Error patching data:', error);
    return { error: 'Network error occurred' };
  }
};
