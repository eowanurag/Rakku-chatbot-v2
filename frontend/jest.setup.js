import '@testing-library/jest-dom';

if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(""),
    })
  );
}

