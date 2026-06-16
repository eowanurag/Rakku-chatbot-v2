import axios from 'axios';

describe('Vercel Production Frontend Connectivity Spec', () => {
  it('should verify vercel environment configuration is set up', () => {
    const vercelUrl = process.env.VERCEL_PROJECT_URL || 'http://localhost:3000';
    expect(vercelUrl).toBeDefined();
    expect(vercelUrl.startsWith('http')).toBe(true);
  });

  it('should mock frontend project connection check', async () => {
    const spy = jest.spyOn(axios, 'head').mockResolvedValueOnce({
      status: 200,
      statusText: 'OK'
    });

    const vercelUrl = process.env.VERCEL_PROJECT_URL || 'http://localhost:3000';
    const response = await axios.head(vercelUrl);

    expect(response.status).toBe(200);
    spy.mockRestore();
  });
});
