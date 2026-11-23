/** Where the recipe list was scrolled to, so "back" from a recipe returns you to the same spot. */
let position = 0;
export const rememberListScroll = () => {
  position = window.scrollY;
};
export const savedListScroll = () => position;
