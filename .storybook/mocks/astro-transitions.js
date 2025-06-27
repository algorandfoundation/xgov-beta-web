export const navigate = (path) => {
  console.log('Storybook: Mock navigate called with:', path);
  // You could also use window.location.href = path if you want actual navigation in Storybook
};