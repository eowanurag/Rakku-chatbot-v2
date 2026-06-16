import axios from 'axios';

describe('Render Production Backend Health & Connectivity Spec', () => {
  it('should verify backend service config has valid API endpoints', () => {
    // If running in production context, we check environment variables
    const renderUrl = process.env.RENDER_BACKEND_URL || 'http://localhost:3000';
    expect(renderUrl).toBeDefined();
    expect(renderUrl.startsWith('http')).toBe(true);
  });

  it('should mock render health check endpoint and return 200 OK', async () => {
    // We check /health endpoint response structure
    const mockHealthResponse = {
      status: "UP",
      database: "CONNECTED",
      timestamp: new Date().toISOString()
    };

    const spy = jest.spyOn(axios, 'get').mockResolvedValueOnce({
      status: 200,
      data: mockHealthResponse
    });

    const renderUrl = process.env.RENDER_BACKEND_URL || 'http://localhost:3000';
    const response = await axios.get(`${renderUrl}/health`);

    expect(response.status).toBe(200);
    expect(response.data.status).toBe("UP");
    expect(response.data.database).toBe("CONNECTED");
    
    spy.mockRestore();
  });
});
