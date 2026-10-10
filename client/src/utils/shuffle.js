/**
 * Unbiased shuffle — Fisher-Yates.
 *
 * WHY NOT `.sort(() => Math.random() - 0.5)`: that comparator is inconsistent
 * (it never returns 0 for equal elements, so engines are free to treat it as
 * arbitrary) and it is measurably biased — middle elements get more chances to
 * land in the middle. For a 10-card batch the skew is small but it is real, and
 * the cost of doing this correctly is four lines.
 *
 * WHY A COPY: the caller keeps the original. `sort` mutates in place, and the
 * array passed in belongs to the API response, which is also the thing we log
 * and store.
 *
 * @template T
 * @param {T[]} items
 * @returns {T[]} a new array, same members, any order
 */
const shuffle = (items) => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

export default shuffle;