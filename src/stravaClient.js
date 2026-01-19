const STRAVA_API_BASE_URL = 'https://www.strava.com/api/v3';

export function mapStravaTypeToDiscipline(type) {
  switch (type) {
    case 'Swim':
      return 'swim';
    case 'Ride':
      return 'bike';
    case 'Run':
      return 'run';
    default:
      return null;
  }
}

export async function fetchActivitiesPage({
  accessToken,
  page = 1,
  perPage = 50,
  after,
  before,
}) {
  const url = new URL(`${STRAVA_API_BASE_URL}/athlete/activities`);
  url.searchParams.set('page', String(page));
  url.searchParams.set('per_page', String(perPage));

  if (after) {
    url.searchParams.set('after', String(after));
  }

  if (before) {
    url.searchParams.set('before', String(before));
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Strava API error ${response.status}: ${message}`);
  }

  return response.json();
}
