const store = {
  profiles: [],
  currentIndex: 0,
  hasMore: true,
};

export const discoverStore = store;

export const resetDiscoverStore = () => {
  store.profiles = [];
  store.currentIndex = 0;
  store.hasMore = true;
};