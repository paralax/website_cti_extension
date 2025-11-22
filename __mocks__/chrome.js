
global.chrome = {
  storage: {
    local: {
      get: jest.fn((keys, callback) => {
        callback({ prompts: [] });
      }),
      set: jest.fn((items, callback) => {
        callback();
      }),
    },
  },
  runtime: {
    lastError: null,
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
  },
  identity: {
    getAuthToken: jest.fn(),
  },
};
