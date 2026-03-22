const { MAPPLS_CLIENT_ID, MAPPLS_CLIENT_SECRET } = process.env;

async function test() {
  const t_res = await fetch('https://outpost.mapmyindia.com/api/security/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: MAPPLS_CLIENT_ID,
      client_secret: MAPPLS_CLIENT_SECRET
    })
  });
  const t_data = await t_res.json();
  const token = t_data.access_token;
  console.log('TOKEN LEN:', token?.length);
  
  if (!token) return console.log('OAUTH FAILED:', t_data);

  // Test Nearby
  const r1 = await fetch('https://atlas.mapmyindia.com/api/places/nearby/json?keywords=Police&refLocation=26.8366,75.5648&radius=5000', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('NEARBY ATLAS:', r1.status);

  // Test Nearby Search Mappls
  const r2 = await fetch('https://search.mappls.com/search/places/nearby/json?keywords=Police&refLocation=26.8366,75.5648&radius=5000', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('NEARBY SEARCH MAPPLS:', r2.status);
  
  // Test Reverse
  const r3 = await fetch('https://atlas.mapmyindia.com/api/places/rev_geocode?lat=26.8366&lng=75.5648', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('REV ATLAS:', r3.status);

  const r4 = await fetch('https://search.mappls.com/search/address/rev-geocode?lat=26.8366&lng=75.5648', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('REV SEARCH MAPPLS:', r4.status);
}
test();
