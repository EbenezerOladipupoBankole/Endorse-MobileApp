async function testFetch() {
  try {
    const url = 'https://does-not-exist-123456789.expo.dev';
    console.log('Fetching invalid url:', url);
    await fetch(url);
  } catch (err) {
    console.error('Fetch failed structure:');
    console.error('Name:', err.name);
    console.error('Message:', err.message);
    console.error('Code:', err.code);
    console.error('Has Cause:', !!err.cause);
    if (err.cause) {
      console.error('Cause Name:', err.cause.name);
      console.error('Cause Message:', err.cause.message);
      console.error('Cause Code:', err.cause.code);
    }
  }
}
testFetch();
